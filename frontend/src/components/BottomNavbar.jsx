import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Headset, User } from 'lucide-react';

const BottomNavbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // ইউজার লগইন করা না থাকলে বটম ন্যাভবার দেখানোর দরকার নেই
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  if (!user) return null;

  return (
    // md:hidden ক্লাসটি দিয়েছি যাতে পিসির বড় স্ক্রিনে এটা দেখা না যায়, শুধু মোবাইলে দেখায়
    // 🔥 Updated to Premium Light Theme matching the rest of the application
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 md:hidden pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 px-2">
        
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${currentPath === '/' ? 'text-[#0066ff]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={currentPath === '/' ? 24 : 22} className={currentPath === '/' ? 'drop-shadow-sm' : ''} />
          <span className={`text-[10px] font-bold ${currentPath === '/' ? 'text-[#0066ff]' : ''}`}>Home</span>
        </Link>
        
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${currentPath === '/dashboard' ? 'text-[#0066ff]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ClipboardList size={currentPath === '/dashboard' ? 24 : 22} className={currentPath === '/dashboard' ? 'drop-shadow-sm' : ''} />
          <span className={`text-[10px] font-bold ${currentPath === '/dashboard' ? 'text-[#0066ff]' : ''}`}>Orders</span>
        </Link>

        {/* Support Page */}
        <Link 
          to="/dashboard?tab=support" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${currentPath.includes('support') ? 'text-[#0066ff]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Headset size={currentPath.includes('support') ? 24 : 22} className={currentPath.includes('support') ? 'drop-shadow-sm' : ''} />
          <span className={`text-[10px] font-bold ${currentPath.includes('support') ? 'text-[#0066ff]' : ''}`}>Support</span>
        </Link>

        {/* Profile Page */}
        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${currentPath === '/profile' ? 'text-[#0066ff]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <User size={currentPath === '/profile' ? 24 : 22} className={currentPath === '/profile' ? 'drop-shadow-sm' : ''} />
          <span className={`text-[10px] font-bold ${currentPath === '/profile' ? 'text-[#0066ff]' : ''}`}>Account</span>
        </Link>

      </div>
    </div>
  );
};

export default BottomNavbar;