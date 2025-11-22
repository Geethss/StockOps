from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base

class DeliveryStatus(str, enum.Enum):
    DRAFT = "Draft"
    WAITING = "Waiting"
    READY = "Ready"
    DONE = "Done"

class Delivery(Base):
    __tablename__ = "deliveries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, index=True, nullable=False)
    delivery_address = Column(String, nullable=False)
    warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    schedule_date = Column(DateTime, nullable=False)
    operation_type = Column(String, nullable=True)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.DRAFT)
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
    items = relationship("DeliveryItem", back_populates="delivery", cascade="all, delete-orphan")

class DeliveryItem(Base):
    __tablename__ = "delivery_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_id = Column(String, ForeignKey("deliveries.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    delivery = relationship("Delivery", back_populates="items")
    product = relationship("Product", back_populates="delivery_items")

