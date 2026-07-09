import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

export default function AdminChatNotifier() {
  const [pendingCount, setPendingCount] = useState(0);

  const getHeaders = () => ({
    withCredentials: true,
  });

  useEffect(() => {
    // শুধুমাত্র এডমিনদের জন্যই এই নোটিফিকেশন কাজ করবে
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') return;

    const checkRequests = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/private-chat/admin/requests`, getHeaders());
        if (res.data && res.data.success) {
          const currentCount = res.data.data.length;
          
          // যদি আগের চেয়ে নতুন রিকোয়েস্ট বেশি হয়, তাহলে সাউন্ড বাজবে
          if (currentCount > pendingCount) {
            try { 
              const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
              audio.play(); 
            } catch {}
          }
          
          setPendingCount(currentCount);
        }
      } catch {}
    };

    // কম্পোনেন্ট লোড হলেই একবার চেক করবে
    checkRequests();
    
    // এরপর প্রতি ৫ সেকেন্ড পর পর ব্যাকগ্রাউন্ডে সাইলেন্টলি চেক করতে থাকবে
    const interval = setInterval(checkRequests, 5000); 

    return () => clearInterval(interval);
  }, [pendingCount]);

  // যদি কোনো পেন্ডিং রিকোয়েস্ট না থাকে, তাহলে কিছুই দেখাবে না
  if (pendingCount === 0) return null;

  return (
    <div 
      onClick={() => window.location.href = '/dashboard?tab=live-chat'} 
      className="fixed top-24 right-6 z-[99999] bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-2xl rounded-2xl p-4 flex items-center gap-4 animate-bounce cursor-pointer transition-all border-2 border-white"
    >
      <div className="bg-white p-2 rounded-full text-red-500 shadow-inner">
        <AlertCircle className="w-6 h-6 animate-pulse" />
      </div>
      <div>
        <p className="font-black text-sm">New Chat Request!</p>
        <p className="text-xs font-bold">{pendingCount} User(s) waiting for support.</p>
      </div>
    </div>
  );
}
