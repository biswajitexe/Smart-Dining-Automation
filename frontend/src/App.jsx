import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CustomerMenu } from './pages/CustomerMenu';
import { OrderTrack } from './pages/OrderTrack';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';

// Protected Route Wrapper for Admin/Staff Dashboard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Default route opens Table #1 menu */}
                <Route path="/" element={<Navigate to="/table/1" replace />} />
                
                {/* Customer Ordering Route */}
                <Route path="/table/:tableNumber" element={<CustomerMenu />} />
                
                {/* Customer Live Order Tracker */}
                <Route path="/order-track/:orderId" element={<OrderTrack />} />
                
                {/* Staff Login */}
                <Route path="/login" element={<Login />} />
                
                {/* Staff / Admin Dashboard */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
