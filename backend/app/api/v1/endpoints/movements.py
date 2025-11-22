from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.stock_ledger import StockLedger
from app.models.warehouse import Location
from app.models.product import Product

router = APIRouter()

@router.get("")
def get_movements(
    search: Optional[str] = Query(None),
    from_location_id: Optional[str] = Query(None),
    to_location_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    query = db.query(StockLedger)
    
    if search:
        query = query.filter(StockLedger.reference.ilike(f"%{search}%"))
    if from_location_id:
        query = query.filter(StockLedger.location_id == from_location_id)
    
    movements = query.order_by(StockLedger.created_at.desc()).offset(skip).limit(limit).all()
    
    # Build response with related data
    result = []
    for movement in movements:
        location = db.query(Location).filter(Location.id == movement.location_id).first()
        product = db.query(Product).filter(Product.id == movement.product_id).first()
        
        # For transfers, we'd need to track to_location - simplified here
        result.append({
            "id": movement.id,
            "reference": movement.reference,
            "date": movement.created_at,
            "contact": "N/A",  # Would need to add from receipt/delivery
            "from_location": location.name if location else "Unknown",
            "to_location": location.name if location else "Unknown",  # Simplified
            "product_id": movement.product_id,
            "product_name": product.name if product else "Unknown",
            "quantity": abs(movement.quantity),
            "transaction_type": movement.transaction_type.value if hasattr(movement.transaction_type, 'value') else str(movement.transaction_type),
            "status": "Done" if movement.transaction_type == "Receipt" else "Done"  # Simplified
        })
    
    return result

@router.get("/search")
def search_movements(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    movements = db.query(StockLedger).filter(
        StockLedger.reference.ilike(f"%{q}%")
    ).limit(50).all()
    
    # Build response with related data
    result = []
    for movement in movements:
        location = db.query(Location).filter(Location.id == movement.location_id).first()
        product = db.query(Product).filter(Product.id == movement.product_id).first()
        
        result.append({
            "id": movement.id,
            "reference": movement.reference,
            "date": movement.created_at,
            "from_location": location.name if location else "Unknown",
            "to_location": location.name if location else "Unknown",
            "product_name": product.name if product else "Unknown",
            "quantity": abs(movement.quantity),
            "transaction_type": movement.transaction_type.value if hasattr(movement.transaction_type, 'value') else str(movement.transaction_type),
        })
    
    return result

