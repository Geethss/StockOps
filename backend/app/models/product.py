from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    category_id = Column(String, ForeignKey("product_categories.id"), nullable=True)
    unit_of_measure = Column(String, nullable=False)
    unit_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    stock_entries = relationship("StockLedger", back_populates="product")
    receipt_items = relationship("ReceiptItem", back_populates="product")
    delivery_items = relationship("DeliveryItem", back_populates="product")

