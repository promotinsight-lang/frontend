import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AddProduct from '../components/AddProduct';
import { 
  Package, PlusCircle, LayoutDashboard, Wallet, Clock,
  Eye, Edit, XCircle, Link as LinkIcon, Image as ImageIcon, Landmark, X, Receipt, AlertTriangle, Scale, CheckCircle,
  Headset, MessageCircle, Send, History
} from 'lucide-react';

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

export default function SellerDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState([]); 
  const [depositData, setDepositData] = useState({ amount: '', payment_method: 'PayPal', transaction_id: '' });
  const [isDepositing, setIsDepositing] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawData, setWithdrawData] = useState({ amount: '', payment_method: 'Bank', account_details: '' });
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]); 
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const [showSellerAppealModal, setShowSellerAppealModal] = useState(false);
  const [appealData, setAppealData] = useState({ application_id: '', reason: '' });
  const [isAppealing, setIsAppealing] = useState(false);
  const [myAppeals, setMyAppeals] = useState([]);

  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState('');

  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [refunds, setRefunds] = useState([]); 
  const [fundHistoryTab, setFundHistoryTab] = useState('withdrawals');
  
  const [showTrxDetailsModal, setShowTrxDetailsModal] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [trxType, setTrxType] = useState('');

  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const [supportTickets, setSupportTickets] = useState([]);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplies, setTicketReplies] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [showTicketViewModal, setShowTicketViewModal] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

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
      if (profileData.success) setWalletBalance(parseFloat(profileData.user.wallet_balance) || 0);

      const productsRes = await secureFetch('https://backend-6aiq.onrender.com/api/products/my', { headers: authHeaders });
      const productsData = await productsRes.json();
      if (productsData.success) setProducts(productsData.data);

      const settingsRes = await secureFetch('https://backend-6aiq.onrender.com/api/users/payment-settings', { headers: authHeaders });
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data.length > 0) {
        setPaymentSettings(settingsData.data);
        setDepositData(prev => ({ ...prev, payment_method: settingsData.data[0].method_name }));
      }

      try {
        const wRes = await secureFetch('https://backend-6aiq.onrender.com/api/withdrawals/my', { headers: authHeaders });
        const wData = await wRes.json();
        if (wData.success) setWithdrawals(wData.data);
      } catch(e) {}

      try {
        const dRes = await secureFetch('https://backend-6aiq.onrender.com/api/users/deposits', { headers: authHeaders });
        const dData = await dRes.json();
        if (dData.success) setDeposits(dData.data);
      } catch(e) {}

      try {
        const rRes = await secureFetch('https://backend-6aiq.onrender.com/api/products/refunds/my', { headers: authHeaders });
        const rData = await rRes.json();
        if (rData.success) setRefunds(rData.data);
      } catch(e) {}

      try {
        const aRes = await secureFetch('https://backend-6aiq.onrender.com/api/appeals/my', { headers: authHeaders });
        const aData = await aRes.json();
        if (aData.success) setMyAppeals(aData.data);
      } catch(e) {}

      try {
        const tRes = await secureFetch('https://backend-6aiq.onrender.com/api/support/my', { headers: authHeaders });
        const tData = await tRes.json();
        if (tData.success) setSupportTickets(tData.data);
      } catch(e) {}

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

      <div className="bg-[#0066ff] px-4 pt-4 pb-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Seller Dashboard</h1>
          <p className="text-xs md:text-sm text-blue-100 opacity-90 mt-0.5">Manage your products and sales</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex items-center justify-between gap-4 w-full md:w-auto min-w-[260px] shadow-sm">
          <div>
            <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Wallet Balance</p>
            <p className="text-xl md:text-2xl font-black">${walletBalance.toFixed(2)}</p>
          </div>
          
          <button 
            onClick={() => setShowLedgerModal(true)} 
            className="bg-white text-[#0066ff] p-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex flex-col items-center justify-center gap-0.5 group min-w-[60px]"
            title="View Deduction History"
          >
             <Receipt size={18} className="group-hover:scale-110 transition-transform"/>
             <span className="text-[8px] font-extrabold uppercase tracking-wider">Ledger</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 animate-fade-in">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-gray-700 font-bold mb-2">My Listed Products</h2>
            {loading ? (
              <p className="text-gray-500 animate-pulse text-center py-10">Loading data...</p>
            ) : products.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">You don't have any active products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    
                    <div 
                      className="relative group cursor-pointer bg-gray-50" 
                      onClick={() => { setFullImageUrl(product.image_url); setShowFullImageModal(true); }}
                    >
                      <img src={product.image_url} alt="Product" className="w-full h-40 object-cover" />
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
            <h2 className="text-gray-700 font-bold mb-2">Quota & Review Tracking</h2>
            {products.filter(p => p.status === 'approved' || p.status === 'stopped').map(product => (
              <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
                <img src={product.image_url} alt="Product" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 line-clamp-1">{product.product_name}</h3>
                    {product.status === 'stopped' && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-orange-200">Stopped</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Total Quota</p>
                      <p className="text-lg font-black text-gray-700">{product.required_orders}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                      <p className="text-[10px] text-blue-500 font-bold uppercase">Applications</p>
                      <p className="text-lg font-black text-blue-700">{product.application_count || 0}</p>
                    </div>
                    <div className="flex items-center justify-center">
                       <button onClick={() => openViewModal(product)} className="text-[#0066ff] text-sm font-bold flex items-center gap-1 hover:underline"><Eye size={16}/> View Reviews</button>
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
            <h2 className="text-gray-700 font-bold mb-2">Fund Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between items-center text-center">
                <div className="w-16 h-16 bg-blue-50 text-[#0066ff] rounded-full flex items-center justify-center mb-4"><Wallet size={32}/></div>
                <h3 className="font-bold text-gray-800 mb-1">Add Funds to Wallet</h3>
                <p className="text-xs text-gray-500 mb-6">Deposit is required to list new products.</p>
                <button onClick={() => setShowDepositModal(true)} className="w-full bg-[#0066ff] text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors">+ Deposit Funds</button>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><Landmark size={32}/></div>
                <h3 className="font-bold text-gray-800 mb-1">Withdraw Funds</h3>
                <p className="text-xs text-gray-500 mb-6">Withdraw your remaining wallet balance.</p>
                <button onClick={() => setShowWithdrawModal(true)} className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors">Request Withdrawal</button>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Transaction History</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setFundHistoryTab('withdrawals')} 
                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${fundHistoryTab === 'withdrawals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Withdrawals
                  </button>
                  <button 
                    onClick={() => setFundHistoryTab('deposits')} 
                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${fundHistoryTab === 'deposits' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Deposits
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                 {fundHistoryTab === 'withdrawals' && withdrawals.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No withdrawal records found.</p>}
                 {fundHistoryTab === 'withdrawals' && withdrawals.map(w => (
                   <div key={w.id} className="flex justify-between items-center p-3 border border-gray-100 bg-gray-50 rounded-lg">
                     <div>
                       <p className="font-bold text-gray-800">${Number(w.amount).toFixed(2)} <span className="text-xs text-gray-500 font-normal">via {w.payment_method}</span></p>
                       <p className="text-[10px] text-gray-400 mt-0.5">{new Date(w.created_at).toLocaleString()}</p>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${w.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : w.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                         {w.status}
                       </span>
                       <button onClick={() => { setSelectedTrx(w); setTrxType('withdrawal'); setShowTrxDetailsModal(true); }} className="text-[#0066ff] hover:underline text-[10px] font-bold flex items-center gap-1 mt-1">
                         <Eye size={12}/> View Details
                       </button>
                     </div>
                   </div>
                 ))}

                 {fundHistoryTab === 'deposits' && deposits.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No deposit records found.</p>}
                 {fundHistoryTab === 'deposits' && deposits.map(d => (
                   <div key={d.id} className="flex justify-between items-center p-3 border border-gray-100 bg-gray-50 rounded-lg">
                     <div>
                       <p className="font-bold text-gray-800">${Number(d.amount).toFixed(2)} <span className="text-xs text-gray-500 font-normal">via {d.payment_method}</span></p>
                       <p className="text-[10px] text-gray-400 mt-0.5">{new Date(d.created_at).toLocaleString()}</p>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${d.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : d.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                         {d.status}
                       </span>
                       <button onClick={() => { setSelectedTrx(d); setTrxType('deposit'); setShowTrxDetailsModal(true); }} className="text-[#0066ff] hover:underline text-[10px] font-bold flex items-center gap-1 mt-1">
                         <Eye size={12}/> View Details
                       </button>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* REFUNDS TAB FOR SELLER */}
        {activeTab === 'refunds' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-gray-700 font-bold flex items-center gap-2">
                  <History className="text-red-500" />
                  Product Deletion Refunds
               </h2>
               <span className="bg-red-100 text-red-800 text-xs py-1 px-3 rounded-full font-bold border border-red-200">{refunds.length} Logs</span>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="space-y-4">
                  {refunds.length === 0 ? (
                     <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        No product refund logs found.
                     </div>
                  ) : (
                     refunds.map(r => (
                        <div key={r.id} className="flex justify-between items-center p-4 border border-red-100 bg-red-50/30 rounded-lg hover:shadow-sm transition-all">
                           <div>
                              <p className="font-bold text-gray-800 text-sm">{r.description}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                           </div>
                           <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                              <span className="font-black text-lg text-green-600">+${Number(r.amount).toFixed(2)}</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase border bg-green-100 text-green-700 border-green-200">
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
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-gray-700 font-bold">My Appeals</h2>
               <span className="bg-blue-100 text-blue-800 text-xs py-1 px-3 rounded-full font-bold">{myAppeals.length} Appeals</span>
            </div>
            
            {loading ? (
              <p className="text-gray-500 animate-pulse text-center py-10">Loading appeals...</p>
            ) : myAppeals.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
                <Scale size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">You have not submitted any appeals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myAppeals.map(appeal => (
                  <div key={appeal.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                      <div>
                         <p className="font-bold text-gray-800 flex items-center gap-2">
                           Application ID: #{appeal.application_id}
                         </p>
                         <p className="text-[10px] text-gray-500 mt-1">{new Date(appeal.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                        appeal.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                        appeal.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {appeal.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Your Reason</p>
                      <p className="text-sm text-gray-700">{appeal.reason}</p>
                    </div>

                    {appeal.status === 'approved' && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-start gap-2">
                         <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                         <div>
                            <p className="text-xs font-bold text-green-800 mb-0.5">Appeal Accepted</p>
                            <p className="text-xs text-green-700">Your appeal was accepted by Admin, and no funds were deducted from your escrow.</p>
                         </div>
                      </div>
                    )}

                    {appeal.status === 'rejected' && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
                         <XCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                         <div>
                            <p className="text-xs font-bold text-red-800 mb-0.5">Appeal Rejected</p>
                            <p className="text-xs text-red-700">{appeal.admin_reply || "Admin has rejected this appeal and processed the refund for the buyer."}</p>
                         </div>
                      </div>
                    )}
                    
                    {appeal.status === 'pending' && (
                       <p className="text-xs text-yellow-600 font-semibold italic flex items-center gap-1">
                          <Clock size={14}/> Admin is currently reviewing this appeal.
                       </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUPPORT TAB */}
        {!loading && activeTab === 'support' && (
          <div className="space-y-6 animate-fade-in">
             <button 
                onClick={() => setShowCreateTicketModal(true)} 
                className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
             >
               <PlusCircle size={20} /> Create New Ticket
             </button>

             <div className="space-y-4">
                {supportTickets.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <Headset size={48} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Need Help?</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Open a ticket and our support team will get back to you as soon as possible.</p>
                  </div>
                ) : (
                  supportTickets.map((ticket) => (
                    <div 
                       key={ticket.id} 
                       onClick={() => openTicketView(ticket)}
                       className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all flex items-start gap-4"
                    >
                      <div className={`p-3 rounded-full shrink-0 ${ticket.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-[#0066ff]'}`}>
                        <MessageCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-gray-800 line-clamp-1">{ticket.subject}</h4>
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                             ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                             ticket.status === 'answered' ? 'bg-green-100 text-green-700 border border-green-200' :
                             'bg-gray-100 text-gray-600 border border-gray-200'
                           }`}>
                             {ticket.status}
                           </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{ticket.message}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Last updated: {new Date(ticket.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

      </div>

      {/* 🔥 LEDGER MODAL - UPDATED WITH DYNAMIC DB FEE 🔥 */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Receipt className="text-[#0066ff]" /> Product Deduction Ledger
              </h3>
              <button onClick={() => setShowLedgerModal(false)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm border border-gray-100 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 shadow-sm">
                <h4 className="font-bold text-blue-800 text-sm mb-1">How is the deduction calculated?</h4>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  When you list a product, the system safely holds funds in escrow. The formula is: <br/>
                  <strong className="bg-white px-2 py-1 rounded inline-block mt-2 border border-blue-200 shadow-sm text-[#0066ff]">
                    (Product Price + Buyer Reward + Platform Tariff + Refund Fee) × Target Quantity
                  </strong>
                </p>
              </div>

              <div className="space-y-5">
                 {products.filter(p => p.status !== 'rejected').length === 0 ? (
                   <p className="text-center text-gray-500 py-10 font-semibold border border-dashed border-gray-300 rounded-xl">No active product deductions found.</p>
                 ) : (
                   products.filter(p => p.status !== 'rejected').map(p => {
                     const price = parseFloat(p.price) || 0;
                     const reward = parseFloat(p.reward) || 0;
                     const qty = parseInt(p.required_orders) || 1;
                     const costPerOrder = price + reward;
                     
                     // Use the exact deducted values from the database
                     const commission = parseFloat(p.platform_fee_charged) || 0;
                     const totalDeducted = parseFloat(p.total_deposit) || 0;
                     
                     // Back-calculate the refund fee mathematically
                     const refundFee = (totalDeducted / qty) - costPerOrder - commission;

                     return (
                       <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                         <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                             <img src={p.image_url} className="w-12 h-12 object-contain rounded border bg-white p-1" alt="product"/>
                             <div>
                               <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{p.product_name || p.store_name}</h4>
                               <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border mt-1 inline-block ${getStatusColor(p.status)}`}>{p.status}</span>
                             </div>
                           </div>
                           <div className="text-right shrink-0">
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Deducted</p>
                             <p className="text-xl font-black text-red-500">-${totalDeducted.toFixed(2)}</p>
                           </div>
                         </div>
                         
                         <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm bg-white">
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-center">
                              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Unit Price</p>
                              <p className="font-black text-gray-800">${price.toFixed(2)}</p>
                            </div>
                            <div className="bg-green-50 p-2.5 rounded-lg border border-green-100 text-center">
                              <p className="text-green-600 text-[10px] font-bold uppercase tracking-wider mb-1">Buyer Reward</p>
                              <p className="font-black text-green-700">+${reward.toFixed(2)}</p>
                            </div>
                            <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-100 text-center relative group">
                              <p className="text-orange-600 text-[10px] font-bold uppercase tracking-wider mb-1">Platform Fee</p>
                              <p className="font-black text-orange-700">+${commission.toFixed(2)}</p>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">Fixed Tariff or %</div>
                            </div>
                            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 text-center relative group">
                              <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1">Refund Fee</p>
                              <p className="font-black text-red-700">+${Math.max(0, refundFee).toFixed(2)}</p>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">Fee on (Price + Reward)</div>
                            </div>
                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 text-center">
                              <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1">Target Qty</p>
                              <p className="font-black text-[#0066ff]">× {qty}</p>
                            </div>
                         </div>
                       </div>
                     )
                   })
                 )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setShowLedgerModal(false)} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-md">Close Ledger</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-gray-800">Review & Application Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-red-500 font-bold text-xl px-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col md:flex-row gap-6">
              
              <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-xl border border-gray-200 self-start sticky top-0">
                
                <div className="bg-[#fff9e6] border border-[#ffdf7e] rounded-lg p-2 mb-4 text-center shadow-sm">
                  <p className="text-[10px] text-[#b38600] font-black uppercase tracking-widest mb-0.5">Task Condition</p>
                  <p className="text-sm font-black text-gray-900">{selectedProduct.category || 'Need Review'}</p>
                </div>

                <img src={selectedProduct.image_url} alt="Product" className="w-full h-40 object-contain bg-white rounded-lg mb-4 border shadow-sm" />
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-gray-700">Product:</span> {selectedProduct.product_name}</p>
                  <p><span className="font-semibold text-gray-700">Keyword:</span> <span className="bg-yellow-100 text-yellow-800 px-1 rounded font-bold">{selectedProduct.search_keyword}</span></p>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                    <p><span className="font-semibold">Price:</span> ${selectedProduct.price}</p>
                    <p><span className="font-semibold">Reward:</span> ${selectedProduct.reward}</p>
                    <p><span className="font-semibold">Platform:</span> {selectedProduct.platform}</p>
                    <p><span className="font-semibold">Target:</span> {selectedProduct.required_orders}</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  Buyer Applications
                  <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded-full font-bold">{productReviews.length} Users</span>
                </h4>
                
                {reviewsLoading ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border animate-pulse text-gray-500 font-semibold">Loading Data...</div>
                ) : productReviews.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">No one has applied yet.</div>
                ) : (
                  <div className="space-y-4">
                    {productReviews.map(review => (
                      <div key={review.application_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
                        
                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-800 text-sm">Buyer: {review.buyer_name}</p>
                              <span className="bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold border border-yellow-200">
                                ⭐ {review.trust_score ? parseFloat(review.trust_score).toFixed(1) : '5.0'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">Applied: {new Date(review.created_at).toLocaleDateString()}</p>
                            
                            {review.profile_link ? (
                              <a href={review.profile_link} target="_blank" rel="noreferrer" className="text-[10px] text-[#0066ff] hover:underline mt-1 inline-block font-bold bg-blue-50 px-2 py-0.5 rounded">
                                View Buyer Profile ↗
                              </a>
                            ) : (
                              <p className="text-[10px] text-gray-400 mt-1 italic">No profile link provided</p>
                            )}
                          </div>
                          
                          <span className={`px-2 py-1 text-[10px] font-black uppercase rounded border ${getStatusColor(review.status)}`}>
                            {review.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                          <div className="bg-gray-50 p-2 rounded-lg border">
                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Order Details</p>
                            <div className="flex flex-wrap gap-2 items-center">
                              {review.order_number ? <p className="font-mono text-gray-800 font-bold text-xs">{review.order_number}</p> : <p className="text-gray-400 italic text-xs">No Order ID</p>}
                              {review.screenshot_url && <a href={review.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-600 font-bold hover:underline text-xs"><ImageIcon size={12} /> Image</a>}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded-lg border">
                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Review Details</p>
                            <div className="flex flex-wrap gap-2 items-center">
                              {review.review_link ? <a href={review.review_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 font-bold hover:underline text-xs"><LinkIcon size={12} /> Link</a> : <p className="text-gray-400 italic text-xs">No Review Link</p>}
                              {review.review_screenshot_url && <a href={review.review_screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-600 font-bold hover:underline text-xs"><ImageIcon size={12} /> Image</a>}
                            </div>
                          </div>
                        </div>

                        {(review.status === 'review_submitted' || review.status === 'forwarded_to_seller') && !review.refund_comment && (
                          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3">
                            <div>
                               <p className="text-xs text-indigo-800 font-bold flex items-center gap-1">
                                 <Clock size={14}/> Action Required
                               </p>
                               <p className="text-[10px] text-indigo-600 mt-0.5">Please check the details and verify. This auto-approves in 24 hours.</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                              <button 
                                onClick={() => {
                                  setAppealData({ application_id: review.application_id, reason: '' });
                                  setShowSellerAppealModal(true);
                                }} 
                                className="flex-1 md:flex-none bg-white border border-red-200 text-red-600 hover:bg-red-50 py-1.5 px-4 rounded text-xs font-bold transition-colors shadow-sm"
                              >
                                File Appeal
                              </button>
                              <button 
                                onClick={() => handleSellerApproveReview(review.application_id)} 
                                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-4 rounded text-xs font-bold shadow-sm transition-colors"
                              >
                                Approve Request
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {review.status === 'disputed' && (
                          <div className="mt-2 bg-pink-50 text-pink-700 p-2 rounded text-xs font-bold border border-pink-200 flex items-center gap-1">
                            <AlertTriangle size={14}/> Under Admin Review (Disputed)
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} /> File an Appeal
            </h3>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              If the buyer provided a fake order/review or violated rules, explain the issue below. Admin will resolve the dispute.
            </p>
            <form onSubmit={handleSellerAppealSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Appeal</label>
                <textarea 
                  required 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none h-28 resize-none" 
                  placeholder="Explain exactly what is wrong..." 
                  value={appealData.reason} 
                  onChange={(e) => setAppealData({...appealData, reason: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setShowSellerAppealModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold">Cancel</button>
                <button type="submit" disabled={isAppealing} className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-md disabled:bg-red-300 flex items-center gap-2">
                  {isAppealing ? 'Submitting...' : 'Submit Appeal to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Add Funds to Wallet</h3>
            <form onSubmit={handleDeposit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" min="1" required placeholder="e.g. 50.00" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#0066ff] outline-none" value={depositData.amount} onChange={(e) => setDepositData({...depositData, amount: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Payment Method</label>
                <select className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#0066ff] outline-none" value={depositData.payment_method} onChange={e => setDepositData({...depositData, payment_method: e.target.value})}>
                  {paymentSettings.map(setting => <option key={setting.id} value={setting.method_name}>{setting.method_name}</option>)}
                </select>
              </div>
              <div className="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-xs text-[#0066ff] font-bold uppercase mb-1">Send Payment To:</p>
                <p className="font-mono text-sm font-bold text-gray-800 break-all">{paymentSettings.find(s => s.method_name === depositData.payment_method)?.account_details || 'Loading...'}</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction ID (Trx ID)</label>
                <input type="text" required placeholder="e.g. TRX123456789" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#0066ff] outline-none" value={depositData.transaction_id} onChange={(e) => setDepositData({...depositData, transaction_id: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDepositModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold">Cancel</button>
                <button type="submit" disabled={isDepositing} className="px-5 py-2.5 bg-[#0066ff] text-white rounded-xl hover:bg-blue-700 font-bold shadow-md disabled:bg-blue-400">
                  {isDepositing ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Withdraw Request</h3>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Amount ($)</label>
                <input type="number" step="0.01" max={walletBalance} required className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none" value={withdrawData.amount} onChange={e => setWithdrawData({...withdrawData, amount: e.target.value})} />
                <p className="text-xs text-green-600 font-bold mt-1">Available: ${walletBalance.toFixed(2)}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Withdrawal Method</label>
                <select className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none" value={withdrawData.payment_method} onChange={e => setWithdrawData({...withdrawData, payment_method: e.target.value})}>
                  <option value="Bank">Bank Transfer</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Crypto">Crypto (USDT)</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1">Account Details</label>
                <textarea required className="w-full p-3 border rounded-xl h-24 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Provide bank/paypal details..." value={withdrawData.account_details} onChange={e => setWithdrawData({...withdrawData, account_details: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="px-5 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold">Cancel</button>
                <button type="submit" disabled={isWithdrawing} className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-md disabled:bg-red-300">
                  {isWithdrawing ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAILS MODAL */}
      {showTrxDetailsModal && selectedTrx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 capitalize">
                <Wallet size={20} className={trxType === 'deposit' ? 'text-green-500' : 'text-red-500'}/> {trxType} Details
              </h3>
              <button onClick={() => setShowTrxDetailsModal(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="flex justify-between"><span className="font-bold text-gray-500">Amount:</span> <span className={`font-black text-lg ${trxType === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>${Number(selectedTrx.amount).toFixed(2)}</span></p>
              <div className="w-full h-px bg-gray-200"></div>
              <p className="flex justify-between"><span className="font-bold text-gray-500">Method:</span> <span className="font-semibold">{selectedTrx.payment_method}</span></p>
              <div className="w-full h-px bg-gray-200"></div>
              
              {trxType === 'withdrawal' && selectedTrx.account_details && (
                <>
                  <div className="bg-white p-2 border rounded">
                    <span className="font-bold text-gray-500 block text-xs mb-1">To Account:</span>
                    <span className="font-mono text-xs break-all">{selectedTrx.account_details}</span>
                  </div>
                </>
              )}

              {(selectedTrx.transaction_id || selectedTrx.screenshot_url) && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded mt-2">
                  <p className="font-bold text-blue-800 text-xs mb-2 uppercase border-b border-blue-200 pb-1">Payment Proof</p>
                  {selectedTrx.transaction_id && (
                     <p className="text-xs mb-2"><span className="font-semibold text-gray-600">Trx ID:</span> <span className="font-mono bg-white px-1 border rounded font-bold text-gray-800">{selectedTrx.transaction_id}</span></p>
                  )}
                  {selectedTrx.screenshot_url && (
                     <a href={selectedTrx.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#0066ff] font-bold hover:underline text-xs bg-white px-2 py-1 rounded border border-blue-200 w-max shadow-sm">
                       <ImageIcon size={14} /> View Screenshot
                     </a>
                  )}
                </div>
              )}
              
              <div className="w-full h-px bg-gray-200"></div>
              <p className="flex justify-between"><span className="font-bold text-gray-500">Date:</span> <span>{new Date(selectedTrx.created_at).toLocaleString()}</span></p>
              <div className="w-full h-px bg-gray-200"></div>
              <p className="flex justify-between items-center"><span className="font-bold text-gray-500">Status:</span> 
                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${selectedTrx.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : selectedTrx.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{selectedTrx.status}</span>
              </p>
            </div>
            
            <div className="mt-6">
              <button onClick={() => setShowTrxDetailsModal(false)} className="w-full bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl hover:bg-gray-300 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Edit Product</h3>
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 font-semibold p-3 rounded-xl mb-4">Note: For wallet security, product price, reward, or quota cannot be edited. To change them, please cancel the product and relist.</p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div><label className="text-sm font-semibold mb-1 block">Product Name</label><input type="text" required className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={editFormData.product_name} onChange={e => setEditFormData({...editFormData, product_name: e.target.value})} /></div>
              
              <div><label className="text-sm font-semibold mb-1 block">Product Link</label><input type="url" required pattern="https?://.+" title="Must be a valid HTTP/HTTPS URL" className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={editFormData.product_link} onChange={e => setEditFormData({...editFormData, product_link: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold mb-1 block">Store Name</label><input type="text" required className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={editFormData.store_name} onChange={e => setEditFormData({...editFormData, store_name: e.target.value})} /></div>
                <div><label className="text-sm font-semibold mb-1 block">Search Keyword</label><input type="text" required className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={editFormData.search_keyword} onChange={e => setEditFormData({...editFormData, search_keyword: e.target.value})} /></div>
              </div>
              <div><label className="text-sm font-semibold mb-1 block">Instructions for Buyer</label><textarea required className="w-full p-3 border rounded-xl h-24 outline-none focus:ring-2 focus:ring-blue-500" value={editFormData.instructions} onChange={e => setEditFormData({...editFormData, instructions: e.target.value})}></textarea></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 bg-gray-100 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isEditing} className="px-5 py-2.5 bg-[#0066ff] text-white rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:bg-blue-400">
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎧 CREATE TICKET MODAL */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Headset size={20} className="text-[#0066ff]"/> Create Support Ticket
              </h3>
              <button onClick={() => setShowCreateTicketModal(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
                <input required type="text" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0066ff] outline-none" value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} placeholder="What do you need help with?" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Message</label>
                <textarea required maxLength="500" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0066ff] outline-none h-32 resize-none" value={ticketForm.message} onChange={e => setTicketForm({...ticketForm, message: e.target.value})} placeholder="Describe your issue in detail..."></textarea>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-gray-400">Please provide clear details.</p>
                  <p className={`text-[10px] font-bold ${ticketForm.message.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {ticketForm.message.length}/500
                  </p>
                </div>
              </div>
              <button type="submit" disabled={isSubmittingTicket} className="w-full py-3.5 bg-[#0066ff] text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
                {isSubmittingTicket ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 💬 VIEW & REPLY TICKET MODAL */}
      {showTicketViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
            
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-1 pr-2">{selectedTicket.subject}</h3>
                  <span className={`px-2 py-0.5 mt-1 inline-block rounded text-[10px] font-bold uppercase tracking-wider ${
                     selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                     selectedTicket.status === 'answered' ? 'bg-green-100 text-green-700' :
                     'bg-gray-200 text-gray-600'
                  }`}>
                     Status: {selectedTicket.status}
                  </span>
               </div>
               <button onClick={() => setShowTicketViewModal(false)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm rounded-full p-1 border border-gray-200 shrink-0"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white relative">
               <div className="flex flex-col items-end">
                  <div className="max-w-[85%] bg-[#0066ff] text-white p-3 rounded-2xl rounded-tr-sm shadow-sm text-sm break-words">
                     {selectedTicket.message}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">{new Date(selectedTicket.created_at).toLocaleString()}</span>
               </div>

               {repliesLoading ? (
                 <div className="text-center text-xs text-gray-400 py-4 animate-pulse">Loading replies...</div>
               ) : (
                 ticketReplies.map(reply => (
                   <div key={reply.id} className={`flex flex-col ${reply.user_role === 'admin' ? 'items-start' : 'items-end'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm break-words ${
                        reply.user_role === 'admin' 
                          ? 'bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200' 
                          : 'bg-[#0066ff] text-white rounded-tr-sm'
                      }`}>
                         {reply.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                         {reply.user_role === 'admin' ? <span className="font-bold text-red-500">Admin</span> : 'You'} • {new Date(reply.created_at).toLocaleString()}
                      </span>
                   </div>
                 ))
               )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50">
               {selectedTicket.status === 'closed' ? (
                  <div className="text-center py-2 text-sm font-bold text-gray-500 bg-gray-200 rounded-xl border border-gray-300">
                    This ticket is closed.
                  </div>
               ) : (
                  <form onSubmit={handleReplyTicket} className="flex gap-2">
                    <div className="flex-1 relative">
                      <input 
                         type="text" 
                         required 
                         maxLength="500"
                         value={replyMessage}
                         onChange={e => setReplyMessage(e.target.value)}
                         placeholder="Type your reply here..." 
                         className="w-full p-3 pr-16 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all"
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${replyMessage.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                        {replyMessage.length}/500
                      </span>
                    </div>
                    <button type="submit" disabled={isSubmittingTicket} className="bg-[#0066ff] text-white p-3 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center">
                       <Send size={18} className={isSubmittingTicket ? 'animate-pulse' : ''} />
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
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowFullImageModal(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-red-500 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            onClick={() => setShowFullImageModal(false)}
          >
            <X size={32}/>
          </button>
          <img 
            src={fullImageUrl} 
            alt="Full Product" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-white/10 cursor-default" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}} />
    </div>
  );
}