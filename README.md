# StockMaster - Inventory Management System (IMS)

A full-stack Inventory Management System built with React and FastAPI.

## 🚀 Features

- **Dashboard** - Overview of inventory operations with KPIs
- **Product Management** - Create and manage products with SKU, categories, and unit of measure
- **Stock Management** - View and update stock levels per location
- **Receipts** - Manage incoming stock from suppliers
- **Deliveries** - Manage outgoing stock deliveries
- **Move History** - Track all stock movements
- **Warehouse & Location Management** - Manage warehouses and their locations
- **Real-time Updates** - Socket.IO integration for live stock updates
- **Authentication** - Secure user authentication with JWT

## 📋 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- TanStack Query
- React Hook Form
- AG Grid
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
- PostgreSQL 16+

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
cp .env.example .env
```

5. Update `.env` with your database credentials

6. Create database and run migrations:
```bash
createdb stockmaster
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

4. Update `.env` with API URLs:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

5. Run frontend server:
```bash
npm run dev
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 📁 Project Structure

```
StockOps/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── routes/
│   └── package.json
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── websocket/
│   └── requirements.txt
└── README.md
```

## 🔐 Authentication

The system uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests.

## 📝 License

MIT

