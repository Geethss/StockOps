from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.product import Product
from app.models.stock_ledger import StockLedger, TransactionType
from app.models.warehouse import Location, Warehouse

router = APIRouter()

class StockUpdateRequest(BaseModel):
    quantity: float
    reason: Optional[str] = None

@router.get("")
def get_stock(
    search: Optional[str] = Query(None),
    location_id: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # Use SQLAlchemy 2.0 syntax with select()
    from sqlalchemy.orm import aliased
    
    # Base query to get stock per product and location
    stock_query = select(
        StockLedger.product_id,
        StockLedger.location_id,
        StockLedger.warehouse_id,
        func.sum(StockLedger.quantity).label('quantity')
    ).group_by(
        StockLedger.product_id,
        StockLedger.location_id,
        StockLedger.warehouse_id
    )
    
    # Apply filters
    if location_id:
        stock_query = stock_query.where(StockLedger.location_id == location_id)
    if warehouse_id:
        stock_query = stock_query.where(StockLedger.warehouse_id == warehouse_id)
    
    # Get all locations if filtering by warehouse
    locations_query = select(Location)
    if warehouse_id:
        locations_query = locations_query.where(Location.warehouse_id == warehouse_id)
    if location_id:
        locations_query = locations_query.where(Location.id == location_id)
    
    locations = db.scalars(locations_query).all()
    location_dict = {loc.id: loc for loc in locations}
    
    # Get warehouses
    warehouses_query = select(Warehouse)
    if warehouse_id:
        warehouses_query = warehouses_query.where(Warehouse.id == warehouse_id)
    warehouses = db.scalars(warehouses_query).all()
    warehouse_dict = {wh.id: wh for wh in warehouses}
    
    # Get products (with optional search filter)
    products_query = select(Product)
    if search:
        products_query = products_query.where(
            (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )
    products = db.scalars(products_query).all()
    
    # Execute stock query
    stock_results = db.execute(stock_query).all()
    
    # Build stock dictionary for quick lookup
    stock_dict = {}
    for result in stock_results:
        key = (result.product_id, result.location_id)
        if key not in stock_dict:
            stock_dict[key] = {
                'quantity': 0,
                'warehouse_id': result.warehouse_id
            }
        stock_dict[key]['quantity'] += result.quantity or 0
    
    # Build stock data list
    stock_data = []
    
    # If filtering by location or warehouse, only show products in those locations
    # Otherwise, show all products with their stock across all locations
    if location_id or warehouse_id:
        # Only show products that have stock in the filtered locations
        product_ids_with_stock = set(result.product_id for result in stock_results)
        for product in products:
            if product.id in product_ids_with_stock:
                # Get all locations for this product that match filters
                for loc_id, stock_info in stock_dict.items():
                    if loc_id[0] == product.id and loc_id[1] in location_dict:
                        location = location_dict[loc_id[1]]
                        warehouse = warehouse_dict.get(stock_info['warehouse_id'])
                        stock_data.append({
                            "product": product.name,
                            "sku": product.sku,
                            "product_id": product.id,
                            "location_id": loc_id[1],
                            "location": location.name,
                            "warehouse_id": location.warehouse_id,
                            "warehouse": warehouse.name if warehouse else None,
                            "perUnitCost": product.unit_cost or 0,
                            "onHand": stock_info['quantity'] or 0,
                            "freeToUse": stock_info['quantity'] or 0,  # Simplified - should calculate reserved stock
                        })
    else:
        # Show all products with their stock across all locations
        for product in products:
            # Get all locations where this product has stock
            product_stock_locations = {
                loc_id: info for (prod_id, loc_id), info in stock_dict.items()
                if prod_id == product.id
            }
            
            if product_stock_locations:
                # Add entries for each location
                for loc_id, stock_info in product_stock_locations.items():
                    if loc_id in location_dict:
                        location = location_dict[loc_id]
                        warehouse = warehouse_dict.get(stock_info['warehouse_id'])
                        stock_data.append({
                            "product": product.name,
                            "sku": product.sku,
                            "product_id": product.id,
                            "location_id": loc_id,
                            "location": location.name,
                            "warehouse_id": location.warehouse_id,
                            "warehouse": warehouse.name if warehouse else None,
                            "perUnitCost": product.unit_cost or 0,
                            "onHand": stock_info['quantity'] or 0,
                            "freeToUse": stock_info['quantity'] or 0,
                        })
            else:
                # Product exists but has no stock - show with 0 stock
                stock_data.append({
                    "product": product.name,
                    "sku": product.sku,
                    "product_id": product.id,
                    "location_id": None,
                    "location": None,
                    "warehouse_id": None,
                    "warehouse": None,
                    "perUnitCost": product.unit_cost or 0,
                    "onHand": 0,
                    "freeToUse": 0,
                })
    
    return stock_data

@router.put("/{product_id}/{location_id}")
def update_stock(
    product_id: str,
    location_id: str,
    update_data: StockUpdateRequest,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    """
    Update stock for a product at a specific location.
    Creates a stock adjustment entry in the ledger.
    """
    # Verify product exists
    product = db.scalar(select(Product).where(Product.id == product_id))
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify location exists
    location = db.scalar(select(Location).where(Location.id == location_id))
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Get current stock
    current_stock_query = select(func.sum(StockLedger.quantity)).where(
        StockLedger.product_id == product_id,
        StockLedger.location_id == location_id
    )
    current_stock = db.scalar(current_stock_query) or 0
    
    # Calculate difference
    new_quantity = update_data.quantity
    difference = new_quantity - current_stock
    
    if difference != 0:
        # Generate adjustment reference
        import uuid
        adjustment_ref = f"ADJ/{str(uuid.uuid4())[:8].upper()}"
        
        # Create adjustment entry
        adjustment = StockLedger(
            product_id=product_id,
            warehouse_id=location.warehouse_id,
            location_id=location_id,
            quantity=difference,
            transaction_type=TransactionType.ADJUSTMENT,
            reference=adjustment_ref
        )
        db.add(adjustment)
        db.commit()
        db.refresh(adjustment)
        
        # Emit Socket.IO event for real-time update (non-blocking)
        # Note: This is a synchronous endpoint, so Socket.IO emit would need to be handled separately
        # For now, we'll skip the real-time update in this endpoint
        # Real-time updates are already handled in receipt/delivery validation endpoints
    
    return {
        "message": "Stock updated successfully",
        "product_id": product_id,
        "location_id": location_id,
        "previous_quantity": current_stock,
        "new_quantity": new_quantity,
        "adjustment": difference
    }

