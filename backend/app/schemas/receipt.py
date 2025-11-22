from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.receipt import ReceiptStatus

class ReceiptItemCreate(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)
    unit_cost: Optional[float] = Field(None, ge=0)

class ReceiptCreate(BaseModel):
    receive_from: str = Field(..., min_length=1)
    warehouse_id: str
    location_id: str
    schedule_date: datetime
    products: List[ReceiptItemCreate] = Field(..., min_length=1)

class ReceiptItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    quantity: float
    unit_cost: Optional[float]
    
    class Config:
        from_attributes = True

class ReceiptResponse(BaseModel):
    id: str
    reference: str
    receive_from: str
    warehouse_id: str
    warehouse_name: Optional[str] = None
    location_id: str
    location_name: Optional[str] = None
    schedule_date: datetime
    status: ReceiptStatus
    responsible: str
    responsible_name: Optional[str] = None
    items: List[ReceiptItemResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True

