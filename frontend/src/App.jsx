import React, { useState, useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; 
import HomePage from './pages/HomePage';
import Marketplace from './pages/Marketplace'; // 🔥 NEW: Marketplace Import
import SellerAuth from './components/SellerAuth';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Verification from './pages/Verification';
import ForgotPassword from './pages/ForgotPassword';

// 🔥 NEW: Footer Pages Import
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Support from './pages/Support';

export default function App() {
  
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    return (token && storedUser) ? JSON.parse(storedUser) : null;
  });

  
  // 🔥 Secure Session Validation on App Load (HttpOnly Cookie Fallback)
  useEffect(() => {
    const verifySession = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include' // Validate session via HttpOnly Cookie
        });
        
        if (res.status === 401) {
          // Token/Cookie expired or invalid
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        } else if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
             setUser(data.user);
             localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      } catch (err) {
        console.error("Session verification failed:", err);
      }
    };

    if (user) {
      verifySession();
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950">
        
        <Routes>
          {/* অ্যাডমিন লগইন করা থাকলে হোমপেজের বদলে সরাসরি ড্যাশবোর্ডে যাবে */}
          <Route 
            path="/" 
            element={user?.role === 'admin' ? <Navigate to="/dashboard" /> : <HomePage />} 
          />

          {/* 🔥 NEW: Marketplace Route (Only for logged-in users) */}
          <Route 
            path="/marketplace" 
            element={user ? <Marketplace /> : <Navigate to="/login" />} 
          />

          <Route 
            path="/login" 
            element={!user ? <SellerAuth onAuthSuccess={handleLoginSuccess} /> : <Navigate to={user.role === 'buyer' ? "/" : "/dashboard"} />} 
          />
          <Route 
            path="/register" 
            element={!user ? <SellerAuth onAuthSuccess={handleLoginSuccess} /> : <Navigate to={user.role === 'buyer' ? "/" : "/dashboard"} />} 
          />

          <Route 
            path="/dashboard" 
            element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role === 'admin' ? (
                <AdminDashboard />
              ) : user.role === 'seller' ? (
                <SellerDashboard />
              ) : (
                <BuyerDashboard />
              )
            } 
          />

          <Route path="/reset-password/:id/:token" element={<ResetPassword />} />

          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/verification" element={user ? <Verification /> : <Navigate to="/login" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* 🔥 NEW: Footer Pages Routes */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/support" element={<Support />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
      </div>
    </BrowserRouter>
  );
}