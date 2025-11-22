from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.product import Product
from app.models.receipt import Receipt, ReceiptStatus
from app.models.delivery import Delivery, DeliveryStatus
from app.models.stock_ledger import StockLedger
from app.schemas.dashboard import DashboardStats

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # Total products
    total_products = db.query(Product).count()
    
    # Low stock items (stock < 10) - simplified check
    low_stock_items = 0  # TODO: Implement proper low stock calculation
    
    # Pending receipts
    pending_receipts = db.query(Receipt).filter(
        Receipt.status.in_([ReceiptStatus.DRAFT, ReceiptStatus.READY])
    ).count()
    
    # Pending deliveries
    pending_deliveries = db.query(Delivery).filter(
        Delivery.status.in_([DeliveryStatus.DRAFT, DeliveryStatus.WAITING, DeliveryStatus.READY])
    ).count()
    
    # Scheduled transfers
    scheduled_transfers = 0  # TODO: Implement transfers
    
    stats = DashboardStats(
        total_products=total_products,
        low_stock_items=low_stock_items,
        pending_receipts=pending_receipts,
        pending_deliveries=pending_deliveries,
        scheduled_transfers=scheduled_transfers
    )
    return stats

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

