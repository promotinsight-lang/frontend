import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, ChevronDown, ChevronUp, ShieldAlert, LayoutDashboard, TrendingUp, ShieldCheck, Zap, CheckCircle, Wallet, ArrowRight, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n/LanguageContext';


export default function HomePage() {
  const { t } = useLanguage();
  const [user] = useState(null);
  const [isAccountDisabled] = useState(false);

  // Landing Page States
  const [workTab, setWorkTab] = useState('buyer'); 
  const [openFaq, setOpenFaq] = useState(0);
  
  // ⚡ Live Feed States
  const [liveFeed] = useState([]);
  const [feedLoading] = useState(true);
  const [publicStats] = useState({ sellers: 435, buyers: 4560 });



  const faqs = useMemo(
    () => [
      { q: t('faq1_q'), a: t('faq1_a') },
      { q: t('faq2_q'), a: t('faq2_a') },
      { q: t('faq3_q'), a: t('faq3_a') },
    ],
    [t]
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
          {user?.role === 'seller' && (
            <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2 rounded-full font-black text-xs md:text-sm tracking-wide mb-6 shadow-lg shadow-emerald-500/30">
               <ShieldCheck size={18} /> {t('seller_badge')}
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

      {/* LIVE ACTIVITY FEED */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
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

          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto mt-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-gray-900">{publicStats.sellers.toLocaleString()}+</p>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mt-1">Sellers</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-gray-900">{publicStats.buyers.toLocaleString()}+</p>
              <p className="text-xs font-black text-[#0066ff] uppercase tracking-wider mt-1">Buyers</p>
            </div>
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
