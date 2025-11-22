from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Union, Any
from datetime import datetime, date
from app.models.transfer import TransferStatus

class TransferItemCreate(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)

class TransferCreate(BaseModel):
    from_warehouse_id: str
    from_location_id: str
    to_warehouse_id: str
    to_location_id: str
    schedule_date: Union[datetime, str]
    products: List[TransferItemCreate] = Field(..., min_length=1)
    notes: Optional[str] = None
    
    @field_validator('schedule_date', mode='before')
    @classmethod
    def parse_schedule_date(cls, v: Any) -> datetime:
        if isinstance(v, str):
            try:
                if len(v) == 10:
                    v = f"{v}T00:00:00Z"
                if v.endswith('Z'):
                    v = v[:-1] + '+00:00'
                return datetime.fromisoformat(v)
            except (ValueError, AttributeError):
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

class TransferItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    quantity: float
    
    class Config:
        from_attributes = True

class TransferResponse(BaseModel):
    id: str
    reference: str
    from_warehouse_id: str
    from_warehouse_name: Optional[str] = None
    from_location_id: str
    from_location_name: Optional[str] = None
    to_warehouse_id: str
    to_warehouse_name: Optional[str] = None
    to_location_id: str
    to_location_name: Optional[str] = None
    schedule_date: datetime
    status: TransferStatus
    responsible: str
    responsible_name: Optional[str] = None
    notes: Optional[str] = None
    items: List[TransferItemResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True

