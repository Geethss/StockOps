from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base

class TransactionType(str, enum.Enum):
    RECEIPT = "Receipt"
    DELIVERY = "Delivery"
    TRANSFER = "Transfer"
    ADJUSTMENT = "Adjustment"

class StockLedger(Base):
    __tablename__ = "stock_ledger"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    quantity = Column(Float, nullable=False)  # Positive for receipts, negative for deliveries
    transaction_type = Column(Enum(TransactionType), nullable=False)
    reference = Column(String, nullable=False)  # Reference to receipt/delivery/transfer
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="stock_entries")
    warehouse = relationship("Warehouse")
    location = relationship("Location", back_populates="stock_entries")

