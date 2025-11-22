from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base

class ReceiptStatus(str, enum.Enum):
    DRAFT = "Draft"
    READY = "Ready"
    DONE = "Done"

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, index=True, nullable=False)
    receive_from = Column(String, nullable=False)
    warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    schedule_date = Column(DateTime, nullable=False)
    status = Column(Enum(ReceiptStatus), default=ReceiptStatus.DRAFT)
    responsible = Column(String, ForeignKey("users.id"), nullable=False)
    validated_at = Column(DateTime, nullable=True)
    validated_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    warehouse = relationship("Warehouse")
    location = relationship("Location")
    responsible_user = relationship("User", foreign_keys=[responsible])
    validator_user = relationship("User", foreign_keys=[validated_by])
    items = relationship("ReceiptItem", back_populates="receipt", cascade="all, delete-orphan")

class ReceiptItem(Base):
    __tablename__ = "receipt_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    receipt_id = Column(String, ForeignKey("receipts.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    receipt = relationship("Receipt", back_populates="items")
    product = relationship("Product", back_populates="receipt_items")

