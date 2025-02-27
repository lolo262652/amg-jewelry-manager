import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Suppliers from './pages/suppliers/Suppliers'
import Categories from './pages/categories/Categories'
import Products from './pages/products/Products'
import Settings from './pages/Settings'
import Clients from './pages/clients/Clients'
import SupplierOrders from './pages/supplier-orders/SupplierOrders'

const PrivateRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

const AppRoutes = ({ toggleColorMode }) => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout toggleColorMode={toggleColorMode} />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="categories" element={<Categories />} />
        <Route path="products" element={<Products />} />
        <Route path="clients" element={<Clients />} />
        <Route path="supplier-orders" element={<SupplierOrders />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
