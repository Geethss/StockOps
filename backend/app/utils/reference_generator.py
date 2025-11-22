from sqlalchemy.orm import Session
from app.models.receipt import Receipt
from app.models.delivery import Delivery

def generate_receipt_reference(warehouse_code: str = "WH", db: Session = None) -> str:
    """Generate receipt reference like WH/IN/0001"""
    if db:
        last_receipt = db.query(Receipt).order_by(Receipt.reference.desc()).first()
        if last_receipt and last_receipt.reference.startswith(f"{warehouse_code}/IN/"):
            try:
                last_number = int(last_receipt.reference.split("/")[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1
    else:
        next_number = 1
    
    return f"{warehouse_code}/IN/{str(next_number).zfill(4)}"

def generate_delivery_reference(warehouse_code: str = "WH", db: Session = None) -> str:
    """Generate delivery reference like WH/OUT/0001"""
    if db:
        last_delivery = db.query(Delivery).order_by(Delivery.reference.desc()).first()
        if last_delivery and last_delivery.reference.startswith(f"{warehouse_code}/OUT/"):
            try:
                last_number = int(last_delivery.reference.split("/")[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1
    else:
        next_number = 1
    
    return f"{warehouse_code}/OUT/{str(next_number).zfill(4)}"

