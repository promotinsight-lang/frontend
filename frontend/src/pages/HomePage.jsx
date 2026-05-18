import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Briefcase, Star, ChevronDown, ChevronUp, ShieldAlert, LayoutDashboard,
  TrendingUp, ShieldCheck, Zap, Globe, CheckCircle, Wallet, FileText, ArrowRight // 🔥 IMPORTED NEW ICONS
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  // Landing Page States
  const [workTab, setWorkTab] = useState('buyer'); // 'buyer' or 'seller'
  const [openFaq, setOpenFaq] = useState(0);
  
  // ⚡ Live Feed States
  const [liveFeed, setLiveFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // 📝 Blog States (NEW)
  const [latestBlogs, setLatestBlogs] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.is_active === false) setIsAccountDisabled(true);
    }

    const fetchLiveProfile = async () => {
      const token = localStorage.getItem('token');
      try {
         const res = await fetch('http://localhost:5000/api/users/profile', {
           headers: token ? { 'Authorization': `Bearer ${token}` } : {},
           credentials: 'include' // 🔒 Secure session validation
         });

         if (res.status === 429) {
           console.warn('Rate limit exceeded on profile fetch');
           return;
         }

         if(res.ok) {
           const data = await res.json();
           if(data.success) {
              if(data.user.is_active === false) setIsAccountDisabled(true);
              const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
              const updatedUser = { ...lsUser, ...data.user };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
           }
         }
      } catch (err) {
         console.error("Silent auth check failed", err);
      }
    };

    if (storedUser) {
      fetchLiveProfile();
    }

    // ⚡ Fetch Live Feed Data
    const fetchLiveFeed = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/live-feed');
        const data = await res.json();
        if (res.ok && data.success) {
          setLiveFeed(data.data);
        }
      } catch (err) {
        console.error("Live feed fetch failed", err);
      } finally {
        setFeedLoading(false);
      }
    };

    // 📝 NEW: Fetch Latest Public Blogs
    const fetchLatestBlogs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/blogs/public');
        const data = await res.json();
        if (res.ok && data.success) {
          // Keep only the latest 3 blogs for the homepage
          setLatestBlogs(data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch blogs", err);
      }
    };

    fetchLiveFeed();
    fetchLatestBlogs();
    
    // Refresh live feed every 30 seconds to keep it dynamic
    const feedInterval = setInterval(fetchLiveFeed, 30000);
    return () => clearInterval(feedInterval);

  }, []);

  const faqs = [
    { q: "How do I get cashback as a buyer?", a: "Simply apply for a product, purchase it on the designated platform (like Amazon or Walmart), submit your order number, and once verified, your cashback will be added to your secure wallet." },
    { q: "Is it safe for sellers to list products?", a: "Absolutely. We require a deposit upfront which is held securely by our system. Funds are only released to buyers when they successfully complete your requested task, ensuring zero fraud." },
    { q: "How do I withdraw my earnings?", a: "You can withdraw your wallet balance at any time using PayPal, Bank Transfer, Crypto (USDT), or local methods like Cash App etc... Processing typically takes 24-48 hours." },
    { q: "What happens if a buyer leaves a bad review?", a: "Sellers have the right to dispute an order if the buyer does not follow instructions. Our admin team manually reviews all disputes to ensure fair resolution." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* ALERT BANNER FOR DISABLED ACCOUNTS */}
      {isAccountDisabled && (
        <div className="bg-red-50 border-b border-red-200 p-3 text-center">
           <p className="text-red-700 text-sm font-bold flex items-center justify-center gap-2">
             <ShieldAlert size={18} /> Your account has been disabled. Please contact support.
           </p>
        </div>
      )}

      {/* 1. HERO SECTION (Mercado Libre Inspired: Vibrant Blue & Yellow accents) */}
      <section className="bg-[#0066ff] pt-12 pb-24 px-4 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Globe size={400} />
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/20">
              <Star size={14} className="text-yellow-300 fill-yellow-300" />
              #1 Global Review & Cashback Ecosystem
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              Boost Your Sales or <span className="text-yellow-300">Earn Cash</span> Instantly.
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl leading-relaxed">
              MarketInsight connects premium sellers with verified buyers across Amazon, Walmart, and beyond. Get 100% cashback on amazing products or rank your store faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-8 py-3.5 rounded-xl font-black shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={20} />
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-8 py-3.5 rounded-xl font-black shadow-lg transition-transform hover:-translate-y-1"
                  >
                    Join for Free
                  </button>
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3.5 rounded-xl font-bold backdrop-blur-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Search size={20} />
                    Browse Products
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="bg-white p-6 rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-gray-100">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                   <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                 </div>
                 <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                   </span>
                   Live Feed
                 </span>
               </div>

               {/* ⚡ LIVE FEED SECTION */}
               <div className="space-y-4">
                 {feedLoading ? (
                   // Skeletons while loading
                   [1, 2, 3].map((i) => (
                     <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 animate-pulse">
                       <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                       <div className="flex-1">
                         <div className="h-2 w-24 bg-gray-200 rounded mb-2"></div>
                         <div className="h-2 w-16 bg-gray-200 rounded"></div>
                       </div>
                     </div>
                   ))
                 ) : liveFeed.length > 0 ? (
                   // Render Real Masked Data
                   liveFeed.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 transition-all hover:bg-gray-100 hover:shadow-sm">
                       <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold shrink-0 ${item.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                         {item.type === 'earning' ? <Zap size={18} /> : <Wallet size={18} />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-gray-800 truncate" title="Masked Email">{item.email}</p>
                         <p className="text-[10px] text-gray-500 capitalize">{item.type === 'earning' ? 'Task Completed' : 'Withdrawal Paid'}</p>
                       </div>
                       <div className="text-right shrink-0">
                         <span className={`text-xs font-bold px-2 py-1 rounded-md border ${item.type === 'earning' ? 'text-green-700 bg-green-100 border-green-200' : 'text-red-700 bg-red-100 border-red-200'}`}>
                           {item.type === 'earning' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                         </span>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center text-xs text-gray-400 py-6 font-semibold border border-dashed rounded-xl">
                     Awaiting recent activities...
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (Tabbed Interface) */}
      <section className="py-20 px-4 max-w-7xl mx-auto -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-800">How MarketInsight Works</h2>
            <p className="text-gray-500 mt-2">Select your role to see the workflow</p>
          </div>

          <div className="flex justify-center mb-10">
            <div className="bg-gray-100 p-1.5 rounded-xl flex inline-flex">
              <button
                onClick={() => setWorkTab('buyer')}
                className={`px-8 py-2.5 rounded-lg font-bold transition-all ${workTab === 'buyer' ? 'bg-white text-[#0066ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                For Buyers
              </button>
              <button
                onClick={() => setWorkTab('seller')}
                className={`px-8 py-2.5 rounded-lg font-bold transition-all ${workTab === 'seller' ? 'bg-white text-[#0066ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                For Sellers
              </button>
            </div>
          </div>

          {workTab === 'buyer' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 text-[#0066ff] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Search size={28} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">1. Find & Apply</h3>
                <p className="text-gray-500 text-sm">Browse the marketplace and apply for products you love. Wait for seller approval.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 text-[#0066ff] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Briefcase size={28} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">2. Buy & Review</h3>
                <p className="text-gray-500 text-sm">Purchase the item on Amazon/Walmart. Submit the order ID, then leave an honest review.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 text-[#0066ff] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <TrendingUp size={28} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">3. Get Paid</h3>
                <p className="text-gray-500 text-sm">Once verified, 100% cashback + reward is instantly added to your system wallet.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
                  <Briefcase size={28} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">1. Deposit & List</h3>
                <p className="text-gray-500 text-sm">Fund your wallet securely. List your product with specific keywords and instructions.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">2. Verify Buyers</h3>
                <p className="text-gray-500 text-sm">Approve trustworthy buyers. Monitor their order and review submissions in real-time.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
                  <TrendingUp size={28} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">3. Boost Ranking</h3>
                <p className="text-gray-500 text-sm">Watch your product climb the algorithm ranks safely through verified organic sales.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. TRUST & SECURITY */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-800 mb-6">Enterprise-Grade Security & Fair Play</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 shrink-0" size={20} />
                <p className="text-gray-700"><strong className="text-gray-900">Wallet Protection:</strong> Funds are locked securely in escrow during the task cycle.</p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 shrink-0" size={20} />
                <p className="text-gray-700"><strong className="text-gray-900">Strict URL Validation:</strong> We enforce profile link verification to eliminate fake screenshot fraud.</p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 shrink-0" size={20} />
                <p className="text-gray-700"><strong className="text-gray-900">Admin Mediation:</strong> An impartial admin team manually resolves any order disputes between buyers and sellers.</p>
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
               <ShieldCheck size={40} className="text-[#0066ff] mb-3" />
               <h4 className="font-bold text-gray-800">Fraud Prevention</h4>
               <p className="text-xs text-gray-500 mt-1">Multi-layer verification system.</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transform translate-y-6">
               <Globe size={40} className="text-[#0066ff] mb-3" />
               <h4 className="font-bold text-gray-800">Multi-Platform</h4>
               <p className="text-xs text-gray-500 mt-1">Amazon, Walmart, Etsy & more.</p>
             </div>
          </div>
        </div>
      </section>

      {/* 🔥 4. LATEST BLOGS SECTION (NEW) */}
      {latestBlogs.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10 border-b pb-4">
            <div>
              <h2 className="text-3xl font-black text-gray-800">Latest from our Blog</h2>
              <p className="text-gray-500 mt-2">Tips, platform updates, and success stories.</p>
            </div>
            <Link to="/blogs" className="hidden md:flex items-center gap-1 text-[#0066ff] font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
              View All Articles <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestBlogs.map(blog => (
              <div key={blog.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div className="h-48 bg-gray-100 overflow-hidden relative">
                  {blog.image_url ? (
                    <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText size={48} />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between border-b border-gray-50 pb-2">
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    <span>By {blog.author_name}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-[#0066ff] transition-colors leading-snug">
                    {blog.title}
                  </h3>
                  
                  <div className="mt-auto pt-4">
                    <Link to={`/blog/${blog.slug}`} className="text-[#0066ff] text-sm font-bold flex items-center gap-1 w-max group-hover:gap-2 transition-all">
                      Read Article <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
             <Link to="/blogs" className="inline-flex items-center gap-1 text-[#0066ff] bg-blue-50 px-6 py-3 rounded-full font-bold hover:bg-blue-100">
               View All Articles <ArrowRight size={16} />
             </Link>
          </div>
        </section>
      )}

      {/* 5. FAQ SECTION */}
      <section className="py-20 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-800">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-4 flex justify-between items-center text-left focus:outline-none"
              >
                <span className="font-bold text-gray-800">{faq.q}</span>
                {openFaq === index ? <ChevronUp size={20} className="text-[#0066ff] shrink-0" /> : <ChevronDown size={20} className="text-gray-400 shrink-0" />}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4 pt-1 text-gray-600 text-sm leading-relaxed bg-blue-50/30 border-t border-gray-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white font-black text-xl tracking-tight">MarketInsight</div>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Market Insight System. All Rights Reserved.</p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}