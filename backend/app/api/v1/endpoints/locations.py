from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.warehouse import Location, Warehouse
from app.schemas.warehouse import LocationCreate, LocationUpdate, LocationResponse

router = APIRouter()

@router.get("", response_model=List[LocationResponse])
def get_locations(
    warehouse_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    query = db.query(Location)
    
    if warehouse_id:
        query = query.filter(Location.warehouse_id == warehouse_id)
    
    locations = query.all()
    
    # Add warehouse name
    result = []
    for location in locations:
        location_dict = {
            **location.__dict__,
            "warehouse_name": location.warehouse.name if location.warehouse else None
        }
        result.append(location_dict)
    
    return result

@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: str,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    location_dict = {
        **location.__dict__,
        "warehouse_name": location.warehouse.name if location.warehouse else None
    }
    return location_dict

@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # Validate that warehouse exists
    warehouse = db.query(Warehouse).filter(Warehouse.id == location_data.warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    
    location = Location(**location_data.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    
    location_dict = {
        **location.__dict__,
        "warehouse_name": location.warehouse.name if location.warehouse else None
    }
    return location_dict

@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: str,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    update_data = location_data.model_dump(exclude_unset=True)
    
    # Validate warehouse_id if it's being updated
    if 'warehouse_id' in update_data:
        warehouse = db.query(Warehouse).filter(Warehouse.id == update_data['warehouse_id']).first()
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse not found"
            )
    
    for field, value in update_data.items():
        setattr(location, field, value)
    
    db.commit()
    db.refresh(location)
    
    location_dict = {
        **location.__dict__,
        "warehouse_name": location.warehouse.name if location.warehouse else None
    }
    return location_dict

