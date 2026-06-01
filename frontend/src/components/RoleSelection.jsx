import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // চেক করুন ইউজার লগইন নাকি রেজিস্টার করতে চাচ্ছে
  const isLogin = location.pathname.includes('/login');
  const actionText = isLogin ? 'Login' : 'Register';
  const targetPath = isLogin ? '/login-form' : '/register-form';

  const handleRoleSelect = (role) => {
    navigate(`${targetPath}?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-20 left-4 md:left-8 flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>

        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">Welcome to PromotInsight</h1>
          <p className="text-gray-500 font-medium">Please select your account type to {actionText.toLowerCase()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* BUYER CARD */}
          <div 
            onClick={() => handleRoleSelect('buyer')}
            className="bg-white border-2 border-transparent hover:border-[#0066ff] rounded-3xl p-8 cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group"
          >
            <div className="w-20 h-20 bg-blue-50 text-[#0066ff] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingCart size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">I am a Buyer</h2>
            <p className="text-sm text-gray-500 mb-6">I want to test products, leave reviews, and earn 100% cashback plus rewards.</p>
            <button className="mt-auto w-full bg-blue-50 text-[#0066ff] group-hover:bg-[#0066ff] group-hover:text-white py-3 rounded-xl font-bold transition-colors">
              Continue as Buyer
            </button>
          </div>

          {/* SELLER CARD */}
          <div 
            onClick={() => handleRoleSelect('seller')}
            className="bg-white border-2 border-transparent hover:border-yellow-400 rounded-3xl p-8 cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group"
          >
            <div className="w-20 h-20 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">I am a Seller</h2>
            <p className="text-sm text-gray-500 mb-6">I want to list my products, boost rankings, and get verified organic reviews.</p>
            <button className="mt-auto w-full bg-yellow-50 text-yellow-600 group-hover:bg-yellow-400 group-hover:text-gray-900 py-3 rounded-xl font-bold transition-colors">
              Continue as Seller
            </button>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}