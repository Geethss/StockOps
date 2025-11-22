from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.transfer import Transfer, TransferStatus, TransferItem
from app.models.stock_ledger import StockLedger, TransactionType
from app.models.product import Product
from app.models.warehouse import Location, Warehouse
from app.schemas.transfer import TransferCreate, TransferResponse
from app.utils.reference_generator import generate_transfer_reference
from app.websocket.handlers import emit_stock_update

router = APIRouter()

@router.get("", response_model=List[TransferResponse])
def get_transfers(
    status: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    query = db.query(Transfer)
    
    if status:
        try:
            status_enum = TransferStatus(status)
            query = query.filter(Transfer.status == status_enum)
        except ValueError:
            pass
    if warehouse_id:
        query = query.filter(
            (Transfer.from_warehouse_id == warehouse_id) | 
            (Transfer.to_warehouse_id == warehouse_id)
        )
    if search:
        query = query.filter(
            (Transfer.reference.ilike(f"%{search}%")) |
            (Transfer.notes.ilike(f"%{search}%"))
        )
    
    transfers = query.order_by(Transfer.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for transfer in transfers:
        transfer_dict = {
            **transfer.__dict__,
            "from_warehouse_name": transfer.from_warehouse.name if transfer.from_warehouse else None,
            "from_location_name": transfer.from_location.name if transfer.from_location else None,
            "to_warehouse_name": transfer.to_warehouse.name if transfer.to_warehouse else None,
            "to_location_name": transfer.to_location.name if transfer.to_location else None,
            "responsible_name": transfer.responsible_user.full_name if transfer.responsible_user else None,
            "items": [
                {
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None
                }
                for item in transfer.items
            ]
        }
        result.append(transfer_dict)
    
    return result

@router.get("/{transfer_id}", response_model=TransferResponse)
def get_transfer(
    transfer_id: str,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer not found"
        )
    
    transfer_dict = {
        **transfer.__dict__,
        "from_warehouse_name": transfer.from_warehouse.name if transfer.from_warehouse else None,
        "from_location_name": transfer.from_location.name if transfer.from_location else None,
        "to_warehouse_name": transfer.to_warehouse.name if transfer.to_warehouse else None,
        "to_location_name": transfer.to_location.name if transfer.to_location else None,
        "responsible_name": transfer.responsible_user.full_name if transfer.responsible_user else None,
        "items": [
            {
                **item.__dict__,
                "product_name": item.product.name if item.product else None
            }
            for item in transfer.items
        ]
    }
    return transfer_dict

@router.post("", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    transfer_data: TransferCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # Validate that from and to locations are different
    if transfer_data.from_location_id == transfer_data.to_location_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="From and to locations must be different"
        )
    
    # Validate warehouses and locations exist
    from_location = db.query(Location).filter(Location.id == transfer_data.from_location_id).first()
    if not from_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="From location not found"
        )
    
    to_location = db.query(Location).filter(Location.id == transfer_data.to_location_id).first()
    if not to_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="To location not found"
        )
    
    # Check stock availability at from_location
    out_of_stock = []
    for item_data in transfer_data.products:
        stock_query = select(func.sum(StockLedger.quantity)).where(
            StockLedger.product_id == item_data.product_id,
            StockLedger.location_id == transfer_data.from_location_id
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
        error_details = []
        for item in out_of_stock:
            error_details.append(
                f"{item['product_name']}: Available {item['available_quantity']}, Requested {item['requested_quantity']}"
            )
        error_message = "Insufficient stock for some products: " + "; ".join(error_details)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": error_message,
                "out_of_stock": out_of_stock
            }
        )
    
    # Generate reference
    warehouse_code = from_location.warehouse.short_code if from_location.warehouse else "WH"
    reference = generate_transfer_reference(warehouse_code=warehouse_code, db=db)
    
    # TEMPORARY: Get a default user for responsible field since auth is disabled
    from app.models.user import User
    default_user = db.query(User).first()
    responsible_id = default_user.id if default_user else None
    
    if not responsible_id:
        import uuid
        responsible_id = str(uuid.uuid4())
        dummy_user = User(
            id=responsible_id,
            email="system@example.com",
            full_name="System User",
            hashed_password="dummy"
        )
        db.add(dummy_user)
        db.commit()
        db.refresh(dummy_user)
        responsible_id = dummy_user.id
    
    # Create transfer
    transfer = Transfer(
        reference=reference,
        from_warehouse_id=transfer_data.from_warehouse_id,
        from_location_id=transfer_data.from_location_id,
        to_warehouse_id=transfer_data.to_warehouse_id,
        to_location_id=transfer_data.to_location_id,
        schedule_date=transfer_data.schedule_date,
        status=TransferStatus.DRAFT,
        responsible=responsible_id,
        notes=transfer_data.notes
    )
    
    db.add(transfer)
    db.flush()
    
    # Add transfer items
    for item_data in transfer_data.products:
        item = TransferItem(
            transfer_id=transfer.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(item)
    
    db.commit()
    db.refresh(transfer)
    
    # Emit Socket.IO event (non-blocking)
    try:
        from app.websocket.handlers import emit_transfer_created
        await emit_transfer_created({
            "id": transfer.id,
            "reference": transfer.reference
        }, transfer.from_warehouse_id)
    except:
        pass
    
    transfer_dict = {
        **transfer.__dict__,
        "from_warehouse_name": transfer.from_warehouse.name if transfer.from_warehouse else None,
        "from_location_name": transfer.from_location.name if transfer.from_location else None,
        "to_warehouse_name": transfer.to_warehouse.name if transfer.to_warehouse else None,
        "to_location_name": transfer.to_location.name if transfer.to_location else None,
        "responsible_name": transfer.responsible_user.full_name if transfer.responsible_user else None,
        "items": [
            {
                **item.__dict__,
                "product_name": item.product.name if item.product else None
            }
            for item in transfer.items
        ]
    }
    return transfer_dict

@router.post("/{transfer_id}/validate", response_model=TransferResponse)
async def validate_transfer(
    transfer_id: str,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer not found"
        )
    
    # Allow validation from DRAFT or READY status (similar to receipts)
    if transfer.status == TransferStatus.DONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer is already completed"
        )
    
    # Check stock availability again
    out_of_stock = []
    for item in transfer.items:
        stock_query = select(func.sum(StockLedger.quantity)).where(
            StockLedger.product_id == item.product_id,
            StockLedger.location_id == transfer.from_location_id
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
    
    # Create stock ledger entries for each item
    for item in transfer.items:
        # Negative entry from source location
        from_entry = StockLedger(
            product_id=item.product_id,
            warehouse_id=transfer.from_warehouse_id,
            location_id=transfer.from_location_id,
            quantity=-item.quantity,  # Negative for outgoing
            transaction_type=TransactionType.TRANSFER,
            reference=transfer.reference
        )
        db.add(from_entry)
        
        # Positive entry to destination location
        to_entry = StockLedger(
            product_id=item.product_id,
            warehouse_id=transfer.to_warehouse_id,
            location_id=transfer.to_location_id,
            quantity=item.quantity,  # Positive for incoming
            transaction_type=TransactionType.TRANSFER,
            reference=transfer.reference
        )
        db.add(to_entry)
        
        # Emit real-time updates via Socket.IO (non-blocking)
        try:
            await emit_stock_update(
                product_id=item.product_id,
                location_id=transfer.from_location_id,
                warehouse_id=transfer.from_warehouse_id,
                quantity=-item.quantity
            )
            await emit_stock_update(
                product_id=item.product_id,
                location_id=transfer.to_location_id,
                warehouse_id=transfer.to_warehouse_id,
                quantity=item.quantity
            )
        except:
            pass
    
    # Update transfer status
    transfer.status = TransferStatus.DONE
    transfer.validated_at = datetime.utcnow()
    
    # TEMPORARY: Get a default user for validated_by field
    from app.models.user import User
    default_user = db.query(User).first()
    transfer.validated_by = default_user.id if default_user else None
    
    db.commit()
    db.refresh(transfer)
    
    transfer_dict = {
        **transfer.__dict__,
        "from_warehouse_name": transfer.from_warehouse.name if transfer.from_warehouse else None,
        "from_location_name": transfer.from_location.name if transfer.from_location else None,
        "to_warehouse_name": transfer.to_warehouse.name if transfer.to_warehouse else None,
        "to_location_name": transfer.to_location.name if transfer.to_location else None,
        "responsible_name": transfer.responsible_user.full_name if transfer.responsible_user else None,
        "items": [
            {
                **item.__dict__,
                "product_name": item.product.name if item.product else None
            }
            for item in transfer.items
        ]
    }
    return transfer_dict

