import { Routes, Route, Navigate } from 'react-router-dom'
// TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
// import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
// import PrivateRoute from './routes/PrivateRoute'

// Auth pages
import Login from './features/auth/Login'
import SignUp from './features/auth/SignUp'

// Feature pages
import Dashboard from './features/dashboard/Dashboard'
import Products from './features/products/Products'
import Stock from './features/stock/Stock'
import Receipts from './features/receipts/Receipts'
import Deliveries from './features/deliveries/Deliveries'
import Movements from './features/movements/Movements'
import Warehouses from './features/settings/Warehouses'
import Locations from './features/settings/Locations'

function App() {
  // TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
  // const { user } = useAuth()

  return (
    <Routes>
      {/* TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled */}
      {/* <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} /> */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled */}
      {/* <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}> */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="stock" element={<Stock />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="movements" element={<Movements />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="locations" element={<Locations />} />
      </Route>
    </Routes>
  )
}

export default App

