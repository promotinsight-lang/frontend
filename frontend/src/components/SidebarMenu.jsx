import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, User, AlertTriangle, CheckCircle,
  LogOut, ChevronRight, X, Snowflake, ShieldAlert,
  LayoutDashboard, ShoppingCart, Package, Wallet, Landmark, Settings,
  List, UserCheck, History, PlusCircle, Users, Scale, Headset, Megaphone, FileText 
} from 'lucide-react';

const SidebarMenu = ({ isOpen, setIsOpen }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = async () => {
    try {
      await fetch('https://backend-6aiq.onrender.com/api/users/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
    } catch (err) {
      console.error("Logout error", err);
    }
    
    // 🔥 UPDATE: localStorage.clear() এর বদলে নির্দিষ্ট ডেটা রিমুভ করা হলো
    // এর ফলে নোটিফিকেশনের রিড (Read) হিস্ট্রি ব্রাউজারে থেকে যাবে
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('referral_code');
    
    window.location.replace('/');
  };

  const isVerified = user?.verification_status === 'approved';
  const isPending = user?.verification_status === 'pending';
  
  const isActive = user?.is_active !== false;
  const isFrozen = user?.is_frozen === true;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[340px] bg-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto shadow-2xl`}>
        
        <div className="bg-[#0066ff] p-6 pt-10 relative border-b border-blue-700/20">
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 bg-white/10 rounded-full hover:bg-white/20">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shadow-sm shrink-0">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{user ? user.name : 'Guest User'}</h2>
              
              <div className="flex flex-col items-start gap-1.5 mt-2">
                <div className="flex flex-wrap gap-1">
                  {user?.role === 'admin' && (
                    <span className="bg-white/20 text-white text-[10px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider border border-white/10">
                      Admin
                    </span>
                  )}
                  {user?.role === 'seller' && (
                    <span className="bg-white/20 text-white text-[10px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider border border-white/10">
                      Seller
                    </span>
                  )}
                  
                  {!isActive && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1 tracking-wider shadow-sm">
                      <ShieldAlert size={10}/> Disabled
                    </span>
                  )}
                  {isFrozen && isActive && (
                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1 tracking-wider shadow-sm">
                      <Snowflake size={10}/> Frozen
                    </span>
                  )}
                </div>

                {user?.role !== 'admin' && (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 tracking-wider border shadow-sm ${isVerified ? 'bg-green-500/20 border-green-400 text-green-50' : isPending ? 'bg-yellow-500/20 border-yellow-400 text-yellow-50' : 'bg-white/10 border-white/30 text-white'}`}>
                    {isVerified ? <CheckCircle size={10}/> : <AlertTriangle size={10}/>}
                    {isVerified ? 'Verified' : isPending ? 'Pending' : 'Unverified'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {user?.role !== 'admin' && !isVerified && !isPending && isActive && (
            <div className="mt-5">
              <Link to="/verification" onClick={() => setIsOpen(false)} className="block text-center bg-white text-[#0066ff] hover:bg-gray-50 text-xs px-4 py-2.5 rounded-lg font-bold shadow-lg transition-colors uppercase tracking-wide">
                Complete Verification
              </Link>
            </div>
          )}
        </div>

        {/* 🔥 UPDATE: Removed user?.role !== 'seller' restriction so seller also sees balance here */}
        {user?.role !== 'admin' && (
          <div className="bg-gray-50/80 p-5 flex flex-col items-center justify-center border-b border-gray-100">
            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Available Balance
            </div>
            <div className="text-gray-900 font-black text-3xl flex items-center gap-2">
              <span className="bg-white p-1.5 rounded-full text-green-500 shadow-sm border border-gray-100">
                <Wallet size={20} />
              </span>
              ${Number(user?.wallet_balance || 0).toFixed(2)}
            </div>
          </div>
        )}

        <div className="py-3 px-2">
          
          {user?.role === 'admin' ? (
            <>
              <Link to="/dashboard?tab=overview" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <LayoutDashboard size={20} />
                  <span className="font-bold">Overview</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=all-buyers" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Users size={20} />
                  <span className="font-semibold">All Buyers</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=all-sellers" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Users size={20} />
                  <span className="font-semibold">All Sellers</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=verify-requests" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <UserCheck size={20} />
                  <span className="font-semibold">Verify Requests</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=appeals" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Scale size={20} />
                  <span className="font-semibold">User Appeals</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=applications" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <ShoppingCart size={20} />
                  <span className="font-semibold">Orders</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=products" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Package size={20} />
                  <span className="font-semibold">Pending Products</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=all-products" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <List size={20} />
                  <span className="font-semibold">All Products</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=deposits" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Wallet size={20} />
                  <span className="font-semibold">Deposits</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=withdrawals" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Landmark size={20} />
                  <span className="font-semibold">Withdrawals</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=history" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <History size={20} />
                  <span className="font-semibold">History & Refunds</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=support-tickets" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Headset size={20} />
                  <span className="font-semibold">Support Tickets</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=announcements" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Megaphone size={20} />
                  <span className="font-semibold">Announcements</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=blogs" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <FileText size={20} />
                  <span className="font-semibold">Manage Blogs</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=settings" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Settings size={20} />
                  <span className="font-semibold">Settings</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>
            </>
          ) : user?.role === 'seller' ? (
             <>
                <Link to="/dashboard?tab=overview" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <LayoutDashboard size={20} />
                    <span className="font-bold">Overview</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>

                <Link to="/dashboard?tab=add" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <PlusCircle size={20} />
                    <span className="font-semibold">Add Product</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>

                <Link to="/dashboard?tab=tracking" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <Package size={20} />
                    <span className="font-semibold">Order Tracking</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>

                <Link to="/dashboard?tab=funds" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <Wallet size={20} />
                    <span className="font-semibold">Fund Management</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>

                <Link to="/dashboard?tab=refunds" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <History size={20} />
                    <span className="font-semibold">Refunds (Deleted)</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>

                <Link to="/dashboard?tab=appeals" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <Scale size={20} />
                    <span className="font-semibold">My Appeals</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>

                <Link to="/dashboard?tab=announcements" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <Megaphone size={20} />
                    <span className="font-semibold">Announcements</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>

                <Link to="/dashboard?tab=support" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <Headset size={20} />
                    <span className="font-semibold">Support Ticket</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>
                
                <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                    <User size={20} />
                    <span className="font-semibold">My Account</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
                </Link>
             </>
          ) : (
            <>
              <Link to="/dashboard?tab=active" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <ShoppingBag size={20} />
                  <span className="font-bold">My Orders</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>
              
              <Link to="/dashboard?tab=wallet" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Wallet size={20} />
                  <span className="font-semibold">My Wallet</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=referral" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Users size={20} />
                  <span className="font-semibold">Refer & Earn</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=announcements" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Megaphone size={20} />
                  <span className="font-semibold">Announcements</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/dashboard?tab=support" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <Headset size={20} />
                  <span className="font-semibold">Support Ticket</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>

              <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center justify-between px-4 py-3.5 mx-2 my-1 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#0066ff] transition-colors">
                  <User size={20} />
                  <span className="font-semibold">My Account</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0066ff]" />
              </Link>
            </>
          )}

          <div className="mt-4 pt-2 mx-4 border-t border-gray-100">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-colors font-bold shadow-sm">
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default SidebarMenu;