from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.delivery import Delivery, DeliveryStatus
from app.models.stock_ledger import StockLedger, TransactionType
from app.models.product import Product
from app.schemas.delivery import DeliveryCreate, DeliveryResponse
from app.utils.reference_generator import generate_delivery_reference
from app.websocket.handlers import emit_stock_update, emit_delivery_created, emit_low_stock_alert

router = APIRouter()

@router.get("", response_model=List[DeliveryResponse])
def get_deliveries(
    status: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Delivery)
    
    if status:
        query = query.filter(Delivery.status == status)
    if warehouse_id:
        query = query.filter(Delivery.warehouse_id == warehouse_id)
    if search:
        query = query.filter(
            (Delivery.reference.ilike(f"%{search}%")) |
            (Delivery.delivery_address.ilike(f"%{search}%"))
        )
    
    deliveries = query.order_by(Delivery.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add related data
    result = []
    for delivery in deliveries:
        delivery_dict = {
            **delivery.__dict__,
            "warehouse_name": delivery.warehouse.name if delivery.warehouse else None,
            "location_name": delivery.location.name if delivery.location else None,
            "responsible_name": delivery.responsible_user.full_name if delivery.responsible_user else None,
            "items": [
                {
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None
                }
                for item in delivery.items
            ]
        }
        result.append(delivery_dict)
    
    return result

@router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(
    delivery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    delivery_dict = {
        **delivery.__dict__,
        "warehouse_name": delivery.warehouse.name if delivery.warehouse else None,
        "location_name": delivery.location.name if delivery.location else None,
        "responsible_name": delivery.responsible_user.full_name if delivery.responsible_user else None,
        "items": [
            {
                **item.__dict__,
                "product_name": item.product.name if item.product else None
            }
            for item in delivery.items
        ]
    }
    return delivery_dict

@router.post("", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
async def create_delivery(
    delivery_data: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check stock availability
    out_of_stock = []
    for item_data in delivery_data.products:
        # Get current stock for this product and location
        # Use explicit select with scalar_subquery for SQLAlchemy 2.0
        from sqlalchemy import select
        stock_query = select(func.sum(StockLedger.quantity)).where(
            StockLedger.product_id == item_data.product_id,
            StockLedger.location_id == delivery_data.location_id
        )
        stock = db.scalar(stock_query) or 0
        
        if stock < item_data.quantity:
            product = db.query(Product).filter(Product.id == item_data.product_id).first()
            out_of_stock.append({
                "product_id": item_data.product_id,
                "product_name": product.name if product else "Unknown",
                "requested_quantity": item_data.quantity,
                "available_quantity": stock
            })
    
    if out_of_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Insufficient stock for some products",
                "out_of_stock": out_of_stock
            }
        )
    
    # Generate reference
    reference = generate_delivery_reference(db=db)
    
    # Determine status
    status = DeliveryStatus.DRAFT
    
    # Create delivery
    delivery = Delivery(
        reference=reference,
        delivery_address=delivery_data.delivery_address,
        warehouse_id=delivery_data.warehouse_id,
        location_id=delivery_data.location_id,
        schedule_date=delivery_data.schedule_date,
        operation_type=delivery_data.operation_type,
        status=status,
        responsible=current_user.id
    )
    
    db.add(delivery)
    db.flush()
    
    # Add delivery items
    from app.models.delivery import DeliveryItem
    for item_data in delivery_data.products:
        item = DeliveryItem(
            delivery_id=delivery.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(item)
    
    db.commit()
    db.refresh(delivery)
    
    # Emit Socket.IO event (non-blocking)
    try:
        await emit_delivery_created({
            "id": delivery.id,
            "reference": delivery.reference
        }, delivery.warehouse_id)
    except:
        pass  # Don't fail if Socket.IO is not available
    
    delivery_dict = {
        **delivery.__dict__,
        "warehouse_name": delivery.warehouse.name if delivery.warehouse else None,
        "location_name": delivery.location.name if delivery.location else None,
        "responsible_name": delivery.responsible_user.full_name if delivery.responsible_user else None,
        "items": [
            {
                **item.__dict__,
                "product_name": item.product.name if item.product else None
            }
            for item in delivery.items
        ]
    }
    return delivery_dict

@router.post("/{delivery_id}/validate", response_model=DeliveryResponse)
async def validate_delivery(
    delivery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    if delivery.status != DeliveryStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Delivery must be in Ready status. Current status: {delivery.status}"
        )
    
    # Check stock availability again
    from sqlalchemy import func, select
    out_of_stock = []
    for item in delivery.items:
        stock_query = select(func.sum(StockLedger.quantity)).where(
            StockLedger.product_id == item.product_id,
            StockLedger.location_id == delivery.location_id
        )
        stock = db.scalar(stock_query) or 0
        
        if stock < item.quantity:
            out_of_stock.append({
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Unknown",
                "requested_quantity": item.quantity,
                "available_quantity": stock
            })
    
    if out_of_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Insufficient stock for some products",
                "out_of_stock": out_of_stock
            }
        )
    
    # Update stock for each item
    for item in delivery.items:
        # Create stock ledger entry (negative quantity for deliveries)
        stock_entry = StockLedger(
            product_id=item.product_id,
            warehouse_id=delivery.warehouse_id,
            location_id=delivery.location_id,
            quantity=-item.quantity,  # Negative for deliveries
            transaction_type=TransactionType.DELIVERY,
            reference=delivery.reference
        )
        db.add(stock_entry)
        
        # Check if stock is low after delivery
        remaining_stock_query = select(func.sum(StockLedger.quantity)).where(
            StockLedger.product_id == item.product_id,
            StockLedger.location_id == delivery.location_id
        )
        remaining_stock = db.scalar(remaining_stock_query) or 0
        
        # Emit low stock alert if stock is below threshold (e.g., 10)
        if remaining_stock < 10:
            try:
                await emit_low_stock_alert(
                    product_id=item.product_id,
                    warehouse_id=delivery.warehouse_id,
                    current_stock=remaining_stock
                )
            except:
                pass  # Don't fail if Socket.IO is not available
        
        # Emit real-time update via Socket.IO (non-blocking)
        try:
            await emit_stock_update(
                product_id=item.product_id,
                location_id=delivery.location_id,
                warehouse_id=delivery.warehouse_id,
                quantity=-item.quantity
            )
        except:
            pass  # Don't fail if Socket.IO is not available
    
    delivery.status = DeliveryStatus.DONE
    delivery.validated_at = datetime.utcnow()
    delivery.validated_by = current_user.id
    
    db.commit()
    db.refresh(delivery)
    
    return get_delivery(delivery.id, db, current_user)

