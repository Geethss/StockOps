from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
# TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
# from app.core.dependencies import get_current_user
# from app.models.user import User
from app.models.product import Product, ProductCategory
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

@router.get("", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    query = db.query(Product)
    
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )
    
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/search", response_model=List[ProductResponse])
def search_products(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    products = db.query(Product).filter(
        (Product.name.ilike(f"%{q}%")) |
        (Product.sku.ilike(f"%{q}%"))
    ).limit(20).all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    # Check if SKU already exists
    existing_product = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU already exists"
        )
    
    # Prepare product data
    product_dict = product_data.model_dump()
    
    # Validate and clean category_id
    # If category_id is provided (not None and not empty string), validate it exists
    category_id = product_dict.get('category_id')
    if category_id and category_id.strip():  # Check if it's not None and not empty string
        # Check if category exists in database
        category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
        if not category:
            # Invalid category_id - either set to None or raise error
            # Setting to None since category_id is optional
            product_dict['category_id'] = None
    else:
        # Ensure category_id is None if empty string or not provided
        product_dict['category_id'] = None
    
    product = Product(**product_dict)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TEMPORARILY COMMENTED OUT FOR TESTING
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # If SKU is being updated, check if new SKU already exists (and isn't the current product's SKU)
    update_data = product_data.model_dump(exclude_unset=True)
    if 'sku' in update_data and update_data['sku'] != product.sku:
        existing_product = db.query(Product).filter(Product.sku == update_data['sku']).first()
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )
    
    # Validate and clean category_id if provided
    if 'category_id' in update_data:
        category_id = update_data['category_id']
        if category_id and category_id.strip():
            category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
            if not category:
                update_data['category_id'] = None
        else:
            update_data['category_id'] = None
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product
