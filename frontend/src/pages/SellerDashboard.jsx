import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AddProduct from '../components/AddProduct';
import SellerTariffsPage from '../components/SellerTariffsPage';
import { 
  Package, PlusCircle, LayoutDashboard, Wallet, Clock,
  Eye, Edit, XCircle, Link as LinkIcon, Image as ImageIcon, Landmark, X, Receipt, AlertTriangle, Scale, CheckCircle,
  Headset, MessageCircle, Send, History, Settings
} from 'lucide-react';

// ================= SECURITY HELPER =================
const secureFetch = async (url, options = {}) => {
  options.credentials = 'include';
  try {
    const res = await fetch(url, options);
    if (res.status === 429) {
      alert("Rate Limit Exceeded: Too many requests. Please slow down and try again later.");
      return { ok: false, status: 429, json: async () => ({ success: false, message: "Too many requests. Please slow down." }) };
    }
    return res;
  } catch (error) {
    console.error("Network Error during secure fetch:", error);
    throw error;
  }
};
// ===================================================

export default function SellerDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState([]); 
  const [paymentMethods, setPaymentMethods] = useState([]); 
  const [selectedDepositMethod, setSelectedDepositMethod] = useState(null); 
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState(null); 
  
  const [depositData, setDepositData] = useState({ 
    amount: '', payment_method: '', transaction_id: '',
    account_details: '', crypto_address: '', crypto_network: '', crypto_memo: '' 
  });
  const [isDepositing, setIsDepositing] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawData, setWithdrawData] = useState({ 
    amount: '', payment_method: '', account_details: '',
    crypto_address: '', crypto_network: '', crypto_memo: '' 
  });
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [localCurrencyInfo, setLocalCurrencyInfo] = useState({ rate: 1, code: 'Local' });

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]); 
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Seller Appeal Modal States
  const [showSellerAppealModal, setShowSellerAppealModal] = useState(false);
  const [appealData, setAppealData] = useState({ application_id: '', reason: '' });
  const [isAppealing, setIsAppealing] = useState(false);

  // Appeals Data
  const [myAppeals, setMyAppeals] = useState([]);

  // Full Image Lightbox States
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState('');

  // Transaction History States
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [refunds, setRefunds] = useState([]); 
  const [fundHistoryTab, setFundHistoryTab] = useState('withdrawals');
  
  const [showTrxDetailsModal, setShowTrxDetailsModal] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [trxType, setTrxType] = useState('');

  // Ledger / Deduction History Modal
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // ================= SUPPORT TICKET STATES =================
  const [supportTickets, setSupportTickets] = useState([]);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplies, setTicketReplies] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [showTicketViewModal, setShowTicketViewModal] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showDepositModal || showWithdrawModal || showViewModal || showEditModal || showSellerAppealModal || showLedgerModal || showCreateTicketModal || showTicketViewModal || showFullImageModal || showTrxDetailsModal;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDepositModal, showWithdrawModal, showViewModal, showEditModal, showSellerAppealModal, showLedgerModal, showCreateTicketModal, showTicketViewModal, showFullImageModal, showTrxDetailsModal]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    try {
      const profileRes = await secureFetch('https://backend-6aiq.onrender.com/api/users/profile', { headers: authHeaders });
      const profileData = await profileRes.json();
      if (profileData.success) {
         setWalletBalance(parseFloat(profileData.user.wallet_balance) || 0);
         
         // Fetch Local Currency Rate based on Seller's Country
         try {
            const userCountry = profileData.user.country || '';
            if (userCountry) {
               const feeRes = await fetch(`https://backend-6aiq.onrender.com/api/config/fees/all`, { headers: authHeaders });
               const feeData = await feeRes.json();
               if (feeData.success && feeData.data) {
                  const config = feeData.data.find(c => c.country.toLowerCase() === userCountry.toLowerCase());
                  if (config && config.exchange_rate) {
                     setLocalCurrencyInfo({ rate: parseFloat(config.exchange_rate), code: config.country });
                  }
               }
            }
         } catch(e) { console.error("Currency fetch error", e); }
      }

      const productsRes = await secureFetch('https://backend-6aiq.onrender.com/api/products/my', { headers: authHeaders });
      const productsData = await productsRes.json();
      if (productsData.success) setProducts(productsData.data);

      const settingsRes = await secureFetch('https://backend-6aiq.onrender.com/api/users/payment-settings', { headers: authHeaders });
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data.length > 0) {
        setPaymentSettings(settingsData.data);
      }

      // Fetch dynamic payment methods
      const pmRes = await fetch('https://backend-6aiq.onrender.com/api/payment-methods/list', { headers: authHeaders });
      const pmData = await pmRes.json();
      if (pmRes.ok && pmData.success) {
         setPaymentMethods(pmData.data || []);
      }

      try {
        const wRes = await secureFetch('https://backend-6aiq.onrender.com/api/withdrawals/my', { headers: authHeaders });
        const wData = await wRes.json();
        if (wData.success) setWithdrawals(wData.data);
      } catch(e) { }

      try {
        const dRes = await secureFetch('https://backend-6aiq.onrender.com/api/users/deposits', { headers: authHeaders });
        const dData = await dRes.json();
        if (dData.success) setDeposits(dData.data);
      } catch(e) { }

      try {
        const rRes = await secureFetch('https://backend-6aiq.onrender.com/api/products/refunds/my', { headers: authHeaders });
        const rData = await rRes.json();
        if (rData.success) setRefunds(rData.data);
      } catch(e) { }

      try {
        const aRes = await secureFetch('https://backend-6aiq.onrender.com/api/appeals/my', { headers: authHeaders });
        const aData = await aRes.json();
        if (aData.success) setMyAppeals(aData.data);
      } catch(e) { }

      try {
        const tRes = await secureFetch('https://backend-6aiq.onrender.com/api/support/my', { headers: authHeaders });
        const tData = await tRes.json();
        if (tData.success) setSupportTickets(tData.data);
      } catch(e) { }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchProductReviews = async (productId) => {
    setReviewsLoading(true);
    setProductReviews([]); 
    try {
      const token = localStorage.getItem('token');
      const response = await secureFetch(`https://backend-6aiq.onrender.com/api/applications/seller/product/${productId}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) setProductReviews(data.data);
    } catch (error) {
      console.error("Failed to fetch product reviews", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const openViewModal = async (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
    fetchProductReviews(product.id);
  };

  const handleSellerApproveReview = async (applicationId) => {
    if (!window.confirm("Are you sure you want to approve this order/review? It will be sent to Admin for final refund.")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch(`https://backend-6aiq.onrender.com/api/applications/seller/${applicationId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Approved successfully!");
        fetchProductReviews(selectedProduct.id); 
      } else {
        alert(data.message || "Failed to approve.");
      }
    } catch (error) {
      alert("Server error.");
    }
  };

  const handleSellerAppealSubmit = async (e) => {
    e.preventDefault();
    setIsAppealing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch('https://backend-6aiq.onrender.com/api/appeals/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          application_id: appealData.application_id,
          reason: appealData.reason,
          appeal_type: 'order_dispute'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Appeal submitted to Admin successfully! Admin will review and make a decision.");
        setShowSellerAppealModal(false);
        setAppealData({ application_id: '', reason: '' });
        fetchProductReviews(selectedProduct.id); 
        fetchDashboardData(); 
      } else {
        alert(data.message || "Failed to submit appeal.");
      }
    } catch (error) {
      alert("Server error.");
    } finally {
      setIsAppealing(false);
    }
  };

  const handleDepositMethodChange = (methodName) => {
    const method = paymentMethods.find(m => m.name === methodName);
    setSelectedDepositMethod(method);
    setDepositData(prev => ({ ...prev, payment_method: methodName, crypto_network: '' }));
  };

  const handleWithdrawMethodChange = (methodName) => {
    const method = paymentMethods.find(m => m.name === methodName);
    setSelectedWithdrawMethod(method);
    setWithdrawData(prev => ({ ...prev, payment_method: methodName, crypto_network: '' }));
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setIsDepositing(true);
    const token = localStorage.getItem('token');
    try {
      const response = await secureFetch('https://backend-6aiq.onrender.com/api/users/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(depositData) 
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setShowDepositModal(false);
        setDepositData({ amount: '', payment_method: paymentSettings.length > 0 ? paymentSettings[0].method_name : 'PayPal', transaction_id: '' });
        fetchDashboardData();
      } else alert(data.message || 'Deposit failed');
    } catch (error) { alert('Server error during deposit'); } 
    finally { setIsDepositing(false); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setIsWithdrawing(true);
    const token = localStorage.getItem('token');
    try {
      const response = await secureFetch('https://backend-6aiq.onrender.com/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(withdrawData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Withdrawal request submitted successfully!');
        setShowWithdrawModal(false);
        setWithdrawData({ amount: '', payment_method: 'Bank', account_details: '' });
        fetchDashboardData();
      } else alert(data.message || 'Withdrawal failed');
    } catch (error) { alert('Server error during withdrawal'); } 
    finally { setIsWithdrawing(false); }
  };

  const handleCancel = async (productId) => {
    if (!window.confirm("Are you sure you want to cancel this product? Your deposit will be refunded to your wallet.")) return;
    const token = localStorage.getItem('token');
    try {
      const response = await secureFetch(`https://backend-6aiq.onrender.com/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) { alert(data.message); fetchDashboardData(); } 
      else alert(data.message || 'Failed to cancel product');
    } catch (error) { alert('Server error'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    const token = localStorage.getItem('token');
    try {
      const response = await secureFetch(`https://backend-6aiq.onrender.com/api/products/${editFormData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Product updated successfully!');
        setShowEditModal(false);
        fetchDashboardData();
      } else alert(data.message || 'Failed to update product');
    } catch (error) { alert('Server error'); } 
    finally { setIsEditing(false); }
  };

  // ================= SUPPORT SYSTEM LOGIC =================
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch(`https://backend-6aiq.onrender.com/api/support/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(ticketForm)
      });
      if(res.ok) {
        alert('Support ticket created successfully!');
        setShowCreateTicketModal(false);
        setTicketForm({ subject: '', message: '' });
        fetchDashboardData(); 
      } else {
        alert('Failed to create ticket');
      }
    } catch (err) {
      alert('Server error');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const openTicketView = async (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketViewModal(true);
    setRepliesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch(`https://backend-6aiq.onrender.com/api/support/${ticket.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(res.ok) {
        setTicketReplies(data.data.replies || []);
        setSelectedTicket(data.data.ticket);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if(!replyMessage.trim()) return;
    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch(`https://backend-6aiq.onrender.com/api/support/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: replyMessage })
      });
      const data = await res.json();
      if(res.ok) {
        setTicketReplies([...ticketReplies, data.data]);
        setReplyMessage('');
        fetchDashboardData(); 
      } else {
        alert('Failed to send reply');
      }
    } catch (err) {
      alert('Server error');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'review_submitted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'pending_refund': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'forwarded_to_seller': return 'bg-indigo-100 text-indigo-700 border-indigo-200'; 
      case 'approved': case 'order_approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'stopped': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'disputed': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />

      <div className="bg-[#0066ff] px-4 pt-6 pb-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-sm text-blue-100 opacity-90 mt-1">Manage your products and sales</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center justify-between gap-6 w-full md:w-auto min-w-[280px] shadow-lg">
          <div>
            <p className="text-xs text-blue-100 font-bold uppercase tracking-wider">Wallet Balance</p>
            <div className="flex flex-col">
              <p className="text-2xl md:text-3xl font-black">${walletBalance.toFixed(2)} <span className="text-sm font-bold">USD</span></p>
              <p className="text-[10px] text-blue-100 font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20 w-max mt-1">
                 ~ {(walletBalance * localCurrencyInfo.rate).toFixed(2)} {localCurrencyInfo.code}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowLedgerModal(true)} 
            className="bg-white text-[#0066ff] p-3 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex flex-col items-center justify-center gap-1 group min-w-[70px]"
            title="View Deduction History"
          >
             <Receipt size={22} className="group-hover:scale-110 transition-transform"/>
             <span className="text-[10px] font-extrabold uppercase tracking-wider">Ledger</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-gray-700 text-xl font-bold mb-4">My Listed Products</h2>
            {loading ? (
              <p className="text-gray-500 animate-pulse text-center py-10">Loading data...</p>
            ) : products.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">You don't have any active products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    
                    <div 
                      className="relative group cursor-pointer bg-gray-50" 
                      onClick={() => { setFullImageUrl(product.image_url); setShowFullImageModal(true); }}
                    >
                      <img src={product.image_url} alt="Product" className="w-full h-48 object-contain bg-white p-2" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Eye size={14}/> View Image</span>
                      </div>
                      <span className={`absolute top-2 right-2 px-2 py-1 text-[10px] font-black uppercase rounded shadow-sm border ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="font-bold text-gray-800 line-clamp-1 flex-1">{product.product_name || product.store_name}</h4>
                        <span className="bg-[#fff9e6] text-[#b38600] border border-[#ffdf7e] text-[9px] px-2 py-0.5 rounded shadow-sm font-black whitespace-nowrap">
                           {product.category || 'Need Review'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <p className="text-gray-600">Price: <span className="font-bold text-black">${product.price}</span></p>
                        <p className="text-gray-600">Reward: <span className="font-bold text-green-600">${product.reward}</span></p>
                      </div>
                      <div className="mt-auto pt-4 flex gap-2">
                        {product.status === 'pending' && (
                          <>
                            <button onClick={() => { setEditFormData(product); setShowEditModal(true); }} className="flex-1 bg-yellow-50 text-yellow-600 py-2 rounded-lg text-sm font-bold border border-yellow-200 flex items-center justify-center gap-1 hover:bg-yellow-500 hover:text-white transition-colors"><Edit size={14}/> Edit</button>
                            <button onClick={() => handleCancel(product.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold border border-red-200 flex items-center justify-center gap-1 hover:bg-red-500 hover:text-white transition-colors"><XCircle size={14}/> Cancel</button>
                          </>
                        )}
                        {product.status !== 'pending' && (
                          <button onClick={() => openViewModal(product)} className="w-full bg-[#0066ff] text-white py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"><Eye size={16}/> View Details</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD TAB */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 sm:p-4">
             <AddProduct onProductAdded={() => { fetchDashboardData(); window.location.href = '/dashboard?tab=overview'; }} />
          </div>
        )}

        {/* TRACKING TAB */}
        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <h2 className="text-gray-700 text-xl font-bold mb-4">Quota & Review Tracking</h2>
            {products.filter(p => p.status === 'approved' || p.status === 'stopped').map(product => (
              <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-center">
                <img src={product.image_url} alt="Product" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{product.product_name}</h3>
                    {product.status === 'stopped' && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-orange-200">Stopped</span>}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center max-w-lg">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Total Quota</p>
                      <p className="text-2xl font-black text-gray-700">{product.required_orders}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 shadow-sm">
                      <p className="text-[10px] text-blue-500 font-bold uppercase">Applications</p>
                      <p className="text-2xl font-black text-blue-700">{product.application_count || 0}</p>
                    </div>
                    <div className="flex items-center justify-center">
                       <button onClick={() => openViewModal(product)} className="text-[#0066ff] text-sm font-bold flex items-center gap-1 hover:underline"><Eye size={18}/> View Reviews</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {products.filter(p => p.status === 'approved' || p.status === 'stopped').length === 0 && (
              <p className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed">No active products available for tracking.</p>
            )}
          </div>
        )}

        {/* FUNDS TAB */}
        {activeTab === 'funds' && (
          <div className="space-y-6">
            <h2 className="text-gray-700 text-xl font-bold mb-4">Fund Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between items-center text-center hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-blue-50 text-[#0066ff] rounded-full flex items-center justify-center mb-4"><Wallet size={40}/></div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Add Funds to Wallet</h3>
                <p className="text-sm text-gray-500 mb-6">Deposit is required to list new products.</p>
                <button onClick={() => setShowDepositModal(true)} className="w-full bg-[#0066ff] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors">+ Deposit Funds</button>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between items-center text-center hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><Landmark size={40}/></div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Withdraw Funds</h3>
                <p className="text-sm text-gray-500 mb-6">Withdraw your remaining wallet balance.</p>
                <button onClick={() => setShowWithdrawModal(true)} className="w-full bg-red-50 text-red-600 border border-red-200 py-3.5 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors">Request Withdrawal</button>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <h3 className="font-bold text-gray-800 text-xl">Transaction History</h3>
                <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner">
                  <button 
                    onClick={() => setFundHistoryTab('withdrawals')} 
                    className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${fundHistoryTab === 'withdrawals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Withdrawals
                  </button>
                  <button 
                    onClick={() => setFundHistoryTab('deposits')} 
                    className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${fundHistoryTab === 'deposits' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Deposits
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                 {fundHistoryTab === 'withdrawals' && withdrawals.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No withdrawal records found.</p>}
                 {fundHistoryTab === 'withdrawals' && withdrawals.map(w => (
                   <div key={w.id} className="flex justify-between items-center p-4 border border-gray-100 bg-gray-50 rounded-xl hover:shadow-sm transition-all">
                     <div>
                       <p className="font-bold text-gray-800 text-lg">${Number(w.amount).toFixed(2)} <span className="text-sm text-gray-500 font-normal">via {w.payment_method}</span></p>
                       <p className="text-xs text-gray-400 mt-1">{new Date(w.created_at).toLocaleString()}</p>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${w.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : w.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                         {w.status}
                       </span>
                       <button onClick={() => { setSelectedTrx(w); setTrxType('withdrawal'); setShowTrxDetailsModal(true); }} className="text-[#0066ff] hover:underline text-xs font-bold flex items-center gap-1">
                         <Eye size={14}/> View Details
                       </button>
                     </div>
                   </div>
                 ))}

                 {fundHistoryTab === 'deposits' && deposits.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No deposit records found.</p>}
                 {fundHistoryTab === 'deposits' && deposits.map(d => (
                   <div key={d.id} className="flex justify-between items-center p-4 border border-gray-100 bg-gray-50 rounded-xl hover:shadow-sm transition-all">
                     <div>
                       <p className="font-bold text-gray-800 text-lg">${Number(d.amount).toFixed(2)} <span className="text-sm text-gray-500 font-normal">via {d.payment_method}</span></p>
                       <p className="text-xs text-gray-400 mt-1">{new Date(d.created_at).toLocaleString()}</p>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${d.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : d.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                         {d.status}
                       </span>
                       <button onClick={() => { setSelectedTrx(d); setTrxType('deposit'); setShowTrxDetailsModal(true); }} className="text-[#0066ff] hover:underline text-xs font-bold flex items-center gap-1">
                         <Eye size={14}/> View Details
                       </button>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* REFUNDS TAB */}
        {activeTab === 'refunds' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-gray-700 text-xl font-bold flex items-center gap-2">
                  <History className="text-red-500" />
                  Product Deletion Refunds
               </h2>
               <span className="bg-red-100 text-red-800 text-sm py-1 px-4 rounded-full font-bold border border-red-200">{refunds.length} Logs</span>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="space-y-4">
                  {refunds.length === 0 ? (
                     <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        No product refund logs found.
                     </div>
                  ) : (
                     refunds.map(r => (
                        <div key={r.id} className="flex justify-between items-center p-5 border border-red-100 bg-red-50/30 rounded-xl hover:shadow-sm transition-all">
                           <div>
                              <p className="font-bold text-gray-800">{r.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                           </div>
                           <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                              <span className="font-black text-2xl text-green-600">+${Number(r.amount).toFixed(2)}</span>
                              <span className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-green-100 text-green-700 border-green-200">
                                {r.status}
                              </span>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
          </div>
        )}

        {/* APPEALS TAB */}
        {activeTab === 'appeals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-gray-700 text-xl font-bold">My Appeals</h2>
               <span className="bg-blue-100 text-blue-800 text-sm py-1 px-4 rounded-full font-bold">{myAppeals.length} Appeals</span>
            </div>
            
            {loading ? (
              <p className="text-gray-500 animate-pulse text-center py-10">Loading appeals...</p>
            ) : myAppeals.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
                <Scale size={56} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-lg">You have not submitted any appeals.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {myAppeals.map(appeal => (
                  <div key={appeal.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                      <div>
                         <p className="font-bold text-gray-800 text-lg flex items-center gap-2">
                           Application ID: #{appeal.application_id}
                         </p>
                         <p className="text-xs text-gray-500 mt-1">{new Date(appeal.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        appeal.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                        appeal.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {appeal.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Your Reason</p>
                      <p className="text-gray-700">{appeal.reason}</p>
                    </div>

                    {appeal.status === 'approved' && (
                      <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-start gap-3">
                         <CheckCircle size={20} className="text-green-600 mt-0.5 shrink-0" />
                         <div>
                            <p className="font-bold text-green-800 mb-1">Appeal Accepted</p>
                            <p className="text-sm text-green-700">Your appeal was accepted by Admin, and no funds were deducted from your escrow.</p>
                         </div>
                      </div>
                    )}

                    {appeal.status === 'rejected' && (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                         <XCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                         <div>
                            <p className="font-bold text-red-800 mb-1">Appeal Rejected</p>
                            <p className="text-sm text-red-700">{appeal.admin_reply || "Admin has rejected this appeal and processed the refund for the buyer."}</p>
                         </div>
                      </div>
                    )}
                    
                    {appeal.status === 'pending' && (
                       <p className="text-sm text-yellow-600 font-semibold italic flex items-center gap-2">
                          <Clock size={18}/> Admin is currently reviewing this appeal.
                       </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'tariffs' && <SellerTariffsPage />}

        {!loading && activeTab === 'support' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
             <button 
                onClick={() => setShowCreateTicketModal(true)} 
                className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-lg"
             >
               <PlusCircle size={24} /> Create New Ticket
             </button>

             <div className="space-y-4">
                {supportTickets.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <Headset size={56} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Need Help?</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Open a ticket and our support team will get back to you as soon as possible.</p>
                  </div>
                ) : (
                  supportTickets.map((ticket) => (
                    <div 
                       key={ticket.id} 
                       onClick={() => openTicketView(ticket)}
                       className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all flex items-start gap-4"
                    >
                      <div className={`p-4 rounded-full shrink-0 ${ticket.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-[#0066ff]'}`}>
                        <MessageCircle size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="text-lg font-bold text-gray-800 line-clamp-1">{ticket.subject}</h4>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                             ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                             ticket.status === 'answered' ? 'bg-green-100 text-green-700 border-green-200' :
                             'bg-gray-100 text-gray-600 border-gray-200'
                           }`}>
                             {ticket.status}
                           </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{ticket.message}</p>
                        <p className="text-xs text-gray-400 font-medium">Last updated: {new Date(ticket.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

      </div>

      {/* 🔥 LEDGER MODAL - DATABASE DRIVEN */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/80">
              <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                <Receipt className="text-[#0066ff]" size={28} /> Product Deduction Ledger
              </h3>
              <button onClick={() => setShowLedgerModal(false)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm border border-gray-100 p-2 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mb-6 shadow-sm">
                <h4 className="font-bold text-blue-800 mb-2">How is the deduction calculated?</h4>
                <p className="text-sm text-blue-700 leading-relaxed font-medium">
                  When you list a product, the system safely holds funds in escrow based on Active Tariffs. The formula is: <br/>
                  <strong className="bg-white px-3 py-1.5 rounded inline-block mt-2 border border-blue-200 shadow-sm text-[#0066ff]">
                    (Product Price + Buyer Reward + Platform Tariff + Refund Fee) × Target Quantity
                  </strong>
                </p>
              </div>

              <div className="space-y-6">
                 {products.filter(p => p.status !== 'rejected').length === 0 ? (
                   <p className="text-center text-gray-500 py-12 font-semibold border border-dashed border-gray-300 rounded-2xl">No active product deductions found.</p>
                 ) : (
                   products.filter(p => p.status !== 'rejected').map(p => {
                     const price = parseFloat(p.price) || 0;
                     const reward = parseFloat(p.reward) || 0;
                     const qty = parseInt(p.required_orders) || 1;
                     const costPerOrder = price + reward;
                     
                     // 🔥 EXACT DATA FROM DATABASE
                     const commission = parseFloat(p.platform_fee_charged) || 0;
                     const totalDeducted = parseFloat(p.total_deposit) || 0;
                     
                     // Mathematical back-calculation for Refund Fee part
                     const refundFee = (totalDeducted / qty) - costPerOrder - commission;

                     return (
                       <div key={p.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                         <div className="bg-gray-50 p-5 border-b border-gray-200 flex justify-between items-center">
                           <div className="flex items-center gap-4">
                             <img src={p.image_url} className="w-14 h-14 object-contain rounded-lg border bg-white p-1" alt="product"/>
                             <div>
                               <h4 className="font-bold text-gray-800 text-base line-clamp-1">{p.product_name || p.store_name}</h4>
                               <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border mt-1 inline-block ${getStatusColor(p.status)}`}>{p.status}</span>
                             </div>
                           </div>
                           <div className="text-right shrink-0">
                             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Deducted</p>
                             <p className="text-2xl font-black text-red-500">-${totalDeducted.toFixed(2)}</p>
                           </div>
                         </div>
                         
                         <div className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm bg-white">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Unit Price</p>
                              <p className="font-black text-gray-800 text-lg">${price.toFixed(2)}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                              <p className="text-green-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">Buyer Reward</p>
                              <p className="font-black text-green-700 text-lg">+${reward.toFixed(2)}</p>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center relative group">
                              <p className="text-orange-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">Platform Tariff</p>
                              <p className="font-black text-orange-700 text-lg">+${commission.toFixed(2)}</p>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">Saved from DB</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center relative group">
                              <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">Refund Fee</p>
                              <p className="font-black text-red-700 text-lg">+${Math.max(0, refundFee).toFixed(2)}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                              <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">Target Qty</p>
                              <p className="font-black text-[#0066ff] text-lg">× {qty}</p>
                            </div>
                         </div>
                       </div>
                     )
                   })
                 )}
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setShowLedgerModal(false)} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-md">Close Ledger</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-2xl font-black text-gray-800">Review & Application Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 border border-gray-200 p-2 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col md:flex-row gap-8">
              
          <div className="w-full md:w-1/3 bg-gray-50 p-5 rounded-2xl border border-gray-200 shrink-0 self-start md:sticky md:top-0">
                
                <div className="bg-[#fff9e6] border border-[#ffdf7e] rounded-xl p-3 mb-5 text-center shadow-sm">
                  <p className="text-[10px] text-[#b38600] font-black uppercase tracking-widest mb-1">Task Condition</p>
                  <p className="text-base font-black text-gray-900">{selectedProduct.category || 'Need Review'}</p>
                </div>

                <img src={selectedProduct.image_url} alt="Product" className="w-full h-48 md:h-56 object-contain bg-white rounded-xl mb-5 border border-gray-100 shadow-sm p-2" />
                <div className="space-y-3 text-sm">
                  <p><span className="font-bold text-gray-500">Product:</span> <span className="font-semibold text-gray-800">{selectedProduct.product_name}</span></p>
                  <p><span className="font-bold text-gray-500">Keyword:</span> <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono font-bold text-xs">{selectedProduct.search_keyword}</span></p>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <span className="font-bold text-gray-400 block text-[10px] uppercase">Price</span> 
                      <span className="font-black text-gray-800">${selectedProduct.price}</span>
                      <span className="block text-[9px] text-gray-500 font-bold mt-0.5">~ {(parseFloat(selectedProduct.price || 0) * localCurrencyInfo.rate).toFixed(2)} {localCurrencyInfo.code}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-400 block text-[10px] uppercase">Reward</span> 
                      <span className="font-black text-green-600">${selectedProduct.reward}</span>
                      <span className="block text-[9px] text-green-600 font-bold mt-0.5">~ {(parseFloat(selectedProduct.reward || 0) * localCurrencyInfo.rate).toFixed(2)} {localCurrencyInfo.code}</span>
                    </div>
                    <p><span className="font-bold text-gray-400 block text-[10px] uppercase">Platform</span> <span className="font-bold text-gray-800">{selectedProduct.platform}</span></p>
                    <p><span className="font-bold text-gray-400 block text-[10px] uppercase">Target Qty</span> <span className="font-black text-[#0066ff]">{selectedProduct.required_orders}</span></p>
                  </div>

                  <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                    <p className="text-[10px] text-red-500 font-bold uppercase mb-1">Total Deducted (DB Record)</p>
                    <p className="text-2xl font-black text-red-600">${parseFloat(selectedProduct.total_deposit || 0).toFixed(2)} <span className="text-sm font-bold text-red-400">USD</span></p>
                    <p className="text-[10px] font-bold text-red-600 bg-red-100/50 w-max px-2 py-0.5 rounded border border-red-200 mt-1">
                      ~ {(parseFloat(selectedProduct.total_deposit || 0) * localCurrencyInfo.rate).toFixed(2)} {localCurrencyInfo.code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <h4 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                  Buyer Applications
                  <span className="bg-blue-100 text-blue-800 text-xs py-1 px-3 rounded-full font-bold">{productReviews.length} Users</span>
                </h4>
                
                {reviewsLoading ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 animate-pulse text-gray-500 font-semibold">Loading Data...</div>
                ) : productReviews.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">No one has applied yet.</div>
                ) : (
                  <div className="space-y-4">
                    {productReviews.map(review => (
                      <div key={review.application_id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-800 text-base">Buyer: {review.buyer_name}</p>
                              <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-black border border-yellow-200">
                                ⭐ {review.trust_score ? parseFloat(review.trust_score).toFixed(1) : '5.0'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Applied: {new Date(review.created_at).toLocaleDateString()}</p>
                            
                            {review.profile_link ? (
                              <a href={review.profile_link} target="_blank" rel="noreferrer" className="text-[10px] text-[#0066ff] hover:underline mt-2 inline-block font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                View Buyer Profile ↗
                              </a>
                            ) : (
                              <p className="text-[10px] text-gray-400 mt-2 italic">No profile link provided</p>
                            )}
                          </div>
                          
                          <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border tracking-wider ${getStatusColor(review.status)}`}>
                            {review.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Order Details</p>
                            <div className="flex flex-col gap-2">
                              {review.order_number ? <p className="font-mono text-gray-800 font-bold bg-white px-2 py-1 rounded border shadow-sm w-fit">{review.order_number}</p> : <p className="text-gray-400 italic text-xs">No Order ID</p>}
                              {review.screenshot_url && <a href={review.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-600 font-bold hover:underline text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-100 w-fit"><ImageIcon size={14} /> View Order Proof 1</a>}
                              {review.screenshot_url_2 && <a href={review.screenshot_url_2} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-600 font-bold hover:underline text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-100 w-fit"><ImageIcon size={14} /> View Order Proof 2</a>}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Review Details</p>
                            <div className="flex flex-col gap-2">
                              {review.review_link ? <a href={review.review_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit"><LinkIcon size={14} /> View Review Link</a> : <p className="text-gray-400 italic text-xs">No Review Link</p>}
                              {review.review_screenshot_url && <a href={review.review_screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-purple-600 font-bold hover:underline text-xs bg-purple-50 px-2 py-1 rounded border border-purple-100 w-fit"><ImageIcon size={14} /> View Review Proof 1</a>}
                              {review.review_screenshot_url_2 && <a href={review.review_screenshot_url_2} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-purple-600 font-bold hover:underline text-xs bg-purple-50 px-2 py-1 rounded border border-purple-100 w-fit"><ImageIcon size={14} /> View Review Proof 2</a>}
                            </div>
                          </div>
                        </div>

                        {(review.status === 'review_submitted' || review.status === 'forwarded_to_seller') && !review.refund_comment && (
                          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                               <p className="text-sm text-indigo-800 font-bold flex items-center gap-1.5">
                                 <Clock size={16}/> Action Required
                               </p>
                               <p className="text-xs text-indigo-600 mt-1 font-medium">Please check the details and verify. Auto-approves in 24 hours.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-3 md:mt-0">
                              <button 
                                onClick={() => {
                                  setAppealData({ application_id: review.application_id, reason: '' });
                                  setShowSellerAppealModal(true);
                                }} 
                                className="flex-1 md:flex-none bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 px-5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                              >
                                File Appeal
                              </button>
                              <button 
                                onClick={() => handleSellerApproveReview(review.application_id)} 
                                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-lg text-xs font-bold shadow-md transition-colors"
                              >
                                Approve Request
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {review.status === 'disputed' && (
                          <div className="mt-3 bg-pink-50 text-pink-700 p-3 rounded-lg text-sm font-bold border border-pink-200 flex items-center gap-2">
                            <AlertTriangle size={18}/> Under Admin Review (Disputed)
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SELLER APPEAL MODAL */}
      {showSellerAppealModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-black text-red-600 mb-3 flex items-center gap-2">
              <AlertTriangle size={24} /> File an Appeal
            </h3>
            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 font-medium">
              If the buyer provided a fake order/review or violated rules, explain the issue below. Admin will resolve the dispute.
            </p>
            <form onSubmit={handleSellerAppealSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Appeal</label>
                <textarea 
                  required 
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none bg-gray-50 focus:bg-white transition-colors" 
                  placeholder="Explain exactly what is wrong..." 
                  value={appealData.reason} 
                  onChange={(e) => setAppealData({...appealData, reason: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button type="button" onClick={() => setShowSellerAppealModal(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancel</button>
                <button type="submit" disabled={isAppealing} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-md disabled:bg-red-300 flex items-center gap-2 transition-colors">
                  {isAppealing ? 'Submitting...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-black text-gray-800 mb-6 border-b border-gray-100 pb-3">Add Funds to Wallet</h3>
            <form onSubmit={handleDeposit}>
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount ($)</label>
                <input type="number" step="0.01" min="1" required placeholder="e.g. 50.00" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0066ff] outline-none transition-colors text-lg font-bold" value={depositData.amount} onChange={(e) => setDepositData({...depositData, amount: e.target.value})} />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                <select required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0066ff] outline-none transition-colors font-semibold cursor-pointer" value={depositData.payment_method} onChange={e => handleDepositMethodChange(e.target.value)}>
                  <option value="">Select Method</option>
                  {paymentMethods.map(method => <option key={method.id} value={method.name}>{method.name}</option>)}
                </select>
              </div>

              {selectedDepositMethod && (
                <div className="space-y-4 mb-5 animate-fade-in">
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
                    <p className="text-xs text-[#0066ff] font-bold uppercase tracking-wider mb-2">Send Payment To:</p>
                    <p className="font-mono text-base font-black text-gray-800 break-all bg-white p-2 rounded border shadow-sm">
                      {paymentSettings.find(s => s.method_name === selectedDepositMethod.name)?.account_details || selectedDepositMethod.example_address || 'Details will be provided by admin'}
                    </p>
                  </div>

                  {selectedDepositMethod.requires_account_details && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Your Account Details</label>
                      <input required type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={depositData.account_details} onChange={e => setDepositData({...depositData, account_details: e.target.value})} placeholder="Your sending account details" />
                    </div>
                  )}

                  {selectedDepositMethod.requires_address && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Your Wallet Address</label>
                      <input required type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={depositData.crypto_address} onChange={e => setDepositData({...depositData, crypto_address: e.target.value})} placeholder="Your sending wallet address" />
                    </div>
                  )}

                  {selectedDepositMethod.requires_network && selectedDepositMethod.networks && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Network</label>
                      <select required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={depositData.crypto_network} onChange={e => setDepositData({...depositData, crypto_network: e.target.value})}>
                        <option value="">Select Network</option>
                        {selectedDepositMethod.networks.map(net => <option key={net.id} value={net.code}>{net.name} ({net.code})</option>)}
                      </select>
                    </div>
                  )}

                  {selectedDepositMethod.requires_memo && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Memo / Tag</label>
                      <input required type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={depositData.crypto_memo} onChange={e => setDepositData({...depositData, crypto_memo: e.target.value})} placeholder="Transaction Memo/Tag" />
                    </div>
                  )}
                </div>
              )}

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID (Trx ID)</label>
                <input type="text" required placeholder="e.g. TRX123456789" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0066ff] outline-none transition-colors" value={depositData.transaction_id} onChange={(e) => setDepositData({...depositData, transaction_id: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDepositModal(false)} className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancel</button>
                <button type="submit" disabled={isDepositing} className="px-6 py-3 bg-[#0066ff] text-white rounded-xl hover:bg-blue-700 font-bold shadow-md disabled:bg-blue-400 transition-colors">
                  {isDepositing ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-black text-gray-800 mb-6 border-b border-gray-100 pb-3 flex items-center gap-2"><Landmark className="text-red-500"/> Withdraw Funds</h3>
            <form onSubmit={handleWithdraw}>
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (USD)</label>
                <input type="number" step="0.01" max={walletBalance} required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-colors text-lg font-bold" value={withdrawData.amount} onChange={e => setWithdrawData({...withdrawData, amount: e.target.value})} />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-green-600 font-bold">Available: ${walletBalance.toFixed(2)}</p>
                  {withdrawData.amount && (
                    <p className="text-[11px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                      ~ {(Number(withdrawData.amount) * localCurrencyInfo.rate).toFixed(2)} {localCurrencyInfo.code}
                    </p>
                  )}
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">Withdrawal Method</label>
                <select required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-colors font-semibold cursor-pointer" value={withdrawData.payment_method} onChange={e => handleWithdrawMethodChange(e.target.value)}>
                  <option value="">Select Method</option>
                  {paymentMethods.map(method => <option key={method.id} value={method.name}>{method.name}</option>)}
                </select>
              </div>

              {selectedWithdrawMethod && (
                <div className="space-y-4 mb-8 animate-fade-in">
                  {selectedWithdrawMethod.requires_account_details && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{selectedWithdrawMethod.name} Account Details</label>
                      <textarea required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-24 outline-none resize-none text-sm" placeholder="Provide exact receiving details..." value={withdrawData.account_details} onChange={e => setWithdrawData({...withdrawData, account_details: e.target.value})}></textarea>
                    </div>
                  )}

                  {selectedWithdrawMethod.requires_address && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Wallet Address</label>
                      <input required type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={withdrawData.crypto_address} onChange={e => setWithdrawData({...withdrawData, crypto_address: e.target.value})} placeholder="Enter crypto wallet address" />
                    </div>
                  )}

                  {selectedWithdrawMethod.requires_network && selectedWithdrawMethod.networks && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Network</label>
                      <select required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={withdrawData.crypto_network} onChange={e => setWithdrawData({...withdrawData, crypto_network: e.target.value})}>
                        <option value="">Select Network</option>
                        {selectedWithdrawMethod.networks.map(net => <option key={net.id} value={net.code}>{net.name} ({net.code})</option>)}
                      </select>
                    </div>
                  )}

                  {selectedWithdrawMethod.requires_memo && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Memo / Tag</label>
                      <input required type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={withdrawData.crypto_memo} onChange={e => setWithdrawData({...withdrawData, crypto_memo: e.target.value})} placeholder="Enter Memo/Tag" />
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancel</button>
                <button type="submit" disabled={isWithdrawing} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-md disabled:bg-red-300 transition-colors">
                  {isWithdrawing ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAILS MODAL */}
      {showTrxDetailsModal && selectedTrx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 capitalize">
                <Wallet size={24} className={trxType === 'deposit' ? 'text-green-500' : 'text-red-500'}/> {trxType} Details
              </h3>
              <button onClick={() => setShowTrxDetailsModal(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-1.5 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <p className="flex justify-between items-center"><span className="font-bold text-gray-500">Amount:</span> <span className={`font-black text-2xl ${trxType === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>${Number(selectedTrx.amount).toFixed(2)}</span></p>
              <div className="w-full h-px bg-gray-200"></div>
              <p className="flex justify-between items-center"><span className="font-bold text-gray-500">Method:</span> <span className="font-bold bg-white px-3 py-1 rounded shadow-sm border border-gray-100">{selectedTrx.payment_method}</span></p>
              <div className="w-full h-px bg-gray-200"></div>
              
              {trxType === 'withdrawal' && selectedTrx.account_details && (
                <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-sm">
                  <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider mb-1.5">To Account:</span>
                  <span className="font-mono text-sm font-medium break-all">{selectedTrx.account_details}</span>
                </div>
              )}

              {(selectedTrx.transaction_id || selectedTrx.screenshot_url) && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-3 shadow-sm">
                  <p className="font-black text-blue-800 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1"><ShieldCheck size={14}/> Payment Proof</p>
                  {selectedTrx.transaction_id && (
                     <div className="mb-3">
                       <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Trx ID:</p>
                       <p className="font-mono bg-white px-2 py-1.5 border border-blue-200 rounded font-bold text-gray-800 break-all">{selectedTrx.transaction_id}</p>
                     </div>
                  )}
                  {selectedTrx.screenshot_url && (
                     <a href={selectedTrx.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-[#0066ff] font-bold hover:bg-blue-100 text-sm bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm transition-colors">
                       <ImageIcon size={16} /> View Attached Image
                     </a>
                  )}
                </div>
              )}
              
              <div className="w-full h-px bg-gray-200"></div>
              <p className="flex justify-between items-center"><span className="font-bold text-gray-500">Date:</span> <span className="font-medium">{new Date(selectedTrx.created_at).toLocaleString()}</span></p>
              <div className="w-full h-px bg-gray-200"></div>
              <p className="flex justify-between items-center"><span className="font-bold text-gray-500">Status:</span> 
                 <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${selectedTrx.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : selectedTrx.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{selectedTrx.status}</span>
              </p>
            </div>
            
            <div className="mt-6">
              <button onClick={() => setShowTrxDetailsModal(false)} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-md">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-gray-800 mb-4 border-b border-gray-100 pb-3">Edit Product</h3>
            <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 font-semibold p-4 rounded-xl mb-6 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-yellow-600"/>
              Note: For wallet security, product price, reward, or quota cannot be edited. To change them, please cancel the product and relist.
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div><label className="text-sm font-bold text-gray-700 mb-2 block">Product Name</label><input type="text" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors" value={editFormData.product_name} onChange={e => setEditFormData({...editFormData, product_name: e.target.value})} /></div>
              
              <div><label className="text-sm font-bold text-gray-700 mb-2 block">Product Link</label><input type="url" required pattern="https?://.+" title="Must be a valid HTTP/HTTPS URL" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors" value={editFormData.product_link} onChange={e => setEditFormData({...editFormData, product_link: e.target.value})} /></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-sm font-bold text-gray-700 mb-2 block">Store Name</label><input type="text" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors" value={editFormData.store_name} onChange={e => setEditFormData({...editFormData, store_name: e.target.value})} /></div>
                <div><label className="text-sm font-bold text-gray-700 mb-2 block">Search Keyword</label><input type="text" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors" value={editFormData.search_keyword} onChange={e => setEditFormData({...editFormData, search_keyword: e.target.value})} /></div>
              </div>
              <div><label className="text-sm font-bold text-gray-700 mb-2 block">Instructions for Buyer</label><textarea required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-28 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors resize-none" value={editFormData.instructions} onChange={e => setEditFormData({...editFormData, instructions: e.target.value})}></textarea></div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isEditing} className="px-6 py-3 bg-[#0066ff] text-white rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎧 CREATE TICKET MODAL */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Headset size={24} className="text-[#0066ff]"/> Create Support Ticket
              </h3>
              <button onClick={() => setShowCreateTicketModal(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-1.5 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                <input required type="text" className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:border-[#0066ff] focus:ring-2 focus:ring-blue-100 outline-none transition-all" value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} placeholder="What do you need help with?" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                <textarea required maxLength="500" className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:border-[#0066ff] focus:ring-2 focus:ring-blue-100 outline-none h-36 resize-none transition-all" value={ticketForm.message} onChange={e => setTicketForm({...ticketForm, message: e.target.value})} placeholder="Describe your issue in detail..."></textarea>
                <div className="flex justify-between items-center mt-2 px-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Be as clear as possible.</p>
                  <p className={`text-[10px] font-black ${ticketForm.message.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {ticketForm.message.length}/500
                  </p>
                </div>
              </div>
              <button type="submit" disabled={isSubmittingTicket} className="w-full py-4 bg-[#0066ff] text-white rounded-xl font-bold text-base shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
                {isSubmittingTicket ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 💬 VIEW & REPLY TICKET MODAL */}
      {showTicketViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
               <div>
                  <h3 className="font-black text-gray-800 text-lg line-clamp-1 pr-4">{selectedTicket.subject}</h3>
                  <span className={`px-2.5 py-0.5 mt-1.5 inline-block rounded border text-[9px] font-black uppercase tracking-wider shadow-sm ${
                     selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                     selectedTicket.status === 'answered' ? 'bg-green-100 text-green-700 border-green-200' :
                     'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                     Status: {selectedTicket.status}
                  </span>
               </div>
               <button onClick={() => setShowTicketViewModal(false)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm border border-gray-100 p-2 rounded-full shrink-0 transition-colors"><X size={20} /></button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 relative custom-scrollbar">
               
               {/* Main Ticket Message (User) */}
               <div className="flex flex-col items-end">
                  <div className="max-w-[85%] bg-[#0066ff] text-white p-4 rounded-2xl rounded-tr-sm shadow-md text-sm break-words leading-relaxed">
                     {selectedTicket.message}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1.5 font-semibold px-1">{new Date(selectedTicket.created_at).toLocaleString()}</span>
               </div>

               {repliesLoading ? (
                 <div className="text-center text-xs text-blue-500 font-bold py-6 animate-pulse">Loading replies...</div>
               ) : (
                 ticketReplies.map(reply => (
                   <div key={reply.id} className={`flex flex-col ${reply.user_role === 'admin' ? 'items-start' : 'items-end'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm break-words leading-relaxed ${
                        reply.user_role === 'admin' 
                          ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-200 shadow-md' 
                          : 'bg-[#0066ff] text-white rounded-tr-sm shadow-md'
                      }`}>
                         {reply.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1.5 font-semibold px-1">
                         {reply.user_role === 'admin' ? <span className="font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Admin</span> : 'You'} • {new Date(reply.created_at).toLocaleString()}
                      </span>
                   </div>
                 ))
               )}
            </div>

            {/* Reply Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white">
               {selectedTicket.status === 'closed' ? (
                  <div className="text-center py-3 text-sm font-bold text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    This ticket is permanently closed.
                  </div>
               ) : (
                  <form onSubmit={handleReplyTicket} className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-[#0066ff] focus-within:bg-white transition-all shadow-sm">
                    <div className="flex-1 relative">
                      <input 
                         type="text" 
                         required 
                         maxLength="500"
                         value={replyMessage}
                         onChange={e => setReplyMessage(e.target.value)}
                         placeholder="Type your reply here..." 
                         className="w-full py-3 px-4 bg-transparent text-sm outline-none font-medium"
                      />
                    </div>
                    <button type="submit" disabled={isSubmittingTicket} className="bg-[#0066ff] text-white p-3 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0">
                       <Send size={20} className={isSubmittingTicket ? 'animate-pulse' : ''} />
                    </button>
                  </form>
               )}
            </div>

          </div>
        </div>
      )}

      {/* FULL IMAGE LIGHTBOX */}
      {showFullImageModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setShowFullImageModal(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-red-500 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors"
            onClick={() => setShowFullImageModal(false)}
          >
            <X size={32}/>
          </button>
          <img 
            src={fullImageUrl} 
            alt="Full Product" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/20 cursor-default" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}