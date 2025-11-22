from pydantic import BaseModel, Field, ConfigDict

class DashboardStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    totalProducts: int = Field(alias="total_products")
    lowStockItems: int = Field(alias="low_stock_items")
    pendingReceipts: int = Field(alias="pending_receipts")
    pendingDeliveries: int = Field(alias="pending_deliveries")
    scheduledTransfers: int = Field(alias="scheduled_transfers")

