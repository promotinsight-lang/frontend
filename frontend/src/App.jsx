import {  useState, useEffect  } from 'react'; 
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
import RoleSelection from './components/RoleSelection';

// 櫨 NEW: Footer Pages Import


// 🔥 NEW: Footer Pages Import
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Support from './pages/Support';

// 🔥 NEW: Blog Pages Import
import Blogs from './pages/Blogs';
import BlogDetails from './pages/BlogDetails';
import { LanguageProvider } from './i18n/LanguageContext';

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // 🔥 Secure Session Validation on App Load (HttpOnly Cookie Fallback)
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/profile`, {
          credentials: 'include' // Validate session via HttpOnly Cookie
        });
        
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('user');
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
      } finally {
        setIsSessionLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  if (isSessionLoading) {
    return <div className="min-h-screen bg-slate-950" aria-busy="true" />;
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950">
          <Routes>
          {/* Admin login kora thakle homepage-er bodle shorasori dashboard-e jabe */}
          <Route 
            path="/" 
            element={user?.role === 'admin' ? <Navigate to="/dashboard" /> : <HomePage />} 
          />

          {/* 🔥 NEW: Marketplace Route (Only for logged-in users) */}
          <Route 
            path="/marketplace" 
            element={user ? <Marketplace /> : <Navigate to="/login" />} 
          />

          {/* 🔥 NEW: Blog Routes (Public - Anyone can access) */}
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blog/:slug" element={<BlogDetails />} />

          {/* 🔥 NEW: Route to Role Selection first */}
          <Route 
            path="/login" 
            element={!user ? <RoleSelection /> : <Navigate to={user.role === 'buyer' ? "/" : "/dashboard"} />} 
          />
          <Route 
            path="/register" 
            element={!user ? <RoleSelection /> : <Navigate to={user.role === 'buyer' ? "/" : "/dashboard"} />} 
          />

          {/* 🔥 Actual Auth Forms */}
          <Route 
            path="/login-form" 
            element={!user ? <SellerAuth onAuthSuccess={handleLoginSuccess} /> : <Navigate to={user.role === 'buyer' ? "/" : "/dashboard"} />} 
          />
          <Route 
            path="/register-form" 
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
    </LanguageProvider>
  );
}
