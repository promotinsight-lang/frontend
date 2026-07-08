import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Lock, ShieldAlert, Sparkles, Eye, ShoppingBag
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { formatProductMoney } from '../utils/currency';

export default function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [applicationByProduct, setApplicationByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let parsedUser = null;
    if (storedUser) {
      parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.is_active === false || parsedUser.is_active === "false" || parsedUser.is_active === 0) setIsAccountDisabled(true);
    } else {
        // User logged in na thakle login page e pathiye dibe
        navigate('/login');
    }

    const fetchLiveProfile = async () => {
      const token = localStorage.getItem('token');
      if(!token) return;
      try {
         const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/profile`, { 
           headers: { 'Authorization': `Bearer ${token}` },
           credentials: 'include' // 🔥 Required for HttpOnly Cookies
         });
         
         if (res.status === 429) {
           console.warn('Rate limit exceeded on profile fetch');
           return;
         }

         const data = await res.json();
         if(data.success) {
            if(data.user.is_active === false || data.user.is_active === "false" || data.user.is_active === 0) setIsAccountDisabled(true);
            if(data.user.is_active === false) setIsAccountDisabled(true);
            const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...lsUser, is_active: data.user.is_active, is_frozen: data.user.is_frozen }));
         }
      } catch(e) {
         console.error("Silent auth check failed", e);
      }
    };

    const fetchMyApplications = async () => {
      const token = localStorage.getItem('token');
      if (!token || parsedUser?.role !== 'buyer') return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/my`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });

        if (!res.ok) return;

        const data = await res.json();
        const nextMap = {};
        (data.data || []).forEach((app) => {
          nextMap[String(app.product_id)] = app;
        });
        setApplicationByProduct(nextMap);
      } catch (error) {
        console.error("Error fetching buyer applications:", error);
      }
    };

    const fetchPublicProducts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/products/public`, {
           credentials: 'omit' // Not required for public route, but added for safety
        });
        
        if (res.status === 429) {
          console.warn('Rate limit exceeded on public products fetch');
        }

        const data = await res.json();
        if (res.ok) setProducts(data.data || []);
      } catch (error) {
        console.error("Error fetching public products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveProfile();
    fetchMyApplications();
    fetchPublicProducts();
  }, [navigate]);

  const handleApply = async (productId) => {
    if (!user || user.role !== 'buyer') {
      navigate('/login');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include', // 🔥 Secure session validation
        body: JSON.stringify({ product_id: productId })
      });

      // 🔥 Rate Limiter Handling
      if (res.status === 429) {
        alert("Too many requests. Please wait 15 minutes before applying again to prevent spam.");
        return;
      }

      const result = await res.json();
      if (res.ok) {
        setApplicationByProduct(prev => ({
          ...prev,
          [String(productId)]: {
            ...(result.application || {}),
            product_id: productId,
            application_status: result.application?.status || 'approved',
          }
        }));
        alert("Order is ready. Submit your order details from My Orders.");
      } else {
        alert(result.message || "Failed to apply");
      }
    } catch (error) {
      alert("Error applying for product. Please try again.");
    }
  };

  const uniqueCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const uniquePlatforms = ['All', ...new Set(products.map(p => p.platform).filter(Boolean))];
  const uniqueCountries = ['All', ...new Set(products.map(p => p.country).filter(Boolean))];

  const isDropdownFiltering = categoryFilter !== 'All' || platformFilter !== 'All' || countryFilter !== 'All';
  const areAllDropdownsSelected = categoryFilter !== 'All' && platformFilter !== 'All' && countryFilter !== 'All';
  const isFiltering = searchQuery.trim() !== '' || isDropdownFiltering;

  const filteredProducts = products.filter(p => {
    const matchSearch = (p.product_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    let matchDropdowns = true;
    if (isDropdownFiltering) {
       if (!areAllDropdownsSelected) matchDropdowns = false; 
       else matchDropdowns = (p.category === categoryFilter) && (p.platform === platformFilter) && (p.country === countryFilter);
    }
    return matchSearch && matchDropdowns;
  });

  const isVerified = user && user.verification_status === 'approved';

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans text-gray-900 flex flex-col">
      <Navbar />

      {/* 🔍 SEARCH & FILTER BAR */}
      {!isAccountDisabled && isVerified && (
        <div className="bg-white border-b border-gray-200 sticky top-14 z-30 px-4 py-4 shadow-sm">
           <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-4 items-center">
              <div className="flex gap-2 w-full md:w-auto flex-1">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search products, brands and more..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#10b981] focus:bg-white focus:ring-1 focus:ring-emerald-500 text-gray-800 rounded-lg py-2.5 pl-11 pr-4 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar items-center pb-1 md:pb-0">
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none cursor-pointer shrink-0 transition-colors focus:border-emerald-500">
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
                </select>
                
                <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none cursor-pointer shrink-0 transition-colors focus:border-emerald-500">
                  {uniquePlatforms.map(plat => <option key={plat} value={plat}>{plat === 'All' ? 'All Platforms' : plat}</option>)}
                </select>
                
                <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none cursor-pointer shrink-0 transition-colors focus:border-emerald-500">
                  {uniqueCountries.map(country => <option key={country} value={country}>{country === 'All' ? 'All Countries' : country}</option>)}
                </select>
              </div>
           </div>
        </div>
      )}

      {/* 🛒 MAIN PRODUCTS AREA */}
      <main className="max-w-[1200px] mx-auto px-4 py-10 flex-1 w-full">
        
        {isAccountDisabled ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up bg-white rounded-2xl border border-red-100 shadow-sm p-8">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert size={36} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Account Restricted</h2>
            <p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
              Your account has been disabled due to a violation of our policies. You can no longer view or request products.
            </p>
            <button className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md">Contact Support</button>
          </div>
        ) : !isVerified ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
              <Lock size={36} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Products are Locked</h2>
            
            {user?.verification_status === 'pending' ? (
              <>
                <p className="text-yellow-700 mb-8 max-w-md text-sm leading-relaxed bg-yellow-50 p-4 rounded-xl border border-yellow-200">Your verification details are currently under review by the admin.</p>
                <button disabled className="bg-gray-200 text-gray-500 px-8 py-3 rounded-full font-bold cursor-not-allowed">Verification Pending...</button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
                  {user?.role === 'seller' ? 'Please complete your seller verification to list products and process wallet deposits.' : 'Please complete your verification to unlock products and start earning 100% cashback.'}
                </p>
                <Link to="/verification" className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-3 rounded-full font-bold transition-all shadow-md">Verify Now</Link>
              </>
            )}
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                {isFiltering ? "Search Results" : "All Products"}
              </h2>
              {isFiltering && (
                 <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setPlatformFilter('All'); setCountryFilter('All'); }} className="text-xs text-red-500 hover:text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">Clear Filters ✕</button>
              )}
            </div>
            
            {loading ? (
                <div className="text-center py-10 font-bold text-gray-400 animate-pulse">Loading Products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Search size={40} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {isDropdownFiltering && !areAllDropdownsSelected ? "Please select all 3 filters" : "No products found"}
                </h3>
                <p className="text-gray-500 text-sm">
                   {isDropdownFiltering && !areAllDropdownsSelected ? "Category, Platform, and Country must be selected together." : "Try adjusting your search keywords."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      user={user}
                      application={applicationByProduct[String(product.id)]}
                      onApply={handleApply}
                      navigate={navigate}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

// 🌿 CLEAN PRODUCT CARD
function ProductCard({ product, user, application, onApply, navigate }) {
  const targetQty = parseInt(product.required_orders) || 0;
  const appliedQty = parseInt(product.application_count) || 0;
  const availableQty = Math.max(0, targetQty - appliedQty);
  const isSoldOut = (targetQty > 0 && availableQty === 0) || product.status === 'stopped';
  const applicationStatus = application?.application_status || application?.status;
  const hasExistingApplication = Boolean(applicationStatus);
  const canSubmitOrder = ['approved', 'pending'].includes(applicationStatus);
  const applicationId = application?.application_id || application?.id;
  const priceDisplay = formatProductMoney(product.price, product.country);
  const rewardDisplay = formatProductMoney(product.reward, product.country);

  return (
    <div className={`bg-white rounded-lg overflow-hidden border ${isSoldOut ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1'} transition-all duration-300 flex flex-col h-full group`}>
      <div className="h-[180px] bg-white relative p-4 flex items-center justify-center overflow-hidden cursor-pointer border-b border-gray-100">
        <div className="absolute top-3 left-3 flex gap-1 z-10">
          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-gray-200 uppercase tracking-wider">{product.country}</span>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-emerald-100 uppercase tracking-wider">{product.category || 'General'}</span>
        </div>
        <div className="absolute top-3 right-3 z-10">
          {isSoldOut ? (
             <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-widest uppercase">Sold Out</span>
          ) : (
             <span className="bg-emerald-50 text-[#10b981] border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wider">{availableQty} Tasks Left</span>
          )}
        </div>
        {product.image_url ? (
          <img src={product.image_url} alt="Product" className={`w-full h-full object-contain transition-transform duration-500 ${isSoldOut ? 'grayscale opacity-50' : 'group-hover:scale-105'}`} />
        ) : (
          <span className="text-gray-400 font-bold text-xs">No Image</span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className={`text-sm font-semibold line-clamp-2 leading-snug mb-3 flex-1 transition-colors ${isSoldOut ? 'text-gray-400' : 'text-gray-800 group-hover:text-emerald-600 cursor-pointer'}`} title={product.product_name}>
          {product.product_name || 'Premium product'}
        </h3>
        <div className="flex justify-between items-end mb-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Price ({priceDisplay.code})</p>
            <p className={`text-xl font-black ${isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>{priceDisplay.formatted}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-emerald-600 font-bold uppercase mb-0.5 flex items-center gap-1 justify-end"><Sparkles size={10}/> Reward</p>
             <span className={`text-sm font-black px-2 py-1 rounded-md ${isSoldOut ? 'text-gray-400 bg-gray-100' : 'text-[#10b981] bg-emerald-50 border border-emerald-100'}`}>
              +{rewardDisplay.formatted}
            </span>
          </div>
        </div>
        
        {/* 🔥 DYNAMIC BUTTON LOGIC: Role অনুযায়ী বাটন পরিবর্তন হবে */}
        {user?.role === 'seller' ? (
           <button onClick={() => navigate('/dashboard?tab=overview')} className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-1 shadow-sm">
             <Eye size={16} /> View Details
           </button>
        ) : hasExistingApplication && canSubmitOrder ? (
           <div className="grid grid-cols-2 gap-2">
             <button onClick={() => navigate(`/dashboard?tab=active${applicationId ? `&appId=${applicationId}` : ''}`)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg transition-colors text-xs shadow-sm flex items-center justify-center gap-1">
               <Eye size={14} /> View Details
             </button>
             <button onClick={() => navigate(`/dashboard?tab=active${applicationId ? `&appId=${applicationId}&action=order` : ''}`)} className="bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors text-xs shadow-sm flex items-center justify-center gap-1">
               <ShoppingBag size={14} /> Submit Order
             </button>
           </div>
        ) : hasExistingApplication ? (
           <button onClick={() => navigate(`/dashboard?tab=active${applicationId ? `&appId=${applicationId}` : ''}`)} className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors text-sm shadow-sm">
             View My Order
           </button>
        ) : isSoldOut ? (
           <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-2.5 rounded-lg cursor-not-allowed text-sm uppercase tracking-wider">
             Closed
           </button>
        ) : (
           <button onClick={() => onApply(product.id)} className="w-full bg-white border-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white font-bold py-2 rounded-lg transition-colors text-sm shadow-sm">
             Order Now
           </button>
        )}
      </div>
    </div>
  );
}
