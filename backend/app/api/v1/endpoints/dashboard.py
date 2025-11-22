from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.product import Product
from app.models.receipt import Receipt, ReceiptStatus
from app.models.delivery import Delivery, DeliveryStatus
from app.models.transfer import Transfer, TransferStatus
from app.models.stock_ledger import StockLedger
from app.schemas.dashboard import DashboardStats

router = APIRouter()

@router.get("/stats")  # Remove response_model to return dict directly
def get_dashboard_stats(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total products
    total_products = db.query(Product).count()
    
    # Low stock items (stock < 10) - simplified check
    low_stock_items = 0
    try:
        from sqlalchemy import select
        # Get all products with their total stock
        products_with_stock = db.execute(
            select(
                StockLedger.product_id,
                func.sum(StockLedger.quantity).label('total_stock')
            ).group_by(StockLedger.product_id)
        ).all()
        
        # Count products with stock < 10
        low_stock_items = sum(1 for _, stock in products_with_stock if (stock or 0) < 10)
    except Exception as e:
        print(f"DEBUG: Error calculating low stock: {e}")
        low_stock_items = 0
    
    # RECEIPT METRICS (based on wireframe)
    # Receipts to receive (pending receipts)
    receipts_to_receive = db.query(Receipt).filter(
        Receipt.status.in_([ReceiptStatus.DRAFT, ReceiptStatus.READY])
    ).count()
    
    # Receipts late (schedule_date < today AND pending)
    receipts_late = db.query(Receipt).filter(
        Receipt.status.in_([ReceiptStatus.DRAFT, ReceiptStatus.READY]),
        Receipt.schedule_date < today_start
    ).count()
    
    # Receipts operations (schedule_date > today AND pending) - future operations
    receipts_operations = db.query(Receipt).filter(
        Receipt.status.in_([ReceiptStatus.DRAFT, ReceiptStatus.READY]),
        Receipt.schedule_date > today_start
    ).count()
    
    # DELIVERY METRICS (based on wireframe)
    # Deliveries to deliver (pending deliveries)
    deliveries_to_deliver = db.query(Delivery).filter(
        Delivery.status.in_([DeliveryStatus.DRAFT, DeliveryStatus.WAITING, DeliveryStatus.READY])
    ).count()
    
    # Deliveries late (schedule_date < today AND pending)
    deliveries_late = db.query(Delivery).filter(
        Delivery.status.in_([DeliveryStatus.DRAFT, DeliveryStatus.WAITING, DeliveryStatus.READY]),
        Delivery.schedule_date < today_start
    ).count()
    
    # Deliveries waiting (WAITING status)
    deliveries_waiting = db.query(Delivery).filter(
        Delivery.status == DeliveryStatus.WAITING
    ).count()
    
    # Deliveries operations (schedule_date > today AND pending) - future operations
    deliveries_operations = db.query(Delivery).filter(
        Delivery.status.in_([DeliveryStatus.DRAFT, DeliveryStatus.WAITING, DeliveryStatus.READY]),
        Delivery.schedule_date > today_start
    ).count()
    
    # Create stats dict with camelCase keys for frontend
    stats_dict = {
        "totalProducts": total_products,
        "lowStockItems": low_stock_items,
        # Receipt metrics
        "receiptsToReceive": receipts_to_receive,
        "receiptsLate": receipts_late,
        "receiptsOperations": receipts_operations,
        # Delivery metrics
        "deliveriesToDeliver": deliveries_to_deliver,
        "deliveriesLate": deliveries_late,
        "deliveriesWaiting": deliveries_waiting,
        "deliveriesOperations": deliveries_operations,
    }
    print(f"DEBUG: Returning stats: {stats_dict}")
    return stats_dict

@router.get("/pending-operations")
def get_pending_operations(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    receipts = db.query(Receipt).filter(
        Receipt.status.in_([ReceiptStatus.DRAFT, ReceiptStatus.READY])
    ).limit(10).all()
    
    deliveries = db.query(Delivery).filter(
        Delivery.status.in_([DeliveryStatus.DRAFT, DeliveryStatus.WAITING, DeliveryStatus.READY])
    ).limit(10).all()
    
    return {
        "receipts": [
            {
                "id": r.id,
                "reference": r.reference,
                "receive_from": r.receive_from,
                "status": r.status.value,
                "schedule_date": r.schedule_date.isoformat()
            }
            for r in receipts
        ],
        "deliveries": [
            {
                "id": d.id,
                "reference": d.reference,
                "delivery_address": d.delivery_address,
                "status": d.status.value,
                "schedule_date": d.schedule_date.isoformat()
            }
            for d in deliveries
        ]
    }

@router.get("/low-stock")
def get_low_stock_items(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # TODO: Implement proper low stock calculation
    # This is a simplified version - should calculate actual stock per product/location
    return []

