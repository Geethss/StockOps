# StockMaster IMS - Backend API

FastAPI-based backend for Inventory Management System.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **Socket.IO** - Real-time updates
- **JWT** - Authentication

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 16+

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
DATABASE_URL=postgresql://admin:password@localhost:5432/stockmaster
SECRET_KEY=your-secret-key-here
```

5. Create database:
```bash
createdb stockmaster
```

6. Run migrations:
```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

7. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/docs
- **Socket.IO**: http://localhost:8000/socket.io

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products/{id}` - Get product
- `PUT /api/v1/products/{id}` - Update product
- `GET /api/v1/products/search` - Search products

### Receipts
- `GET /api/v1/receipts` - List receipts
- `POST /api/v1/receipts` - Create receipt
- `GET /api/v1/receipts/{id}` - Get receipt
- `POST /api/v1/receipts/{id}/validate` - Validate receipt

### Deliveries
- `GET /api/v1/deliveries` - List deliveries
- `POST /api/v1/deliveries` - Create delivery
- `GET /api/v1/deliveries/{id}` - Get delivery
- `POST /api/v1/deliveries/{id}/validate` - Validate delivery

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/pending-operations` - Get pending operations
- `GET /api/v1/dashboard/low-stock` - Get low stock items

### Stock
- `GET /api/v1/stock` - Get stock levels
- `PUT /api/v1/stock/{product_id}/{location_id}` - Update stock

### Movements
- `GET /api/v1/movements` - Get move history
- `GET /api/v1/movements/search` - Search movements

### Warehouses
- `GET /api/v1/warehouses` - List warehouses
- `POST /api/v1/warehouses` - Create warehouse
- `GET /api/v1/warehouses/{id}` - Get warehouse
- `PUT /api/v1/warehouses/{id}` - Update warehouse

### Locations
- `GET /api/v1/locations` - List locations
- `POST /api/v1/locations` - Create location
- `GET /api/v1/locations/{id}` - Get location
- `PUT /api/v1/locations/{id}` - Update location

## Real-time Updates (Socket.IO)

Connect to Socket.IO:
```javascript
import io from 'socket.io-client'
const socket = io('http://localhost:8000')
```

Events:
- `join_warehouse` - Join warehouse room
- `stock:updated` - Stock update event
- `receipt:created` - Receipt created event
- `delivery:created` - Delivery created event
- `low_stock:alert` - Low stock alert

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
```

### Linting
```bash
flake8 app/
```

## Database Schema

See `app/models/` for SQLAlchemy models.

## License

MIT

