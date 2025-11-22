from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # Specify primaryjoin because Receipt/Delivery have multiple FKs to User (responsible and validated_by)
    # This tells SQLAlchemy to use the 'responsible' foreign key, not 'validated_by'
    receipts = relationship(
        "Receipt", 
        back_populates="responsible_user", 
        primaryjoin="User.id == Receipt.responsible"
    )
    deliveries = relationship(
        "Delivery", 
        back_populates="responsible_user", 
        primaryjoin="User.id == Delivery.responsible"
    )

