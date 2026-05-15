import React, { useState } from 'react';

export default function AddProduct({ onProductAdded }) {
  const [formData, setFormData] = useState({
    product_name: '', product_link: '', store_name: '', search_keyword: '', 
    country: 'USA', price: '', reward: '', required_orders: 1, 
    instructions: '', platform: 'Amazon', category: 'Need Review' // 🔥 Default Condition Category
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 Dynamic Currency Map based on Extended Country List
  const currencySymbols = {
    'USA': '$', 'UK': '£', 'Canada': 'C$', 'Mexico': 'MX$',
    'Germany': '€', 'France': '€', 'Italy': '€', 'Spain': '€',
    'Brazil': 'R$', 'Russia': '₽', 'UAE': 'AED', 'Saudi Arabia': 'SAR',
    'Poland': 'zł', 'Netherlands': '€'
  };

  const currency = currencySymbols[formData.country] || '$';

  // 🔥 Commission & Total Deposit Calculation (10% Platform Fee)
  const priceNum = parseFloat(formData.price) || 0;
  const rewardNum = parseFloat(formData.reward) || 0;
  const qtyNum = parseInt(formData.required_orders) || 1;
  
  const costPerOrder = priceNum + rewardNum;
  const platformCommission = costPerOrder * 0.10; // 10% Commission
  const totalCostPerOrder = costPerOrder + platformCommission;
  const totalDeposit = totalCostPerOrder * qtyNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please upload a product image.");
      return;
    }

    if (priceNum < 0 || rewardNum < 0) {
      alert("Price and Reward cannot be negative numbers.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    const submitData = new FormData();
    submitData.append('image', imageFile); 
    
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]); 
    });

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: submitData
      });

      const data = await response.json();
      if (response.ok) {
        alert('Product listed successfully!');
        onProductAdded(); 
      } else {
        alert(data.message || 'Failed to add product.');
      }
    } catch (error) {
      alert('Server error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100 animate-fade-in-up">
      <h3 className="text-xl font-bold mb-6 border-b pb-3 text-gray-800">List a New Product</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Upload Product Image *</label>
          <input 
            type="file" accept="image/*" required 
            className="p-1.5 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-gray-600 outline-none focus:ring-2 focus:ring-blue-400" 
            onChange={e => setImageFile(e.target.files[0])} 
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
          <input type="text" placeholder="e.g. Wireless Mouse" required className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.product_name}
            onChange={e => setFormData({...formData, product_name: e.target.value})} />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Product Link (Hidden initially) *</label>
          <input type="url" placeholder="https://amazon.com/..." required className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.product_link}
            onChange={e => setFormData({...formData, product_link: e.target.value})} />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Secret Store Name *</label>
          <input type="text" placeholder="e.g. SmartTech Store" required className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.store_name}
            onChange={e => setFormData({...formData, store_name: e.target.value})} />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Search Keyword *</label>
          <input type="text" placeholder="Keyword to search on platform" required className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.search_keyword}
            onChange={e => setFormData({...formData, search_keyword: e.target.value})} />
        </div>

        {/* 🔥 UPDATED: Condition Category */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Condition Category (Task Type) *</label>
          <select className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/50" 
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="Need Review">Need Review</option>
            <option value="No Review">No Review</option>
            <option value="Rating/Feedback">Rating/Feedback</option>
            <option value="Pre-Pay">Pre-Pay</option>
          </select>
        </div>

        {/* 🔥 UPDATED: Platform List */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Platform *</label>
          <select className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.platform}
            onChange={e => setFormData({...formData, platform: e.target.value})}>
            <option value="Amazon">Amazon</option>
            <option value="Walmart">Walmart</option>
            <option value="Mercado Libre">Mercado Libre</option>
            <option value="Ebay">Ebay</option>
            <option value="Aliexpress">Aliexpress</option>
            <option value="Ozon">Ozon</option>
            <option value="Noon">Noon</option>
            <option value="Allegro">Allegro</option>
            <option value="Otto">Otto</option>
            <option value="Bol">Bol</option>
            <option value="Zalando">Zalando</option>
            <option value="Cdiscount">Cdiscount</option>
          </select>
        </div>

        {/* 🔥 UPDATED: Extended Country List */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Country *</label>
          <select className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.country}
            onChange={e => setFormData({...formData, country: e.target.value})}>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Mexico">Mexico</option>
            <option value="Brazil">Brazil</option>
            <option value="Russia">Russia</option>
            <option value="Germany">Germany (DE)</option>
            <option value="Spain">Spain (ES)</option>
            <option value="France">France (FR)</option>
            <option value="Italy">Italy (IT)</option>
            <option value="Poland">Poland</option>
            <option value="Netherlands">Netherlands</option>
            <option value="UAE">UAE</option>
            <option value="Saudi Arabia">Saudi Arabia (KSA)</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Product Price ({currency}) *</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" required className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})} />
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Buyer Reward ({currency}) *</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" required className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.reward}
            onChange={e => setFormData({...formData, reward: e.target.value})} />
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Target Orders (Qty) *</label>
          <input type="number" min="1" placeholder="1" required className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.required_orders}
            onChange={e => setFormData({...formData, required_orders: e.target.value})} />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-semibold text-gray-700 mb-1">Specific Instructions for Buyer *</label>
          <textarea placeholder="e.g. Please search the keyword, scroll down a bit, and find the correct store name before buying." required className="p-2 border rounded-lg h-24 focus:ring-2 focus:ring-blue-400 outline-none" 
            value={formData.instructions}
            onChange={e => setFormData({...formData, instructions: e.target.value})}></textarea>
        </div>

        {/* 🔥 Detailed Calculation Box */}
        <div className="md:col-span-2 bg-yellow-50 text-yellow-800 p-4 rounded-lg flex flex-col border border-yellow-200">
          <div className="flex justify-between text-sm mb-1">
            <span>Product Cost (Price + Reward):</span>
            <span>{currency}{costPerOrder.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Platform Commission (10%):</span>
            <span>{currency}{platformCommission.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Target Quantity:</span>
            <span>x {qtyNum}</span>
          </div>
          <div className="flex justify-between items-center border-t border-yellow-300 mt-2 pt-2">
            <span className="font-semibold">Total Required Deposit:</span>
            <span className="font-bold text-xl">{currency}{totalDeposit.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" disabled={loading} className="md:col-span-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:bg-blue-400 shadow-md">
          {loading ? 'Processing...' : 'Publish Product'}
        </button>
      </form>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}