from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WarehouseBase(BaseModel):
    name: str
    short_code: str
    address: str

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    short_code: Optional[str] = None
    address: Optional[str] = None

class WarehouseResponse(WarehouseBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    name: str
    short_code: str
    warehouse_id: str

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    short_code: Optional[str] = None
    warehouse_id: Optional[str] = None

class LocationResponse(LocationBase):
    id: str
    warehouse_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

