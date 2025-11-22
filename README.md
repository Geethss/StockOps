# StockMaster - Inventory Management System (IMS)

The goal is to build a modular **Inventory Management System (IMS)** that digitizes and streamlines all stock-related operations within a business. This centralized, real-time, and easy-to-use application is designed to replace manual registers, Excel sheets, and scattered tracking methods.

Video Link - https://youtu.be/bNxi7BokvM4

## Team Details

| Name |
|---|
| Pedamallu Sri Geethanjali |
| Deepthi Marreddy |
| Sydam Manikyala Rao |
| Sushma Kothamasu |

## Reviewer Name

Aman Patel

## 🚀 Features

- **Dashboard** - Overview of inventory operations with KPIs and activity metrics
- **Product Management** - Create and manage products with SKU, categories, and unit of measure
- **Stock Management** - Real-time stock levels, filters, and **Stock Adjustments**
- **Receipts** - Manage incoming stock with validation and **Kanban View**
- **Deliveries** - Manage outgoing deliveries with validation and **Kanban View**
- **Internal Transfers** - Move stock between locations with validation and **Kanban View**
- **Move History** - Comprehensive log of all stock movements (Receipts, Deliveries, Transfers, Adjustments)
- **Warehouse & Location Management** - Configure multi-warehouse and multi-location setups
- **Real-time Updates** - Socket.IO integration for live stock and operation updates
- **Authentication** - Secure user authentication with JWT (Temporarily disabled for testing)

## 📋 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- TanStack Query
- React Hook Form
- AG Grid (Data Tables)
- Kanban Board (Custom Drag-and-Drop)
- Socket.IO Client

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Pydantic
- Socket.IO
- JWT Authentication

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 16+ (or Neon DB)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.template .env
```

5. Update `.env` with your database credentials (`DATABASE_URL`).

6. Create database migrations and apply them:
```bash
# If running for the first time or after adding new models (like Transfers):
alembic revision --autogenerate -m "Add transfers table"
alembic upgrade head
```

7. Run backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with API URLs (default provided):
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

5. Run frontend server:
```bash
npm run dev
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📁 Project Structure

```
StockOps/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/ # UI & Common components (Kanban, etc.)
│   │   ├── features/   # Feature-based modules (Products, Stock, Transfers, etc.)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Configurations & utilities
│   │   └── routes/     # Route definitions
│   └── package.json
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/        # API Endpoints
│   │   ├── models/     # Database Models
│   │   ├── schemas/    # Pydantic Schemas
│   │   ├── services/   # Business Logic
│   │   └── websocket/  # Socket.IO Handlers
│   └── requirements.txt
└── README.md
```

## 🔐 Authentication

The system uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests.
*Note: Authentication logic is currently commented out for development and testing ease.*

## 📝 License

MIT
