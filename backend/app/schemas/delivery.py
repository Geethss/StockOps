from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.delivery import DeliveryStatus

class DeliveryItemCreate(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)

class DeliveryCreate(BaseModel):
    delivery_address: str = Field(..., min_length=1)
    warehouse_id: str
    location_id: str
    schedule_date: datetime
    operation_type: Optional[str] = None
    products: List[DeliveryItemCreate] = Field(..., min_length=1)

class DeliveryItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    quantity: float
    
    class Config:
        from_attributes = True

class DeliveryResponse(BaseModel):
    id: str
    reference: str
    delivery_address: str
    warehouse_id: str
    warehouse_name: Optional[str] = None
    location_id: str
    location_name: Optional[str] = None
    schedule_date: datetime
    operation_type: Optional[str]
    status: DeliveryStatus
    responsible: str
    responsible_name: Optional[str] = None
    items: List[DeliveryItemResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True

