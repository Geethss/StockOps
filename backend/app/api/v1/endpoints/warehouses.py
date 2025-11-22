from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseResponse

router = APIRouter()

@router.get("", response_model=List[WarehouseResponse])
def get_warehouses(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    warehouses = db.query(Warehouse).all()
    return warehouses

@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    return warehouse

@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    warehouse_data: WarehouseCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # Check if short_code already exists
    existing_warehouse = db.query(Warehouse).filter(Warehouse.short_code == warehouse_data.short_code).first()
    if existing_warehouse:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Short code already exists"
        )
    
    warehouse = Warehouse(**warehouse_data.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse

@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: str,
    warehouse_data: WarehouseUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    
    update_data = warehouse_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(warehouse, field, value)
    
    db.commit()
    db.refresh(warehouse)
    return warehouse

