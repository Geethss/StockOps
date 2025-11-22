from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.product import Product
from app.models.stock_ledger import StockLedger
from app.models.warehouse import Location

router = APIRouter()

@router.get("")
def get_stock(
    search: Optional[str] = Query(None),
    location_id: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # Get all products with their stock levels
    products = db.query(Product).all()
    
    stock_data = []
    for product in products:
        # Calculate stock per location
        query = db.query(
            StockLedger.product_id,
            StockLedger.location_id,
            Location.name.label('location_name'),
            func.sum(StockLedger.quantity).label('quantity')
        ).join(Location).filter(
            StockLedger.product_id == product.id
        )
        
        if location_id:
            query = query.filter(StockLedger.location_id == location_id)
        if warehouse_id:
            query = query.join(Location).filter(Location.warehouse_id == warehouse_id)
        
        query = query.group_by(
            StockLedger.product_id,
            StockLedger.location_id,
            Location.name
        )
        
        stock_per_location = query.all()
        
        # Build stock entry
        for stock_row in stock_per_location:
            stock_data.append({
                "product": product.name,
                "sku": product.sku,
                "product_id": product.id,
                "location_id": stock_row.location_id,
                "location": stock_row.location_name,
                "perUnitCost": product.unit_cost,
                "onHand": stock_row.quantity or 0,
                "freeToUse": stock_row.quantity or 0,  # Simplified - should calculate reserved stock
            })
    
    # Filter by search term
    if search:
        stock_data = [
            item for item in stock_data
            if search.lower() in item["product"].lower() or search.lower() in item["sku"].lower()
        ]
    
    return stock_data

@router.put("/{product_id}/{location_id}")
def update_stock(
    product_id: str,
    location_id: str,
    quantity: float,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # This endpoint would typically be used for stock adjustments
    # For now, we'll create a stock ledger entry
    # In a real system, you'd want an adjustment type
    
    # Get current stock
    from sqlalchemy import select
    current_stock_query = select(func.sum(StockLedger.quantity)).where(
        StockLedger.product_id == product_id,
        StockLedger.location_id == location_id
    )
    current_stock = db.scalar(current_stock_query) or 0
    
    # Calculate difference
    difference = quantity - current_stock
    
    if difference != 0:
        # Get warehouse_id from location
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        # Create adjustment entry
        adjustment = StockLedger(
            product_id=product_id,
            warehouse_id=location.warehouse_id,
            location_id=location_id,
            quantity=difference,
            transaction_type="Adjustment",
            reference=f"ADJ/TEST"  # TEMPORARILY COMMENTED OUT FOR TESTING - current_user.id[:8]
        )
        db.add(adjustment)
        db.commit()
    
    return {"message": "Stock updated successfully", "new_quantity": quantity}

