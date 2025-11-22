from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.receipt import Receipt, ReceiptStatus
from app.models.stock_ledger import StockLedger, TransactionType
from app.schemas.receipt import ReceiptCreate, ReceiptResponse
from app.utils.reference_generator import generate_receipt_reference
from app.websocket.handlers import emit_stock_update, emit_receipt_created
from sqlalchemy import func

router = APIRouter()

@router.get("", response_model=List[ReceiptResponse])
def get_receipts(
    status: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Receipt)
    
    if status:
        query = query.filter(Receipt.status == status)
    if warehouse_id:
        query = query.filter(Receipt.warehouse_id == warehouse_id)
    if search:
        query = query.filter(
            (Receipt.reference.ilike(f"%{search}%")) |
            (Receipt.receive_from.ilike(f"%{search}%"))
        )
    
    receipts = query.order_by(Receipt.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add related data
    result = []
    for receipt in receipts:
        receipt_dict = {
            **receipt.__dict__,
            "warehouse_name": receipt.warehouse.name if receipt.warehouse else None,
            "location_name": receipt.location.name if receipt.location else None,
            "responsible_name": receipt.responsible_user.full_name if receipt.responsible_user else None,
            "items": [
                {
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None
                }
                for item in receipt.items
            ]
        }
        result.append(receipt_dict)
    
    return result

@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(
    receipt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    receipt_dict = {
        **receipt.__dict__,
        "warehouse_name": receipt.warehouse.name if receipt.warehouse else None,
        "location_name": receipt.location.name if receipt.location else None,
        "responsible_name": receipt.responsible_user.full_name if receipt.responsible_user else None,
        "items": [
            {
                **item.__dict__,
                "product_name": item.product.name if item.product else None
            }
            for item in receipt.items
        ]
    }
    return receipt_dict

@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    receipt_data: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generate reference
    reference = generate_receipt_reference(db=db)
    
    # Create receipt
    receipt = Receipt(
        reference=reference,
        receive_from=receipt_data.receive_from,
        warehouse_id=receipt_data.warehouse_id,
        location_id=receipt_data.location_id,
        schedule_date=receipt_data.schedule_date,
        status=ReceiptStatus.DRAFT,
        responsible=current_user.id
    )
    
    db.add(receipt)
    db.flush()
    
    # Add receipt items
    from app.models.receipt import ReceiptItem
    for item_data in receipt_data.products:
        item = ReceiptItem(
            receipt_id=receipt.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_cost=item_data.unit_cost
        )
        db.add(item)
    
    db.commit()
    db.refresh(receipt)
    
    # Emit Socket.IO event (non-blocking)
    try:
        await emit_receipt_created({
            "id": receipt.id,
            "reference": receipt.reference
        }, receipt.warehouse_id)
    except:
        pass  # Don't fail if Socket.IO is not available
    
    receipt_dict = {
        **receipt.__dict__,
        "warehouse_name": receipt.warehouse.name if receipt.warehouse else None,
        "location_name": receipt.location.name if receipt.location else None,
        "responsible_name": receipt.responsible_user.full_name if receipt.responsible_user else None,
        "items": [
            {
                **item.__dict__,
                "product_name": item.product.name if item.product else None
            }
            for item in receipt.items
        ]
    }
    return receipt_dict

@router.post("/{receipt_id}/validate", response_model=ReceiptResponse)
async def validate_receipt(
    receipt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    if receipt.status != ReceiptStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Receipt must be in Ready status. Current status: {receipt.status}"
        )
    
    # Update stock for each item
    for item in receipt.items:
        # Create stock ledger entry
        stock_entry = StockLedger(
            product_id=item.product_id,
            warehouse_id=receipt.warehouse_id,
            location_id=receipt.location_id,
            quantity=item.quantity,  # Positive for receipts
            transaction_type=TransactionType.RECEIPT,
            reference=receipt.reference
        )
        db.add(stock_entry)
        
        # Emit real-time update via Socket.IO (non-blocking)
        try:
            await emit_stock_update(
                product_id=item.product_id,
                location_id=receipt.location_id,
                warehouse_id=receipt.warehouse_id,
                quantity=item.quantity
            )
        except:
            pass  # Don't fail if Socket.IO is not available
    
    receipt.status = ReceiptStatus.DONE
    receipt.validated_at = datetime.utcnow()
    receipt.validated_by = current_user.id
    
    db.commit()
    db.refresh(receipt)
    
    return get_receipt(receipt.id, db, current_user)

