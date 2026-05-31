import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Briefcase, Star, ChevronDown, ChevronUp, ShieldAlert, LayoutDashboard,
  TrendingUp, ShieldCheck, Zap, Globe, CheckCircle, Wallet, FileText, ArrowRight, Calculator, RefreshCw, Info, ShoppingCart, Gift 
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  // Landing Page States
  const [workTab, setWorkTab] = useState('buyer'); 
  const [openFaq, setOpenFaq] = useState(0);
  
  // ⚡ Live Feed States
  const [liveFeed, setLiveFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // 🔥 DYNAMIC DROPDOWN STATES
  const [allConfigs, setAllConfigs] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);

  const [calcData, setCalcData] = useState({
    country: '',
    platform: '',
    price: 25.00,
    reward: 5.00,
    qty: 10
  });
  
  const [activeConfig, setActiveConfig] = useState(null); 
  const [isCalcLoading, setIsCalcLoading] = useState(false);

  const currencySymbols = {
    'USA': '$', 'UK': '£', 'Canada': 'C$', 'Mexico': 'MX$',
    'Germany': '€', 'France': '€', 'Italy': '€', 'Spain': '€',
    'Brazil': 'R$', 'Bangladesh': '৳', 'India': '₹'
  };
  
  const typedCountryKey = Object.keys(currencySymbols).find(
    key => key.toLowerCase() === calcData.country.trim().toLowerCase()
  );
  const calcCurrency = typedCountryKey ? currencySymbols[typedCountryKey] : '$';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.is_active === false) setIsAccountDisabled(true);
    }

    setTimeout(() => {
      setLiveFeed([
        { id: "lf-1", text: "A buyer from USA just received $15 cashback!", time: "2 mins ago" },
        { id: "lf-ref1", text: "🔥 User JAM*** invited a friend and earned $10 bonus!", time: "4 mins ago" },
        { id: "lf-2", text: "New Amazon product listed with 100% refund.", time: "5 mins ago" },
        { id: "lf-ref2", text: "🎉 A buyer just got paid a $10 referral reward!", time: "9 mins ago" },
        { id: "lf-3", text: "Seller 'TechStore' deposited $500.", time: "12 mins ago" }
      ]);
      setFeedLoading(false);
    }, 1500);

  }, []);

  useEffect(() => {
    const initConfigs = async () => {
      setIsCalcLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`https://backend-6aiq.onrender.com/api/config/fees/all`, { headers });
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setAllConfigs(data.data);
          
          const uniqueCountries = [...new Set(data.data.map(item => item.country))];
          setAvailableCountries(uniqueCountries);
          
          if (uniqueCountries.length > 0) {
            const firstCountry = uniqueCountries[0];
            const platformsForCountry = data.data.filter(c => c.country === firstCountry).map(c => c.platform);
            setAvailablePlatforms(platformsForCountry);
            
            const firstPlatform = platformsForCountry[0] || '';
            setCalcData(prev => ({ ...prev, country: firstCountry, platform: firstPlatform }));
          }
        }
      } catch (error) {
        console.error("Failed to load dynamic configs", error);
      } finally {
        setIsCalcLoading(false);
      }
    };
    initConfigs();
  }, []);

  useEffect(() => {
    const fetchCalcTarrifs = async () => {
      if (!calcData.country || !calcData.platform) return;
      
      setIsCalcLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`https://backend-6aiq.onrender.com/api/config/fees?country=${calcData.country}&platform=${calcData.platform}`, { headers });
        const data = await res.json();
        
        if (data.success && data.data) {
          
          // 🔥 Parse JSON Tiers for dynamic platform charge logic
          let parsedTiers = [];
          if (Array.isArray(data.data.platform_charge)) {
            parsedTiers = data.data.platform_charge;
          } else if (typeof data.data.platform_charge === 'string') {
            try { parsedTiers = JSON.parse(data.data.platform_charge); } catch(e) {}
          }
          data.data.parsed_platform_charge = parsedTiers;
          
          setActiveConfig(data.data);
          
          if (parseFloat(data.data.buyer_reward) > 0) {
              setCalcData(prev => ({ ...prev, reward: parseFloat(data.data.buyer_reward) }));
          }
        } else {
          setActiveConfig(null);
        }
      } catch (error) {
        setActiveConfig(null);
      } finally {
        setIsCalcLoading(false);
      }
    };
    fetchCalcTarrifs();
  }, [calcData.country, calcData.platform]);

  const priceNum = parseFloat(calcData.price || 0);
  const rewardNum = parseFloat(calcData.reward || 0);
  const unitCost = priceNum + rewardNum;
  
  // 🔥 DYNAMIC TIER LOGIC FOR PLATFORM FEE
  let platformFee = 0;
  if (activeConfig && activeConfig.parsed_platform_charge && activeConfig.parsed_platform_charge.length > 0) {
    // Find the correct tier based on product price
    const matchedTier = activeConfig.parsed_platform_charge.find(
      t => priceNum >= Number(t.min) && priceNum <= Number(t.max)
    );
    platformFee = matchedTier ? Number(matchedTier.fee) : 0; 
  } else if (activeConfig && !isNaN(activeConfig.platform_charge)) {
    // Fallback if it's still using the old percentage format
    platformFee = priceNum * (parseFloat(activeConfig.platform_charge) / 100);
  } else {
    platformFee = priceNum * 0.10; // Default 10% fallback
  }
  
  const refundFeeRate = activeConfig ? (parseFloat(activeConfig.buyer_refund_fee) / 100) : 0;
  const refundFeeAmount = unitCost * refundFeeRate;
  
  const totalPerUnit = unitCost + platformFee + refundFeeAmount;
  const grandTotalDeposit = totalPerUnit * parseInt(calcData.qty || 1);

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const platforms = allConfigs.filter(c => c.country === selectedCountry).map(c => c.platform);
    
    setAvailablePlatforms(platforms);
    setCalcData({ ...calcData, country: selectedCountry, platform: platforms[0] || '' });
  };

  const handlePlatformChange = (e) => {
    setCalcData({ ...calcData, platform: e.target.value });
  };

  const handleCalcChange = (e) => {
    setCalcData({ ...calcData, [e.target.name]: e.target.value });
  };

  const faqs = [
    { q: "How does the 100% cashback work?", a: "Once you purchase the assigned product and leave an honest Feedback as instructed, you submit your order and Feedback screenshots. After the seller verifies it, the product price + reward is credited to your wallet." },
    { q: "Is this platform safe for sellers?", a: "Absolutely. We secure your deposit in escrow. Funds are only released to the buyer after you approve their verified Feedback. If a buyer fails, your funds are refunded." },
    { q: "How can I withdraw my earnings?", a: "You can withdraw your wallet balance at any time using PayPal, Payoneer, Binance Pay, or local bank transfers depending on your country." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-200">
      <Navbar />

      {isAccountDisabled && (
        <div className="bg-red-600 text-white text-center py-3 font-bold flex justify-center items-center gap-2 animate-pulse shadow-md">
          <ShieldAlert size={20} /> Your account is currently disabled. Please contact support.
        </div>
      )}

      {/* 🔥 ROLE-BASED DYNAMIC HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#0066ff] to-indigo-900 pt-24 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {/* 1. Dynamic Promo Badge */}
          {user?.role === 'seller' ? (
            <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-full font-black text-xs md:text-sm tracking-wide mb-6 shadow-lg shadow-emerald-500/30">
               <ShieldCheck size={18} /> 100% Secure Escrow & Real Verified Buyers!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-5 py-2 rounded-full font-black text-xs md:text-sm tracking-wide mb-6 shadow-lg shadow-yellow-500/30 animate-bounce">
               <Gift size={18} className="text-yellow-900" /> Invite Friends & Earn $10 Cash Bonus!
            </div>
          )}
          
          <div className="block mb-4">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 text-blue-100 font-bold text-sm tracking-widest uppercase border border-white/20 backdrop-blur-sm">
              #1 Global E-Commerce Product Testing Platform
            </span>
          </div>

          {/* 2. Dynamic Heading & Paragraph */}
          {user?.role === 'seller' ? (
            <>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
                Dominate Search Rankings.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                  Grow Your Brand.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium opacity-90">
                Launch campaigns with zero risk. Our strict KYC-verified buyer network ensures 100% authentic, high-quality reviews that skyrocket your organic sales.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
                Boost Your Sales.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                  Get Rewarded.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium opacity-90">
                Sellers rank their products higher with authentic feedback. Buyers get 100% cashback plus extra rewards for sharing their honest experience.
              </p>
            </>
          )}
          
          {/* 3. Dynamic CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {user?.role === 'seller' ? (
              <>
                <Link to="/dashboard?tab=add" className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-emerald-400 transition-all shadow-xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2 hover:-translate-y-1">
                  <Briefcase size={20}/> Launch Campaign
                </Link>
                <Link to="/dashboard?tab=overview" className="bg-white/10 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                  <LayoutDashboard size={20}/> Seller Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to={user ? "/dashboard" : "/register"} className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-black text-lg hover:bg-yellow-300 transition-all shadow-xl hover:shadow-yellow-400/50 flex items-center justify-center gap-2 hover:-translate-y-1">
                  Start Earning Now <ArrowRight size={20}/>
                </Link>
                <Link to="/marketplace" className="bg-white/10 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                  <ShoppingCart size={20}/> Browse Products
                </Link>
              </>
            )}
          </div>

        </div>
      </section>

      {/* SMART CALCULATOR (For Sellers and Guests) */}
      {user?.role !== 'buyer' && (
      <section className="relative z-20 -mt-20 max-w-5xl mx-auto px-4 w-full mb-16">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
          
          <div className="w-full md:w-3/5 p-8 lg:p-10 bg-white relative">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="text-[#0066ff]" size={28} />
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Seller Cost Calculator</h2>
            </div>
            <p className="text-sm text-gray-500 mb-8 font-medium">Estimate your campaign budget in real-time. Tariffs are dynamically fetched based on the target country and platform.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Country</label>
                <select name="country" value={calcData.country} onChange={handleCountryChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer">
                  {availableCountries.length > 0 ? (
                    availableCountries.map(c => <option key={c} value={c}>{c}</option>)
                  ) : (
                    <option value="">No Data</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Platform</label>
                <select name="platform" value={calcData.platform} onChange={handlePlatformChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                  {availablePlatforms.length > 0 ? (
                    availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)
                  ) : (
                    <option value="">No Data</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{calcCurrency}</span>
                  <input type="number" name="price" value={calcData.price} onChange={handleCalcChange} className="w-full pl-8 p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Buyer Reward</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-500">{calcCurrency}</span>
                  <input 
                    type="number" 
                    name="reward" 
                    value={calcData.reward} 
                    onChange={handleCalcChange}
                    readOnly={activeConfig && parseFloat(activeConfig.buyer_reward) > 0} 
                    className={`w-full pl-8 p-3.5 border rounded-xl font-bold outline-none transition-all ${activeConfig && parseFloat(activeConfig.buyer_reward) > 0 ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-2 focus:ring-emerald-500'}`} 
                  />
                  {activeConfig && parseFloat(activeConfig.buyer_reward) > 0 && (
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 uppercase bg-gray-200 px-1 rounded">Fixed</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Quantity (Orders)</label>
              <input type="number" name="qty" value={calcData.qty} onChange={handleCalcChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className="w-full md:w-2/5 bg-gradient-to-b from-[#f8f9fa] to-gray-100 p-8 lg:p-10 border-l border-gray-200 relative">
            {isCalcLoading && (
               <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-r-3xl">
                  <RefreshCw className="text-[#0066ff] animate-spin mb-2" size={32} />
                  <p className="text-sm font-bold text-[#0066ff]">Fetching live tariffs...</p>
               </div>
            )}
            
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-200 pb-2">Financial Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Unit Cost</span>
                <span className="font-bold text-gray-800">{calcCurrency}{unitCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium flex items-center gap-1">
                  Platform Fee 
                  {activeConfig?.parsed_platform_charge?.length > 0 ? (
                     <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Fixed Tier</span>
                  ) : (
                     <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{activeConfig ? activeConfig.platform_charge : '10'}% of Price</span>
                  )}
                </span>
                <span className="font-bold text-red-500">+{calcCurrency}{platformFee.toFixed(2)}</span>
              </div>
              
              {activeConfig && parseFloat(activeConfig.buyer_refund_fee) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium flex items-center gap-1">
                    Refund Fee <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">{parseFloat(activeConfig.buyer_refund_fee).toFixed(1)}%</span>
                  </span>
                  <span className="font-bold text-red-500">+{calcCurrency}{refundFeeAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                <span className="text-gray-600 font-medium">Qty Multiplier</span>
                <span className="font-bold text-gray-800">x {calcData.qty}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 mb-6">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Deposit Required</p>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">{calcCurrency}{grandTotalDeposit.toFixed(2)}</h2>
            </div>
            
            {activeConfig && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-4">
                 <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Info size={12}/> Active Tariffs ({calcData.country} - {calcData.platform})
                 </h4>
                 <div className="grid grid-cols-2 gap-y-2 text-xs font-medium text-blue-900">
                    <p>Platform: <b className="text-blue-700">{activeConfig.parsed_platform_charge?.length > 0 ? 'Tiered Fee' : `${activeConfig.platform_charge}%`}</b></p>
                    <p>Reward: <b className="text-blue-700">{parseFloat(activeConfig.buyer_reward) > 0 ? `${calcCurrency}${activeConfig.buyer_reward}` : 'Custom'}</b></p>
                    <p>Refund: <b className="text-red-500">{activeConfig.buyer_refund_fee}%</b></p>
                    <p>Deposit: <b className="text-blue-700">{activeConfig.seller_deposit_fee}%</b></p>
                    <p>W.Draw: <b className="text-blue-700">{activeConfig.seller_withdrawal_fee}%</b></p>
                 </div>
              </div>
            )}
            
            {!activeConfig && !isCalcLoading && (
               <p className="text-[10px] text-gray-400 mt-4 font-medium flex items-start gap-1">
                 <Info size={12} className="shrink-0 mt-0.5" /> This is an estimate based on system default values.
               </p>
            )}
          </div>
        </div>
      </section>
      )}

      {/* BUYER EXCLUSIVE BANNER (Shows only to Buyers instead of Calculator) */}
      {user?.role === 'buyer' && (
      <section className="relative z-20 -mt-20 max-w-5xl mx-auto px-4 w-full mb-16">
        <div className="bg-gradient-to-r from-[#10b981] to-emerald-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row items-center animate-fade-in-up border border-emerald-500">
          
          <div className="w-full md:w-3/5 p-8 lg:p-12 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-4 border border-white/30 backdrop-blur-sm">
              <Star size={16} className="text-yellow-300 fill-current"/>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-50">Buyer Exclusive</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
              Get 100% Cashback + <span className="text-yellow-300">Extra Rewards</span>
            </h2>
            <p className="text-emerald-100 text-sm md:text-base font-medium mb-8 max-w-md">
              You are ready to start earning! Browse our marketplace, claim a product, leave an honest Feedback, and get your money back straight to your wallet.
            </p>
            <div className="flex gap-4">
              <Link to="/marketplace" className="bg-white text-emerald-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2">
                <ShoppingCart size={18}/> Claim Products Now
              </Link>
            </div>
          </div>

          <div className="w-full md:w-2/5 bg-white/10 p-8 lg:p-10 flex flex-col justify-center items-center gap-4 backdrop-blur-md border-l border-white/10 h-full">
             
             <div className="bg-white p-5 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform w-full max-w-sm">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Wallet size={24}/>
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase mb-1">Potential Monthly Earnings</p>
                <h3 className="text-3xl font-black text-gray-900">$350+</h3>
             </div>

             <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-2xl shadow-xl border border-yellow-200 text-center transform hover:scale-105 transition-transform w-full max-w-sm">
                <div className="w-12 h-12 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                   <Gift size={24}/>
                </div>
                <p className="text-yellow-800 font-bold text-xs uppercase mb-1">Refer & Earn</p>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Get $10 Bonus</h3>
                <Link to="/dashboard?tab=referral" className="inline-block bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm mt-1">
                   Get Your Link
                </Link>
             </div>

          </div>

        </div>
      </section>
      )}

      {/* LIVE ACTIVITY FEED */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-2 text-[#0066ff] font-black uppercase tracking-widest text-sm shrink-0">
             <Zap className="fill-current animate-pulse" size={20}/> Live Activity
          </div>
          <div className="flex-1 w-full overflow-hidden bg-blue-50 rounded-xl p-3 border border-blue-100">
            {feedLoading ? (
               <p className="text-sm text-gray-500 font-medium animate-pulse">Loading live events...</p>
            ) : (
               <div className="flex gap-8 animate-marquee whitespace-nowrap">
                 {liveFeed.map((feed, index) => (
                   <span key={`feed-${index}`} className="text-sm font-bold text-gray-700 flex items-center gap-2">
                     <CheckCircle size={14} className="text-green-500"/> {feed.text} <span className="text-xs font-normal text-gray-400">({feed.time})</span>
                   </span>
                 ))}
                 {liveFeed.map((feed, index) => (
                   <span key={`feed-dup-${index}`} className="text-sm font-bold text-gray-700 flex items-center gap-2">
                     <CheckCircle size={14} className="text-green-500"/> {feed.text} <span className="text-xs font-normal text-gray-400">({feed.time})</span>
                   </span>
                 ))}
               </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">How It Works</h2>
            <p className="text-gray-500 font-medium">Simple, secure, and transparent process for both parties.</p>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            <button onClick={() => setWorkTab('buyer')} className={`px-8 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${workTab === 'buyer' ? 'bg-[#0066ff] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
              I am a Buyer
            </button>
            <button onClick={() => setWorkTab('seller')} className={`px-8 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${workTab === 'seller' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
              I am a Seller
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workTab === 'buyer' ? (
              <>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-blue-100 text-[#0066ff] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><Search size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">1. Find Product</h3>
                  <p className="text-gray-500 text-sm">Browse the marketplace and apply for a product you want to test and share feedback on.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-blue-100 text-[#0066ff] rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3"><CheckCircle size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">2. Buy & Share Feedback</h3>
                  <p className="text-gray-500 text-sm">Purchase the item from Amazon/Walmart. Submit your order ID. After receiving it, leave a 5-star rating and honest feedback.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><Wallet size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">3. Get Paid</h3>
                  <p className="text-gray-500 text-sm">Once verified, 100% of the product cost plus your reward is instantly credited to your wallet.</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><LayoutDashboard size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">1. Deposit & List</h3>
                  <p className="text-gray-500 text-sm">Deposit funds securely. List your product with the required number of orders and set a buyer reward.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3"><ShieldCheck size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">2. Verify Work</h3>
                  <p className="text-gray-500 text-sm">Buyers will purchase your item. Verify their order screenshots and live feedback links directly from your dashboard.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><TrendingUp size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">3. Boost Ranking</h3>
                  <p className="text-gray-500 text-sm">Gain organic traction. Funds are released to buyers automatically upon your approval.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-800 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button 
                  className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold text-gray-800 text-left">{faq.q}</span>
                  {openFaq === index ? <ChevronUp size={20} className="text-[#0066ff] shrink-0" /> : <ChevronDown size={20} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 pt-2 text-gray-600 text-sm leading-relaxed bg-white border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-gray-800 pb-8 mb-8">
          <div>
             <div className="text-white font-black text-2xl tracking-tight mb-2">PromotInsight.</div>
             <p className="text-sm">Connecting global sellers with real buyers for authentic e-commerce growth.</p>
          </div>
          <div className="flex justify-center gap-6 text-sm font-bold">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support Center</Link>
          </div>
          <div className="flex justify-end">
             <div className="bg-gray-800 p-3 rounded-xl inline-flex gap-4">
                <Globe size={20} className="text-gray-400 hover:text-white cursor-pointer"/>
                <ShieldCheck size={20} className="text-gray-400 hover:text-white cursor-pointer"/>
             </div>
          </div>
        </div>
        <div className="text-center text-xs font-medium">
          © 2025 PromotInsight. Built by WitchBella. All Rights Reserved.
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
      `}} />
    </div>
  );
}