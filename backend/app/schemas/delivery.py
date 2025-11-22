from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Union, Any
from datetime import datetime, date
from app.models.delivery import DeliveryStatus

class DeliveryItemCreate(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)

class DeliveryCreate(BaseModel):
    delivery_address: str = Field(..., min_length=1)
    warehouse_id: str
    location_id: str
    schedule_date: Union[datetime, str]  # Accept datetime or ISO string
    operation_type: Optional[str] = None
    products: List[DeliveryItemCreate] = Field(..., min_length=1)
    
    @field_validator('schedule_date', mode='before')
    @classmethod
    def parse_schedule_date(cls, v: Any) -> datetime:
        if isinstance(v, str):
            # Try to parse ISO datetime string
            try:
                # If it's just a date string (YYYY-MM-DD), add time
                if len(v) == 10:
                    v = f"{v}T00:00:00Z"
                # Handle ISO format
                if v.endswith('Z'):
                    v = v[:-1] + '+00:00'
                return datetime.fromisoformat(v)
            except (ValueError, AttributeError):
                # Try parsing as date YYYY-MM-DD
                try:
                    parsed_date = datetime.strptime(v, '%Y-%m-%d').date()
                    return datetime.combine(parsed_date, datetime.min.time())
                except ValueError:
                    raise ValueError(f"Invalid date format: {v}. Expected YYYY-MM-DD or ISO datetime string.")
        elif isinstance(v, datetime):
            return v
        elif isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        raise ValueError(f"Cannot convert {type(v)} to datetime")

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

