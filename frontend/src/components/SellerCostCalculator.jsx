import { useState, useEffect, useMemo } from 'react';
import { Calculator, RefreshCw, Info } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getConfiguredCampaignCategoryOptions,
  parsePlatformChargeConditions,
  parsePlatformChargeTiers,
  resolvePlatformChargeTiersForCategory,
} from '../utils/campaignCategories';

export default function SellerCostCalculator() {
  const { t } = useLanguage();

  const [allConfigs, setAllConfigs] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);

  const [calcData, setCalcData] = useState({
    country: '',
    platform: '',
    category: 'Need Review',
    price: 25.00,
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
    key => key.toLowerCase() === (calcData.country || '').trim().toLowerCase()
  );
  const calcCurrency = typedCountryKey ? currencySymbols[typedCountryKey] : '$';
  
  // Dynamic padding based on the length of the currency symbol
  const inputPaddingClass = calcCurrency.length > 2 ? 'pl-[3.5rem]' : calcCurrency.length > 1 ? 'pl-[2.75rem]' : 'pl-8';

  useEffect(() => {
    const initConfigs = async () => {
      setIsCalcLoading(true);
      try {
        const headers = {};

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/config/fees/all`, { headers });
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setAllConfigs(data.data);
          
          const uniqueCountries = [...new Set(data.data.map(item => item.country))];
          setAvailableCountries(uniqueCountries);
          
          if (uniqueCountries.length > 0) {
            const defaultCountry =
              uniqueCountries.find(country => country?.toLowerCase() === 'usa') || uniqueCountries[0];
            const platformsForCountry = data.data.filter(c => c.country === defaultCountry).map(c => c.platform);
            setAvailablePlatforms(platformsForCountry);
            
            const defaultPlatform =
              platformsForCountry.find(platform => platform?.toLowerCase() === 'amazon') || platformsForCountry[0] || '';
            setCalcData(prev => ({ ...prev, country: defaultCountry, platform: defaultPlatform }));
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
        const headers = {};

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/config/fees?country=${calcData.country}&platform=${calcData.platform}`, { headers });
        const data = await res.json();
        
        if (data.success && data.data) {
          
          // Parse JSON Tiers for dynamic platform charge logic
          data.data.parsed_platform_charge = parsePlatformChargeTiers(data.data.platform_charge);
          data.data.parsed_platform_charge_conditions = parsePlatformChargeConditions(data.data.platform_charge_conditions);
          setActiveConfig(data.data);
        } else {
          setActiveConfig(null);
        }
      } catch {
        setActiveConfig(null);
      } finally {
        setIsCalcLoading(false);
      }
    };
    fetchCalcTarrifs();
  }, [calcData.country, calcData.platform]);

  const availableCategoryOptions = useMemo(
    () => getConfiguredCampaignCategoryOptions(activeConfig),
    [activeConfig]
  );

  useEffect(() => {
    if (availableCategoryOptions.length > 0 && !availableCategoryOptions.some((option) => option.value === calcData.category)) {
      setCalcData(prev => ({ ...prev, category: availableCategoryOptions[0]?.value || 'Need Review' }));
    }
  }, [activeConfig, calcData.category, availableCategoryOptions]);

  const priceNum = parseFloat(calcData.price || 0);
  const exchangeRate = Number(activeConfig?.exchange_rate) || 1;
  const priceNumUSD = priceNum / exchangeRate;
  const platformChargeTiers = resolvePlatformChargeTiersForCategory(activeConfig, calcData.category);
  
  // DYNAMIC TIER LOGIC FOR PLATFORM FEE
  const platformFee = (() => {
    if (activeConfig && platformChargeTiers && platformChargeTiers.length > 0) {
      // Find the correct tier based on product price
      const matchedTier = platformChargeTiers.find(
        t => priceNumUSD >= Number(t.min) && priceNumUSD <= Number(t.max)
      );
      return matchedTier ? Number(matchedTier.fee) * exchangeRate : 0;
    }
    if (activeConfig && !isNaN(activeConfig.platform_charge)) {
      // Fallback if it's still using the old percentage format
      return (priceNumUSD * (parseFloat(activeConfig.platform_charge) / 100)) * exchangeRate;
    }
    return priceNum * 0.10; // Default 10% fallback
  })();
  
  const totalPerUnit = platformFee;
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

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row animate-fade-in-up mt-8 mb-8 w-full max-w-5xl mx-auto">
      <div className="w-full md:w-3/5 p-8 lg:p-10 bg-white relative">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="text-[#0066ff]" size={28} />
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('calc_title')}</h2>
        </div>
        <p className="text-sm text-gray-500 mb-8 font-medium">{t('calc_desc')}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
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

        <div className="mb-5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Campaign Category</label>
          <select name="category" value={calcData.category} onChange={handleCalcChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
            {availableCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('product_price')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{calcCurrency}</span>
              <input type="number" name="price" value={calcData.price} onChange={handleCalcChange} className={`w-full ${inputPaddingClass} p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('target_qty')}</label>
            <input type="number" name="qty" value={calcData.qty} onChange={handleCalcChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
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
            <span className="text-gray-600 font-medium flex items-center gap-1">
              {t('platform_fee')}{' '}
              {platformChargeTiers?.length > 0 ? (
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
                <p>{t('platform')}: <b className="text-blue-700">{platformChargeTiers?.length > 0 ? t('tiered_fee') : `${activeConfig.platform_charge}%`}</b></p>
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
  );
}
