# StockMaster IMS - Frontend

React-based frontend for Inventory Management System.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **AG Grid** - Data grids
- **Socket.IO Client** - Real-time updates
- **React Router** - Routing

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

4. Run development server:
```bash
npm run dev
# or
yarn dev
```

The app will be available at http://localhost:5173

## Build

```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── features/          # Feature-based modules
├── hooks/             # Custom React hooks
├── lib/               # Configurations & utilities
├── context/           # React Context providers
├── routes/            # Routing configuration
└── App.jsx           # Main app component
```

## Features

- Authentication (Login/Signup)
- Dashboard with KPIs
- Product Management
- Stock Management
- Receipts (Incoming Stock)
- Deliveries (Outgoing Stock)
- Move History
- Warehouse & Location Settings

## API Integration

The frontend communicates with the FastAPI backend:
- Base URL: `http://localhost:8000/api/v1`
- Socket.IO: `http://localhost:8000/socket.io`

## License

MIT

