from fastapi import APIRouter
from app.api.v1.endpoints import auth, products, receipts, deliveries, warehouses, locations, dashboard, stock, movements, transfers

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(deliveries.router, prefix="/deliveries", tags=["deliveries"])
api_router.include_router(warehouses.router, prefix="/warehouses", tags=["warehouses"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(stock.router, prefix="/stock", tags=["stock"])
api_router.include_router(movements.router, prefix="/movements", tags=["movements"])
api_router.include_router(transfers.router, prefix="/transfers", tags=["transfers"])

