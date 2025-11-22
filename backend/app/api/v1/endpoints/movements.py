from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.stock_ledger import StockLedger, TransactionType
from app.models.warehouse import Location, Warehouse
from app.models.product import Product
from app.models.receipt import Receipt
from app.models.delivery import Delivery

router = APIRouter()

@router.get("")
def get_movements(
    search: Optional[str] = Query(None),
    transaction_type: Optional[str] = Query(None),
    from_location_id: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    """
    Get stock movement history with filters.
    Returns all stock ledger entries with related information from receipts/deliveries.
    """
    # Build query using SQLAlchemy 2.0 syntax
    query = select(StockLedger)
    
    # Apply filters
    conditions = []
    
    if search:
        conditions.append(StockLedger.reference.ilike(f"%{search}%"))
    
    if transaction_type:
        try:
            trans_type_enum = TransactionType(transaction_type)
            conditions.append(StockLedger.transaction_type == trans_type_enum)
        except ValueError:
            pass  # Invalid transaction type, ignore
    
    if from_location_id:
        conditions.append(StockLedger.location_id == from_location_id)
    
    if warehouse_id:
        conditions.append(StockLedger.warehouse_id == warehouse_id)
    
    if product_id:
        conditions.append(StockLedger.product_id == product_id)
    
    if date_from:
        date_from_start = datetime.combine(date_from, datetime.min.time())
        conditions.append(StockLedger.created_at >= date_from_start)
    
    if date_to:
        date_to_end = datetime.combine(date_to, datetime.max.time())
        conditions.append(StockLedger.created_at <= date_to_end)
    
    if conditions:
        query = query.where(*conditions)
    
    # Order by created_at descending and apply pagination
    query = query.order_by(StockLedger.created_at.desc()).offset(skip).limit(limit)
    
    movements = db.scalars(query).all()
    
    # Get all related data in one go to avoid N+1 queries
    location_ids = list(set(m.location_id for m in movements))
    product_ids = list(set(m.product_id for m in movements))
    warehouse_ids = list(set(m.warehouse_id for m in movements))
    references = list(set(m.reference for m in movements))
    
    # Fetch locations
    locations_dict = {}
    if location_ids:
        locations = db.scalars(
            select(Location).where(Location.id.in_(location_ids))
        ).all()
        locations_dict = {loc.id: loc for loc in locations}
    
    # Fetch products
    products_dict = {}
    if product_ids:
        products = db.scalars(
            select(Product).where(Product.id.in_(product_ids))
        ).all()
        products_dict = {prod.id: prod for prod in products}
    
    # Fetch warehouses
    warehouses_dict = {}
    if warehouse_ids:
        warehouses = db.scalars(
            select(Warehouse).where(Warehouse.id.in_(warehouse_ids))
        ).all()
        warehouses_dict = {wh.id: wh for wh in warehouses}
    
    # Fetch receipts and deliveries for contact information
    receipts_dict = {}
    deliveries_dict = {}
    if references:
        # Get receipts
        receipts = db.scalars(
            select(Receipt).where(Receipt.reference.in_(references))
        ).all()
        receipts_dict = {rec.reference: rec for rec in receipts}
        
        # Get deliveries
        deliveries = db.scalars(
            select(Delivery).where(Delivery.reference.in_(references))
        ).all()
        deliveries_dict = {delivery.reference: delivery for delivery in deliveries}
    
    # Build response with related data
    result = []
    for movement in movements:
        location = locations_dict.get(movement.location_id)
        product = products_dict.get(movement.product_id)
        warehouse = warehouses_dict.get(movement.warehouse_id)
        
        # Get contact information from receipt or delivery
        contact = None
        from_location_name = None
        to_location_name = None
        
        # Determine transaction type
        trans_type = movement.transaction_type.value if hasattr(movement.transaction_type, 'value') else str(movement.transaction_type)
        
        # For receipts: contact is "receive_from", location is "to_location"
        if trans_type == "Receipt":
            receipt = receipts_dict.get(movement.reference)
            if receipt:
                contact = receipt.receive_from
                to_location_name = location.name if location else "Unknown"
                # Receipts are incoming, so no from_location
                from_location_name = "-"
        
        # For deliveries: contact is "delivery_address", location is "from_location"
        elif trans_type == "Delivery":
            delivery = deliveries_dict.get(movement.reference)
            if delivery:
                contact = delivery.delivery_address
                from_location_name = location.name if location else "Unknown"
                # Deliveries are outgoing, so no to_location
                to_location_name = "-"
        
        # For adjustments and transfers
        else:
            contact = "-"
            from_location_name = location.name if location else "Unknown"
            to_location_name = "-" if trans_type == "Adjustment" else location.name if location else "Unknown"
        
        result.append({
            "id": movement.id,
            "reference": movement.reference,
            "date": movement.created_at.isoformat() if movement.created_at else None,
            "contact": contact or "-",
            "from_location": from_location_name or "-",
            "to_location": to_location_name or "-",
            "warehouse": warehouse.name if warehouse else "Unknown",
            "warehouse_id": movement.warehouse_id,
            "product_id": movement.product_id,
            "product_name": product.name if product else "Unknown",
            "product_sku": product.sku if product else "-",
            "quantity": movement.quantity,  # Keep sign (positive for receipts, negative for deliveries)
            "quantity_abs": abs(movement.quantity),  # Absolute value for display
            "transaction_type": trans_type,
            "status": "Done",  # All ledger entries are completed
        })
    
    return result

@router.get("/transaction-types")
def get_transaction_types():
    """Get list of available transaction types."""
    return [{"value": t.value, "label": t.value} for t in TransactionType]

