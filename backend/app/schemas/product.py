from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    sku: str
    category_id: Optional[str] = None
    unit_of_measure: str
    unit_cost: float = 0.0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_cost: Optional[float] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

