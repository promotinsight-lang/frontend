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
import { API_BASE_URL } from './utils/apiClient';

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
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [showSlowServerNotice, setShowSlowServerNotice] = useState(false);

  // 🔥 Secure Session Validation on App Load (HttpOnly Cookie Fallback)
  useEffect(() => {
    let isMounted = true;
    const slowNoticeTimer = window.setTimeout(() => {
      if (isMounted) setShowSlowServerNotice(true);
    }, 2500);

    const verifySession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          credentials: 'include' // Validate session via HttpOnly Cookie
        });

        if (!isMounted) return;

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
        if (isMounted) {
          setIsSessionChecking(false);
          setShowSlowServerNotice(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
      window.clearTimeout(slowNoticeTimer);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950">
          {isSessionChecking && showSlowServerNotice && (
            <div className="fixed inset-x-0 top-0 z-[9999] bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900 shadow-sm">
              Server is waking up. You can keep browsing while we reconnect your session.
            </div>
          )}

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
