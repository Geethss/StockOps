from pydantic import BaseModel, Field, ConfigDict

class DashboardStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    totalProducts: int = Field(alias="total_products", serialization_alias="totalProducts")
    lowStockItems: int = Field(alias="low_stock_items", serialization_alias="lowStockItems")
    pendingReceipts: int = Field(alias="pending_receipts", serialization_alias="pendingReceipts")
    pendingDeliveries: int = Field(alias="pending_deliveries", serialization_alias="pendingDeliveries")
    scheduledTransfers: int = Field(alias="scheduled_transfers", serialization_alias="scheduledTransfers")

