import { useState, useEffect } from 'react';
import { UploadCloud, Info, ShieldCheck, AlertTriangle, RefreshCw, Wallet } from 'lucide-react';
import {
  CAMPAIGN_CATEGORY_OPTIONS,
  normalizeCampaignCategory,
  parseBuyerRewardConditions,
  parsePlatformChargeConditions,
  parsePlatformChargeTiers,
  resolveBuyerRewardForCategory,
  resolvePlatformChargeTiersForCategory,
} from '../utils/campaignCategories';

export default function AddProduct({ onProductAdded }) {
  const [formData, setFormData] = useState({
    product_name: '', product_link: '', store_name: '', search_keyword: '', 
    country: '', price: '', reward: '', required_orders: 1, 
    instructions: '', platform: '', category: 'Need Review'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 DYNAMIC DROPDOWN STATES
  const [allConfigs, setAllConfigs] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);

  // 🔥 Dynamic Fee States
  const [activeConfig, setActiveConfig] = useState(null); 
  const [isFeeLoading, setIsFeeLoading] = useState(true);

  // 🔥 Logged in user er data
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  const currencySymbols = {
    'USA': '$', 'UK': '£', 'Canada': 'C$', 'Mexico': 'MX$',
    'Germany': '€', 'France': '€', 'Italy': '€', 'Spain': '€',
    'Brazil': 'R$', 'Russia': '₽', 'UAE': 'AED', 'Saudi Arabia': 'SAR',
    'Poland': 'zł', 'Netherlands': '€', 'Bangladesh': '৳', 'India': '₹'
  };

  const typedCountryKey = Object.keys(currencySymbols).find(
    key => key.toLowerCase() === formData.country.trim().toLowerCase()
  );
  const currency = typedCountryKey ? currencySymbols[typedCountryKey] : '$';

  // 🔥 FETCH ALL CONFIGS ON MOUNT TO POPULATE DROPDOWNS
  useEffect(() => {
    const initConfigs = async () => {
      setIsFeeLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/config/fees/all`, {
          headers: {}
        });
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
            setFormData(prev => ({ ...prev, country: firstCountry, platform: firstPlatform }));
          }
        }
      } catch (error) {
        console.error("Failed to load dynamic configs", error);
      } finally {
        setIsFeeLoading(false);
      }
    };
    initConfigs();
  }, []);

  // 🔥 REAL-TIME DYNAMIC FEE FETCH WHEN COUNTRY/PLATFORM CHANGES
  useEffect(() => {
    const fetchDynamicFee = async () => {
      if (!formData.country || !formData.platform) return;
      
      setIsFeeLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/config/fees?country=${formData.country}&platform=${formData.platform}`, {
          headers: {}
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          // JSON Tier Parsing fix
          data.data.parsed_platform_charge = parsePlatformChargeTiers(data.data.platform_charge);
          data.data.parsed_platform_charge_conditions = parsePlatformChargeConditions(data.data.platform_charge_conditions);
          data.data.parsed_buyer_reward_conditions = parseBuyerRewardConditions(data.data.buyer_reward_conditions);
          
          setActiveConfig(data.data);
          
          const fetchedRate = data.data.exchange_rate ? parseFloat(data.data.exchange_rate) : 1;
          const rewardValue = resolveBuyerRewardForCategory(data.data, formData.category);
          if (rewardValue > 0) {
              const localReward = (rewardValue * fetchedRate).toFixed(2);
              setFormData(prev => ({ ...prev, reward: localReward }));
          }
        } else {
          setActiveConfig(null);
        }
      } catch {
        setActiveConfig(null);
      } finally {
        setIsFeeLoading(false);
      }
    };
    fetchDynamicFee();
  }, [formData.country, formData.platform]);

  useEffect(() => {
    if (!activeConfig) return;
    const fetchedRate = activeConfig.exchange_rate ? parseFloat(activeConfig.exchange_rate) : 1;
    const rewardValue = resolveBuyerRewardForCategory(activeConfig, formData.category);
    if (rewardValue > 0) {
      setFormData(prev => ({ ...prev, reward: (rewardValue * fetchedRate).toFixed(2) }));
    }
  }, [activeConfig, formData.category]);

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const platforms = allConfigs.filter(c => c.country === selectedCountry).map(c => c.platform);
    
    setAvailablePlatforms(platforms);
    setFormData({ ...formData, country: selectedCountry, platform: platforms[0] || '' });
  };

  const handlePlatformChange = (e) => {
    setFormData({ ...formData, platform: e.target.value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ==========================================
  // 🔥 UPDATED CALCULATION LOGIC (JSON TIERS + EXCHANGE RATE)
  // ==========================================
  const priceNum = parseFloat(formData.price) || 0;
  const rewardNum = parseFloat(formData.reward) || 0;
  const qtyNum = parseInt(formData.required_orders) || 1;
  
  const rewardDepositPerOrderLocal = rewardNum;
  
  // 🔥 1. Exchange Rate agei ber kore nilam
  const exchangeRate = activeConfig && activeConfig.exchange_rate ? parseFloat(activeConfig.exchange_rate) : 1.0;
  
  // 🔥 2. Local Price ke USD te convert kora holo jate Database er USD Tier er sathe compare kora jay
  const priceNumUSD = priceNum / exchangeRate;
  const platformChargeTiers = resolvePlatformChargeTiersForCategory(activeConfig, formData.category);
  const categoryRewardUSD = activeConfig ? resolveBuyerRewardForCategory(activeConfig, formData.category) : 0;
  const buyerRewardLocked = activeConfig && categoryRewardUSD > 0;
  
  const platformCommissionUSD = (() => {
    if (activeConfig && platformChargeTiers && platformChargeTiers.length > 0) {
      const matchedTier = platformChargeTiers.find(t => priceNumUSD >= Number(t.min) && priceNumUSD <= Number(t.max));
      return matchedTier ? Number(matchedTier.fee) : 0;
    }
    if (activeConfig && !isNaN(activeConfig.platform_charge)) {
      return priceNumUSD * (parseFloat(activeConfig.platform_charge) / 100);
    }
    return priceNumUSD * 0.10; // Fallback 10%
  })();
  
  // 🔥 3. Database theke paowa USD fee ke Local Currency te convert kore UI er variable e rakha holo
  const platformCommissionLocal = platformCommissionUSD * exchangeRate;
  
  // Total in Local Currency
  const totalDepositLocal = (rewardDepositPerOrderLocal + platformCommissionLocal) * qtyNum;

  // 🔥 USD Conversion for Database submission
  const totalDepositUSD = totalDepositLocal / exchangeRate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please upload a product image.");
    if (!formData.country.trim() || !formData.platform.trim()) return alert("Country and Platform are required fields.");

    if (platformChargeTiers?.length > 0 && platformCommissionLocal === 0 && priceNum > 0) {
       return alert(`The product price (${currency}${priceNum}) does not match any valid fee tier for ${normalizeCampaignCategory(formData.category)} on ${formData.platform}. Please adjust the price.`);
    }

    setLoading(true);
    
    try {
      const cloudData = new FormData();
      cloudData.append("file", imageFile);
      cloudData.append("upload_preset", "promot_insight_preset");
      cloudData.append("cloud_name", "dtlkf5smb");

      const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dtlkf5smb/image/upload", {
        method: "POST",
        body: cloudData,
      });
      const cloudJson = await cloudRes.json();
      
      if (!cloudJson.secure_url) {
        throw new Error("Cloudinary image upload failed");
      }

      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'product_link' && formData[key] && !formData[key].startsWith('http')) {
          submitData.append(key, `https://${formData[key]}`);
        } 
        // 🔥 Price এবং Reward কে USD তে কনভার্ট করে API তে পাঠানো হচ্ছে
        else if (key === 'price' || key === 'reward') {
          const usdValue = (parseFloat(formData[key] || 0) / exchangeRate).toFixed(4);
          submitData.append(key, usdValue);
        } 
        else {
          submitData.append(key, formData[key]);
        }
      });
      submitData.append('image_url', cloudJson.secure_url);
      
      // 🔥 Total Deposit-ও যদি ব্যাকএন্ড এক্সপেক্ট করে, তবে সেটিও USD তে পাঠিয়ে দিন
      submitData.append('total_deposit', totalDepositUSD.toFixed(4));
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/products`, {
        method: 'POST',
        headers: {},
        body: submitData
      });
      
      const data = await res.json();
      if (res.status === 429) {
          alert('Rate Limit Exceeded. Please try again later.');
          setLoading(false); return;
      }
      if (data.success) {
        alert(data.message || "Product published successfully!");
        setFormData(prev => ({
          ...prev, product_name: '', product_link: '', store_name: '', search_keyword: '', 
          price: '', reward: '', required_orders: 1, instructions: '', category: 'Need Review'
        }));
        setImageFile(null); setImagePreview(null);
        if(onProductAdded) onProductAdded();
      } else {
        alert(data.message || "Failed to publish product.");
      }
    } catch (error) {
      console.error(error);
      alert("Image upload or Server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in-up">
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <ShieldCheck className="text-[#0066ff]" size={28} /> Publish New Campaign
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">List your product to get genuine feedback or sales from real buyers.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Name *</label>
            <input required type="text" name="product_name" value={formData.product_name} onChange={handleChange} 
              className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all bg-gray-50 focus:bg-white" 
              placeholder="e.g. Wireless Bluetooth Earbuds" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Name *</label>
              <input required type="text" name="store_name" value={formData.store_name} onChange={handleChange} 
                className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all bg-gray-50 focus:bg-white" 
                placeholder="Your Store" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Search Keyword *</label>
              <input required type="text" name="search_keyword" value={formData.search_keyword} onChange={handleChange} 
                className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all bg-gray-50 focus:bg-white" 
                placeholder="Keyword to search" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Link (URL) *</label>
            <input required type="url" name="product_link" value={formData.product_link} onChange={handleChange} 
              className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all bg-gray-50 focus:bg-white" 
              placeholder="https://amazon.com/dp/B08XYZ..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Country *</label>
              <select name="country" required value={formData.country} onChange={handleCountryChange} 
                className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] bg-gray-50 font-semibold cursor-pointer">
                {availableCountries.length > 0 ? (
                  availableCountries.map(c => <option key={c} value={c}>{c}</option>)
                ) : (
                  <option value="">No Data</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Platform *</label>
              <select name="platform" required value={formData.platform} onChange={handlePlatformChange} 
                className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] bg-gray-50 font-semibold cursor-pointer">
                {availablePlatforms.length > 0 ? (
                  availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)
                ) : (
                  <option value="">No Data</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Campaign Category</label>
            <select name="category" value={formData.category} onChange={handleChange} 
              className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] bg-gray-50 font-semibold cursor-pointer">
              {CAMPAIGN_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Price ({currency}) *</label>
              <input required type="number" step="0.01" min="0.01" name="price" value={formData.price} onChange={handleChange} 
                className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] transition-all bg-gray-50 focus:bg-white text-lg font-bold" 
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center justify-between">
                 <span>Buyer Reward ({currency}) *</span>
                 {buyerRewardLocked && <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded">Fixed by Admin</span>}
              </label>
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0" 
                name="reward" 
                value={formData.reward} 
                onChange={handleChange} 
                readOnly={buyerRewardLocked}
                className={`w-full p-3 border rounded-xl outline-none transition-all text-lg font-bold ${buyerRewardLocked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:bg-white text-green-600 focus:border-green-500'}`} 
                placeholder="0.00" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Quantity (Orders) *</label>
            <input required type="number" min="1" name="required_orders" value={formData.required_orders} onChange={handleChange} 
              className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] transition-all bg-gray-50 focus:bg-white text-lg font-bold" 
              placeholder="1" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Image *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden">
              <input type="file" required accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {imagePreview ? (
                <div className="relative w-full h-32 flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded" />
                </div>
              ) : (
                <>
                  <UploadCloud size={36} className="text-blue-500 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Click or drag image to upload</p>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Special Instructions for Buyer</label>
            <textarea name="instructions" value={formData.instructions} onChange={handleChange} 
              className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] transition-all bg-gray-50 focus:bg-white h-24 text-sm" 
              placeholder="Any specific steps the buyer should follow before purchasing..."></textarea>
          </div>
        </div>

        {user.role === 'seller' && (
        <div className="md:col-span-2 mt-2 bg-yellow-50/80 p-5 rounded-2xl flex flex-col border border-yellow-200 shadow-sm relative overflow-hidden">
          
          {isFeeLoading && (
             <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <span className="text-blue-700 font-bold text-sm flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={18} /> Fetching Active Tariffs...
                </span>
             </div>
          )}

          <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                <AlertTriangle size={18}/> Financial Summary & Tariffs
              </h3>
              {formData.country && formData.platform && !isFeeLoading && (
                 <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold uppercase tracking-wider">
                   Target: {formData.country} - {formData.platform}
                 </span>
              )}
           </div>
           <p className="text-[11px] text-gray-500 font-semibold mb-3">
             Platform charge and buyer reward are stored in USD. Seller price and reward inputs stay in the selected country's local currency.
           </p>

           <div className="flex flex-col md:flex-row gap-4">
             {activeConfig && (
               <div className="bg-white p-3 rounded-xl border border-yellow-200 w-full md:w-1/3">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Active Tariffs Overview</h4>
                  <ul className="text-xs text-gray-700 space-y-1.5 font-medium">
                     <li className="flex justify-between">
                       <span>Platform Charge:</span> 
                       <b className="text-[#0066ff]">{platformChargeTiers?.length > 0 ? 'Tiered Fee' : `${activeConfig.platform_charge}%`}</b>
                     </li>
                     <li className="flex justify-between"><span>Buyer Reward:</span> <b>{categoryRewardUSD > 0 ? `${currency}${(categoryRewardUSD * exchangeRate).toFixed(2)}` : 'Custom'}</b></li>
                     <li className="flex justify-between"><span>Deposit Fee:</span> <b>{activeConfig.seller_deposit_fee}%</b></li>
                     <li className="flex justify-between"><span>W.Draw Fee:</span> <b>{activeConfig.seller_withdrawal_fee}%</b></li>
                     <li className="flex justify-between mt-1 pt-1 border-t border-gray-100">
                       <span className="text-[10px] uppercase text-gray-400">Exchange Rate:</span> 
                       <b className="text-[#0066ff] text-[10px]">1 USD = {exchangeRate} {currency}</b>
                     </li>
                  </ul>
               </div>
             )}

             <div className={`bg-white p-4 rounded-xl border border-yellow-200 ${activeConfig ? 'w-full md:w-2/3' : 'w-full'}`}>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500">Reward Deposit</span>
                    <span className="font-bold text-gray-800">{currency}{rewardDepositPerOrderLocal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500 flex items-center gap-1">
                      Platform Tariff {platformChargeTiers?.length > 0 ? '(Fixed Tier)' : ''}
                    </span>
                    <span className="font-bold text-red-500">+{currency}{platformCommissionLocal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <span className="font-semibold text-gray-500">Target Quantity</span>
                    <span className="font-bold text-gray-800">x {qtyNum}</span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3 mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-600">Total in Local Currency</span>
                      <span className="font-bold text-gray-800">{currency}{totalDepositLocal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                      <span className="font-black text-blue-900 text-sm flex items-center gap-1"><Wallet size={16}/> Final Deduction (USD)</span>
                      <div className="text-right">
                         <span className="font-black text-2xl text-[#0066ff]">${totalDepositUSD.toFixed(2)}</span>
                         <p className="text-[10px] text-blue-600 font-bold mt-0.5">Will be deducted from wallet</p>
                      </div>
                    </div>
                  </div>

                </div>
             </div>
          </div>
          
          <p className="text-xs text-yellow-700 mt-3 font-medium flex items-start gap-1">
            <Info size={14} className="shrink-0 mt-0.5"/> This USD amount will be temporarily locked from your wallet. Unused funds are automatically refunded if orders are cancelled.
          </p>
        </div>
        )}

        <button 
          type="submit" 
          disabled={loading || isFeeLoading} 
          className="mt-6 w-full bg-[#0066ff] text-white p-4 rounded-xl hover:bg-blue-700 transition-all font-black text-lg disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 md:col-span-2"
        >
          {loading ? <><RefreshCw className="animate-spin" size={20} /> Publishing...</> : 'Confirm & Publish Campaign'}
        </button>

      </form>
    </div>
  );
}
