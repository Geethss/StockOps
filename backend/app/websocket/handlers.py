import socketio
from app.core.database import SessionLocal

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    async_mode='asgi'
)

sio_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_warehouse(sid, data):
    """Join a warehouse room for real-time updates"""
    warehouse_id = data.get('warehouse_id')
    if warehouse_id:
        sio.enter_room(sid, f"warehouse:{warehouse_id}")
        await sio.emit('joined_warehouse', {'warehouse_id': warehouse_id}, room=sid)

@sio.event
async def leave_warehouse(sid, data):
    """Leave a warehouse room"""
    warehouse_id = data.get('warehouse_id')
    if warehouse_id:
        sio.leave_room(sid, f"warehouse:{warehouse_id}")

async def emit_stock_update(product_id: str, location_id: str, warehouse_id: str, quantity: float):
    """Emit stock update to all clients in the warehouse room"""
    await sio.emit('stock:updated', {
        'product_id': product_id,
        'location_id': location_id,
        'warehouse_id': warehouse_id,
        'quantity': quantity
    }, room=f"warehouse:{warehouse_id}")

async def emit_receipt_created(receipt_data: dict, warehouse_id: str):
    """Emit receipt creation event"""
    await sio.emit('receipt:created', receipt_data, room=f"warehouse:{warehouse_id}")

async def emit_delivery_created(delivery_data: dict, warehouse_id: str):
    """Emit delivery creation event"""
    await sio.emit('delivery:created', delivery_data, room=f"warehouse:{warehouse_id}")

async def emit_transfer_created(transfer_data: dict, warehouse_id: str):
    """Emit transfer creation event"""
    await sio.emit('transfer:created', transfer_data, room=f"warehouse:{warehouse_id}")

async def emit_low_stock_alert(product_id: str, warehouse_id: str, current_stock: float):
    """Emit low stock alert"""
    await sio.emit('low_stock:alert', {
        'product_id': product_id,
        'warehouse_id': warehouse_id,
        'current_stock': current_stock
    }, room=f"warehouse:{warehouse_id}")

