from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base

class TransferStatus(str, enum.Enum):
    DRAFT = "Draft"
    READY = "Ready"
    DONE = "Done"

class Transfer(Base):
    __tablename__ = "transfers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, index=True, nullable=False)
    from_warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    from_location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    to_warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    to_location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    schedule_date = Column(DateTime, nullable=False)
    status = Column(Enum(TransferStatus), default=TransferStatus.DRAFT)
    responsible = Column(String, ForeignKey("users.id"), nullable=False)
    validated_at = Column(DateTime, nullable=True)
    validated_by = Column(String, ForeignKey("users.id"), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    from_location = relationship("Location", foreign_keys=[from_location_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    to_location = relationship("Location", foreign_keys=[to_location_id])
    responsible_user = relationship("User", foreign_keys=[responsible])
    validator_user = relationship("User", foreign_keys=[validated_by])
    items = relationship("TransferItem", back_populates="transfer", cascade="all, delete-orphan")

class TransferItem(Base):
    __tablename__ = "transfer_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transfer_id = Column(String, ForeignKey("transfers.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    transfer = relationship("Transfer", back_populates="items")
    product = relationship("Product", back_populates="transfer_items")

