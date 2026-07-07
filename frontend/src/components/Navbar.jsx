import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Home, Bell, X, ShoppingBag, FileText } from 'lucide-react'; 
import SidebarMenu from './SidebarMenu';
import { useLanguage } from '../i18n/LanguageContext';

const Navbar = () => {
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // 🔥 Read Notifications State
  const [readNotifs, setReadNotifs] = useState(() => {
    if (!user || !user.id) return [];
    const saved = localStorage.getItem(`readNotifs_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // 🔥 Derived Unread Count
  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  useEffect(() => {
    const fetchNotifications = async () => {
       if (!user) return;
       try {
          const token = localStorage.getItem('token');
          const headers = { 'Authorization': `Bearer ${token}` };
          const credentials = 'include';
          let notifs = [];

          if (user.role === 'admin') {
              const [resAppeals, resVer, resStats, resProd, resApps] = await Promise.all([
                 fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/appeals`, { headers, credentials }),
                 fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/verifications`, { headers, credentials }),
                 fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/stats`, { headers, credentials }),
                 fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/products`, { headers, credentials }),
                 fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/all`, { headers, credentials }) 
              ]);

              const dataAppeals = await resAppeals.json();
              const dataVer = await resVer.json();
              const dataStats = await resStats.json();
              const dataProd = await resProd.json();
              const dataApps = await resApps.json();

              if (dataAppeals.success) {
                 const c = dataAppeals.data.filter(a => a.status === 'pending').length;
                 if (c > 0) notifs.push({ id: `admin_appeals_${c}`, text: `${c} User Appeals Pending`, subtext: "Review suspended accounts", link: '/dashboard?tab=appeals' });
              }
              if (dataVer.success) {
                 const c = dataVer.data.length; 
                 if (c > 0) notifs.push({ id: `admin_ver_${c}`, text: `${c} KYC Verifications Pending`, subtext: "Approve user profiles", link: '/dashboard?tab=verify-requests' });
              }
              if (dataStats.success) {
                 const d = dataStats.data.pendingDeposits;
                 const w = dataStats.data.pendingWithdrawals;
                 if (d > 0) notifs.push({ id: `admin_dep_${d}`, text: `${d} Deposits Pending`, subtext: "Approve wallet funds", link: '/dashboard?tab=deposits' });
                 if (w > 0) notifs.push({ id: `admin_with_${w}`, text: `${w} Withdrawals Pending`, subtext: "Pay user withdrawals", link: '/dashboard?tab=withdrawals' });
              }
              if (dataProd.success) {
                 const c = dataProd.data.filter(p => p.status === 'pending').length;
                 if (c > 0) notifs.push({ id: `admin_prod_${c}`, text: `${c} Products Awaiting Approval`, subtext: "Review seller products", link: '/dashboard?tab=products' });
              }
              if (dataApps.success) {
                 const newApplies = dataApps.data.filter(a => a.status === 'pending').length;
                 const newOrders = dataApps.data.filter(a => a.status === 'order_submitted').length;
                 const newReviews = dataApps.data.filter(a => a.status === 'review_submitted').length;

                 if (newApplies > 0) notifs.push({ id: `admin_app_${newApplies}`, text: `${newApplies} New Buyer Applications`, subtext: "Approve or reject applications", link: '/dashboard?tab=applications' });
                 if (newOrders > 0) notifs.push({ id: `admin_ord_${newOrders}`, text: `${newOrders} New Orders Submitted`, subtext: "Review submitted Order IDs", link: '/dashboard?tab=applications' });
                 if (newReviews > 0) notifs.push({ id: `admin_rev_${newReviews}`, text: `${newReviews} New Reviews Submitted`, subtext: "Check published review links", link: '/dashboard?tab=applications' });
              }
          } 
          else if (user.role === 'buyer') {
              const [appRes, prodRes] = await Promise.all([
                 fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/my`, { headers, credentials }),
                 fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/products/public`)
              ]);

              if (prodRes.ok) {
                 const prodData = await prodRes.json();
                 if (prodData.success) {
                     const availableCount = prodData.data.filter(p => (parseInt(p.required_orders) || 0) - (parseInt(p.application_count) || 0) > 0).length;
                     if (availableCount > 0) {
                         notifs.push({ id: `buyer_new_prod_${availableCount}`, text: `🔥 ${availableCount} New Products Available!`, subtext: "Apply before they are sold out.", link: '/marketplace' });
                     }
                 }
              }

              if (appRes.ok) {
                 const appData = await appRes.json();
                 if (appData.success) {
                     appData.data.forEach(app => {
                         const status = app.application_status;
                         const pName = app.product_name ? app.product_name.substring(0, 22) + '...' : 'Product';
                         const appIdParams = `&appId=${app.application_id || app.id}`;
                         const notifId = `buyer_app_${app.application_id || app.id}_${status}`;

                         if (status === 'approved') {
                             notifs.push({ id: notifId, text: `✅ App Approved!`, subtext: `Submit order for ${pName}`, link: `/dashboard?tab=active${appIdParams}` });
                         } else if (status === 'order_approved') {
                             notifs.push({ id: notifId, text: `✅ Order Verified!`, subtext: `Submit feedback for ${pName}`, link: `/dashboard?tab=active${appIdParams}` });
                         } else if (status === 'completed') {
                             notifs.push({ id: notifId, text: `💰 Refund Paid!`, subtext: `Funds added for ${pName}`, link: `/dashboard?tab=completed${appIdParams}` });
                         } else if (status === 'rejected') {
                             notifs.push({ id: notifId, text: `❌ Action Rejected`, subtext: `Issue with ${pName}`, link: `/dashboard?tab=failed${appIdParams}` });
                         } else if (status === 'pending_refund') {
                             notifs.push({ id: notifId, text: `⏳ Feedback Approved`, subtext: `Pending refund for ${pName}`, link: `/dashboard?tab=active${appIdParams}` });
                         }
                     });
                 }
              }
          }
          else if (user.role === 'seller') {
              const prodRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/products/my`, { headers, credentials });

              if (prodRes.ok) {
                 const prodData = await prodRes.json();
                 if (prodData.success) {
                    prodData.data.forEach(p => {
                        if (p.status === 'rejected') {
                            notifs.push({ id: `seller_rej_${p.id}`, text: `❌ Product Rejected & Refunded`, subtext: `Deposit for "${p.product_name || p.store_name}" added back to your wallet.`, link: '/dashboard?tab=overview' });
                        } else if (p.status === 'approved') {
                            notifs.push({ id: `seller_app_${p.id}`, text: `✅ Product Approved!`, subtext: p.product_name || p.store_name, link: '/dashboard?tab=tracking' });
                        }
                    });
                 }
              }
          }

          // 🔥 সব নোটিফিকেশন স্টেট-এ সেভ করা হচ্ছে
          setNotifications(notifs.slice(0, 15)); 
       } catch (e) {
          console.error("Failed to load notifications", e);
       }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [user?.role, showNotif]); // readNotifs ডিপেন্ডেন্সি থেকে সরানো হলো

  const toggleNotifications = () => {
    setShowNotif(!showNotif);
  };

  // 🔥 শুধু রিড হিসেবে মার্ক করার লজিক (লিস্ট থেকে রিমুভ হবে না)
  const markAsRead = (notifId, e = null) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (readNotifs.includes(notifId)) return; 
    
    const updatedReadNotifs = [...readNotifs, notifId];
    setReadNotifs(updatedReadNotifs);
    
    if (user && user.id) {
        localStorage.setItem(`readNotifs_${user.id}`, JSON.stringify(updatedReadNotifs));
    }
  };

  const clearAllNotifications = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const allCurrentIds = notifications.map(n => n.id);
    const updatedReadNotifs = Array.from(new Set([...readNotifs, ...allCurrentIds]));
    
    setReadNotifs(updatedReadNotifs);
    if (user && user.id) {
        localStorage.setItem(`readNotifs_${user.id}`, JSON.stringify(updatedReadNotifs));
    }
  };

  const handleNotificationClick = (notifId) => {
    markAsRead(notifId);
    setShowNotif(false);
  };

  // 🔥 X বাটনে ক্লিক করলে লিস্ট থেকে পার্মানেন্টলি ডিলিট হবে
  const removeNotificationCompletely = (notifId, e) => {
    markAsRead(notifId, e);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  return (
    <>
      <nav className="bg-white text-gray-800 sticky top-0 z-40 border-b border-gray-100 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-3">
              {user && (
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="p-2 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 rounded-lg transition-all"
                >
                  <Menu size={24} />
                </button>
              )}
              <Link to="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                <span className="text-xl font-black tracking-tight text-gray-900">
                  Promot<span className="text-[#10b981]">Insight</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
               <Link to="/" className="relative cursor-pointer p-2 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg transition-all" title={t('nav_home')}>
                 <Home size={22} />
               </Link>

               <Link to="/blogs" className="relative cursor-pointer p-2 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg transition-all" title={t('nav_blogs')}>
                 <FileText size={22} />
               </Link>

               {user ? (
                 <>
                   {user.role !== 'admin' && (
                     <Link to="/marketplace" className="relative cursor-pointer p-2 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg transition-all" title={t('nav_marketplace')}>
                       <ShoppingBag size={22} />
                     </Link>
                   )}

                   <div className="relative">
                     <div className="cursor-pointer p-2 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg transition-all flex items-center" onClick={toggleNotifications} title={t('nav_notifications')}>
                       <Bell size={22} />
                       {unreadCount > 0 && (
                         <span className="absolute top-1.5 right-1.5 bg-[#10b981] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                           {unreadCount > 9 ? '9+' : unreadCount}
                         </span>
                       )}
                     </div>

                     {showNotif && (
                       <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                         
                         <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-4 flex justify-between items-center">
                           <h3 className="text-gray-900 font-black text-sm">{t('notifications')}</h3>
                           <div className="flex items-center gap-3">
                             <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} {t('new_count')}</span>
                             {unreadCount > 0 && (
                               <button onClick={clearAllNotifications} className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline transition-colors">
                                 {t('clear_all')}
                               </button>
                             )}
                           </div>
                         </div>
                         
                         <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-10 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Bell size={20} className="text-gray-300" />
                                </div>
                                <p className="text-gray-400 text-xs font-medium">{t('no_notifications')}</p>
                              </div>
                            ) : (
                              notifications.map((n, idx) => {
                                // 🔥 UPDATE: চেক করা হচ্ছে এটি পড়া হয়েছে কিনা
                                const isRead = readNotifs.includes(n.id);
                                
                                return (
                                  <div key={idx} className={`relative group block border-b border-gray-50 transition-colors ${isRead ? 'bg-white opacity-70' : 'bg-emerald-50/20'}`}>
                                    <Link 
                                      to={n.link} 
                                      onClick={() => handleNotificationClick(n.id)} 
                                      className="block px-4 py-4 pr-12"
                                    >
                                      {/* 🔥 UPDATE: পড়া হলে নরমাল লেখা, না পড়া হলে বোল্ড (Bold) লেখা */}
                                      <p className={`text-sm text-gray-800 leading-tight mb-1 ${isRead ? 'font-medium' : 'font-black'}`}>{n.text}</p>
                                      <p className={`text-[11px] ${isRead ? 'text-gray-400' : 'text-gray-600 font-medium'} line-clamp-1`}>{n.subtext || t('click_to_view')}</p>
                                    </Link>
                                    
                                    <button 
                                      onClick={(e) => removeNotificationCompletely(n.id, e)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-white rounded-full"
                                      title="Dismiss notification"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                         </div>
                       </div>
                     )}
                   </div>
                 </>
               ) : (
                 <div className="flex items-center gap-2 sm:gap-3 ml-2">
                   <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-[#10b981] transition-colors">{t('login')}</Link>
                   <Link to="/register" className="bg-[#10b981] hover:bg-[#059669] text-white text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm transition-all">{t('signup')}</Link>
                 </div>
               )}
            </div>

          </div>
        </div>
      </nav>

      <SidebarMenu isOpen={isSidebarOpen} setIsOpen={setIsOpen => {
         setIsSidebarOpen(setIsOpen);
         if (showNotif) setShowNotif(false);
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </>
  );
};

export default Navbar;