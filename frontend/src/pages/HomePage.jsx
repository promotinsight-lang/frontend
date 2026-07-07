import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Briefcase, Star, ChevronDown, ChevronUp, ShieldAlert, LayoutDashboard,
  TrendingUp, ShieldCheck, Zap, CheckCircle, Wallet, FileText, ArrowRight, Calculator, RefreshCw, Info, ShoppingCart, Gift 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n/LanguageContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
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

    const timer = setTimeout(() => setFeedLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (feedLoading) return;
    setLiveFeed([
      { id: 'lf-1', text: t('feed_1'), time: t('time_2mins') },
      { id: 'lf-ref1', text: t('feed_2'), time: t('time_4mins') },
      { id: 'lf-2', text: t('feed_3'), time: t('time_5mins') },
      { id: 'lf-ref2', text: t('feed_4'), time: t('time_9mins') },
      { id: 'lf-3', text: t('feed_5'), time: t('time_12mins') },
    ]);
  }, [language, feedLoading, t]);

  useEffect(() => {
    const initConfigs = async () => {
      setIsCalcLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/config/fees/all`, { headers });
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

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/config/fees?country=${calcData.country}&platform=${calcData.platform}`, { headers });
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
  const rewardDeposit = rewardNum;
  
  // 🔥 DYNAMIC TIER LOGIC FOR PLATFORM FEE
  const platformFee = (() => {
    if (activeConfig && activeConfig.parsed_platform_charge && activeConfig.parsed_platform_charge.length > 0) {
      // Find the correct tier based on product price
      const matchedTier = activeConfig.parsed_platform_charge.find(
        t => priceNum >= Number(t.min) && priceNum <= Number(t.max)
      );
      return matchedTier ? Number(matchedTier.fee) : 0;
    }
    if (activeConfig && !isNaN(activeConfig.platform_charge)) {
      // Fallback if it's still using the old percentage format
      return priceNum * (parseFloat(activeConfig.platform_charge) / 100);
    }
    return priceNum * 0.10; // Default 10% fallback
  })();
  
  const totalPerUnit = rewardDeposit + platformFee;
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

  const faqs = useMemo(
    () => [
      { q: t('faq1_q'), a: t('faq1_a') },
      { q: t('faq2_q'), a: t('faq2_a') },
      { q: t('faq3_q'), a: t('faq3_a') },
    ],
    [t, language]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-200">
      <Navbar />

      {isAccountDisabled && (
        <div className="bg-red-600 text-white text-center py-3 font-bold flex justify-center items-center gap-2 animate-pulse shadow-md">
          <ShieldAlert size={20} /> {t('account_disabled')}
        </div>
      )}

      {/* 🔥 ROLE-BASED DYNAMIC HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#0066ff] to-indigo-900 pt-24 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {/* 1. Dynamic Promo Badge */}
          {user?.role === 'seller' ? (
            <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-full font-black text-xs md:text-sm tracking-wide mb-6 shadow-lg shadow-emerald-500/30">
               <ShieldCheck size={18} /> {t('seller_badge')}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-5 py-2 rounded-full font-black text-xs md:text-sm tracking-wide mb-6 shadow-lg shadow-yellow-500/30 animate-bounce">
               <Gift size={18} className="text-yellow-900" /> {t('buyer_badge')}
            </div>
          )}
          
          <div className="block mb-4">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 text-blue-100 font-bold text-sm tracking-widest uppercase border border-white/20 backdrop-blur-sm">
              {t('hero_badge')}
            </span>
          </div>

          {/* 2. Dynamic Heading & Paragraph */}
          {user?.role === 'seller' ? (
            <>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
                {t('seller_hero_title_1')}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                  {t('seller_hero_title_2')}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium opacity-90">
                {t('seller_hero_desc')}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
                {t('buyer_hero_title_1')}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                  {t('buyer_hero_title_2')}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium opacity-90">
                {t('buyer_hero_desc')}
              </p>
            </>
          )}
          
          {/* 3. Dynamic CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {user?.role === 'seller' ? (
              <>
                <Link to="/dashboard?tab=add" className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-emerald-400 transition-all shadow-xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2 hover:-translate-y-1">
                  <Briefcase size={20}/> {t('launch_campaign')}
                </Link>
                <Link to="/dashboard?tab=overview" className="bg-white/10 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                  <LayoutDashboard size={20}/> {t('seller_dashboard')}
                </Link>
              </>
            ) : (
              <>
                <Link to={user ? "/dashboard" : "/register"} className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-black text-lg hover:bg-yellow-300 transition-all shadow-xl hover:shadow-yellow-400/50 flex items-center justify-center gap-2 hover:-translate-y-1">
                  {t('start_earning')} <ArrowRight size={20}/>
                </Link>
                <Link to="/marketplace" className="bg-white/10 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                  <ShoppingCart size={20}/> {t('browse_products')}
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
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('calc_title')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-8 font-medium">{t('calc_desc')}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('target_country')}</label>
                <select name="country" value={calcData.country} onChange={handleCountryChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer">
                  {availableCountries.length > 0 ? (
                    availableCountries.map(c => <option key={c} value={c}>{c}</option>)
                  ) : (
                    <option value="">{t('no_data')}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('platform')}</label>
                <select name="platform" value={calcData.platform} onChange={handlePlatformChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                  {availablePlatforms.length > 0 ? (
                    availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)
                  ) : (
                    <option value="">{t('no_data')}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('product_price')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{calcCurrency}</span>
                  <input type="number" name="price" value={calcData.price} onChange={handleCalcChange} className="w-full pl-8 p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('buyer_reward')}</label>
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
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 uppercase bg-gray-200 px-1 rounded">{t('fixed')}</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('target_qty')}</label>
              <input type="number" name="qty" value={calcData.qty} onChange={handleCalcChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className="w-full md:w-2/5 bg-gradient-to-b from-[#f8f9fa] to-gray-100 p-8 lg:p-10 border-l border-gray-200 relative">
            {isCalcLoading && (
               <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-r-3xl">
                  <RefreshCw className="text-[#0066ff] animate-spin mb-2" size={32} />
                  <p className="text-sm font-bold text-[#0066ff]">{t('fetching_tariffs')}</p>
               </div>
            )}
            
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-200 pb-2">{t('financial_summary')}</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">{t('unit_cost')}</span>
                <span className="font-bold text-gray-800">{calcCurrency}{rewardDeposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium flex items-center gap-1">
                  {t('platform_fee')}{' '}
                  {activeConfig?.parsed_platform_charge?.length > 0 ? (
                     <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{t('fixed_tier')}</span>
                  ) : (
                     <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{activeConfig ? activeConfig.platform_charge : '10'}{t('pct_of_price')}</span>
                  )}
                </span>
                <span className="font-bold text-red-500">+{calcCurrency}{platformFee.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                <span className="text-gray-600 font-medium">{t('qty_multiplier')}</span>
                <span className="font-bold text-gray-800">x {calcData.qty}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 mb-6">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{t('total_deposit')}</p>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">{calcCurrency}{grandTotalDeposit.toFixed(2)}</h2>
            </div>
            
            {activeConfig && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-4">
                 <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Info size={12}/> {t('active_tariffs')} ({calcData.country} - {calcData.platform})
                 </h4>
                 <div className="grid grid-cols-2 gap-y-2 text-xs font-medium text-blue-900">
                    <p>{t('platform')}: <b className="text-blue-700">{activeConfig.parsed_platform_charge?.length > 0 ? t('tiered_fee') : `${activeConfig.platform_charge}%`}</b></p>
                    <p>{t('buyer_reward')}: <b className="text-blue-700">{parseFloat(activeConfig.buyer_reward) > 0 ? `${calcCurrency}${activeConfig.buyer_reward}` : t('custom')}</b></p>
                    <p>Deposit: <b className="text-blue-700">{activeConfig.seller_deposit_fee}%</b></p>
                    <p>W.Draw: <b className="text-blue-700">{activeConfig.seller_withdrawal_fee}%</b></p>
                 </div>
              </div>
            )}
            
            {!activeConfig && !isCalcLoading && (
               <p className="text-[10px] text-gray-400 mt-4 font-medium flex items-start gap-1">
                 <Info size={12} className="shrink-0 mt-0.5" /> {t('estimate_note')}
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
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-50">{t('buyer_exclusive')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
              {t('buyer_banner_title')} <span className="text-yellow-300">{t('buyer_banner_extra')}</span>
            </h2>
            <p className="text-emerald-100 text-sm md:text-base font-medium mb-8 max-w-md">
              {t('buyer_banner_desc')}
            </p>
            <div className="flex gap-4">
              <Link to="/marketplace" className="bg-white text-emerald-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2">
                <ShoppingCart size={18}/> {t('claim_products')}
              </Link>
            </div>
          </div>

          <div className="w-full md:w-2/5 bg-white/10 p-8 lg:p-10 flex flex-col justify-center items-center gap-4 backdrop-blur-md border-l border-white/10 h-full">
             
             <div className="bg-white p-5 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform w-full max-w-sm">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Wallet size={24}/>
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase mb-1">{t('potential_earnings')}</p>
                <h3 className="text-3xl font-black text-gray-900">$350+</h3>
             </div>

             <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-2xl shadow-xl border border-yellow-200 text-center transform hover:scale-105 transition-transform w-full max-w-sm">
                <div className="w-12 h-12 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                   <Gift size={24}/>
                </div>
                <p className="text-yellow-800 font-bold text-xs uppercase mb-1">{t('refer_earn')}</p>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{t('get_10_bonus')}</h3>
                <Link to="/dashboard?tab=referral" className="inline-block bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm mt-1">
                   {t('get_your_link')}
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
             <Zap className="fill-current animate-pulse" size={20}/> {t('live_activity')}
          </div>
          <div className="flex-1 w-full overflow-hidden bg-blue-50 rounded-xl p-3 border border-blue-100">
            {feedLoading ? (
               <p className="text-sm text-gray-500 font-medium animate-pulse">{t('loading_events')}</p>
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
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">{t('how_it_works')}</h2>
            <p className="text-gray-500 font-medium">{t('how_it_works_desc')}</p>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            <button onClick={() => setWorkTab('buyer')} className={`px-8 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${workTab === 'buyer' ? 'bg-[#0066ff] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
              {t('i_am_buyer')}
            </button>
            <button onClick={() => setWorkTab('seller')} className={`px-8 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${workTab === 'seller' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
              {t('i_am_seller')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workTab === 'buyer' ? (
              <>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-blue-100 text-[#0066ff] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><Search size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">{t('buyer_step1_title')}</h3>
                  <p className="text-gray-500 text-sm">{t('buyer_step1_desc')}</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-blue-100 text-[#0066ff] rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3"><CheckCircle size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">{t('buyer_step2_title')}</h3>
                  <p className="text-gray-500 text-sm">{t('buyer_step2_desc')}</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><Wallet size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">{t('buyer_step3_title')}</h3>
                  <p className="text-gray-500 text-sm">{t('buyer_step3_desc')}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><LayoutDashboard size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">{t('seller_step1_title')}</h3>
                  <p className="text-gray-500 text-sm">{t('seller_step1_desc')}</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3"><ShieldCheck size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">{t('seller_step2_title')}</h3>
                  <p className="text-gray-500 text-sm">{t('seller_step2_desc')}</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><TrendingUp size={32} /></div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">{t('seller_step3_title')}</h3>
                  <p className="text-gray-500 text-sm">{t('seller_step3_desc')}</p>
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
            <h2 className="text-3xl font-black text-gray-800 mb-4">{t('faq_title')}</h2>
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

      <Footer />

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
      `}} />
    </div>
  );
}
