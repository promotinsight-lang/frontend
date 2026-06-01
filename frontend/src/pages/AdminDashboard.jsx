import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  RefreshCcw, CheckCircle, XCircle, Eye, Search, X, 
  ShieldCheck, ShieldAlert, Snowflake, Play, Star, Users, User, Trash2, Scale, Clock, Package, AlertTriangle, Wallet, Image as ImageIcon,
  BarChart3, Calendar, Headset, MessageCircle, Send, History, Megaphone, MapPin, FileText, Settings, Edit,
  Briefcase, LayoutDashboard
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, pendingDeposits: 0, pendingWithdrawals: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [monthlyReport, setMonthlyReport] = useState({ total_orders: 0, completed_orders: 0, failed_orders: 0 });
  
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); 
  const [historyWithdrawals, setHistoryWithdrawals] = useState([]);
  const [historyDeposits, setHistoryDeposits] = useState([]);
  const [historyRefunds, setHistoryRefunds] = useState([]); 
  
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [applications, setApplications] = useState([]); 
  const [verifications, setVerifications] = useState([]); 
  const [appeals, setAppeals] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [subTabHistory, setSubTabHistory] = useState('withdrawals');

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  
  // Refund Modal States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAppId, setRefundAppId] = useState(null);
  const [refundData, setRefundData] = useState({ orderNumber: '', screenshot_url: '', comment: '' });
  const [isUploadingRefundProof, setIsUploadingRefundProof] = useState(false);

  const [showAppDetailsModal, setShowAppDetailsModal] = useState(false);
  const [selectedAppDetails, setSelectedAppDetails] = useState(null);

  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [profileContextProduct, setProfileContextProduct] = useState(null); // NEW: To track product context for dual currency deductions
  const [userAppStats, setUserAppStats] = useState({ listed: 0, active: 0, success: 0, failed: 0 });
  const [selectedUserApps, setSelectedUserApps] = useState([]); 
  const [sellerProductsList, setSellerProductsList] = useState([]); 
  const [profileViewMode, setProfileViewMode] = useState('details'); 

  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [disputeComment, setDisputeComment] = useState('');

  // Withdrawal Modal States
  const [showApproveWithdrawalModal, setShowApproveWithdrawalModal] = useState(false);
  const [withdrawalToApprove, setWithdrawalToApprove] = useState(null);
  const [withdrawalProof, setWithdrawalProof] = useState({ transaction_id: '', screenshot_url: '' });
  const [isUploadingWithdrawalProof, setIsUploadingWithdrawalProof] = useState(false);

  const [showTrxDetailsModal, setShowTrxDetailsModal] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [trxType, setTrxType] = useState('');

  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplies, setTicketReplies] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [showTicketViewModal, setShowTicketViewModal] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  const [adminBlogs, setAdminBlogs] = useState([]);
  const [newBlog, setNewBlog] = useState({ title: '', content: '', is_published: true });
 const [blogImage, setBlogImage] = useState(null);
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);

  // Helper for Dual Currency Calculation
  const getConvertedPrice = (amount, country, platform) => {
    if (!amount) return '0.00';
    const config = allFeeConfigs.find(c => c.country === country && c.platform === platform);
    const rate = config && config.exchange_rate ? parseFloat(config.exchange_rate) : 1;
    return (parseFloat(amount) * rate).toFixed(2);
  };

  // 🔥 DYNAMIC FEE CONFIGURATION STATES
  const [feeConfig, setFeeConfig] = useState({
    country: '', platform: '', platform_charge: [{ min: '', max: '', fee: '' }], buyer_reward: '', 
    buyer_refund_fee: '', seller_deposit_fee: '', seller_withdrawal_fee: '', exchange_rate: 1
  });
  const [allFeeConfigs, setAllFeeConfigs] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);

  const token = localStorage.getItem('token');
  const getAuthHeaders = () => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
    else setActiveTab('overview');
  }, [location.search]);

  // 🔥 FETCH ALL SAVED CONFIGURATIONS
  const fetchAllFeeConfigs = async () => {
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/config/fees/all`, { 
        headers: getAuthHeaders(), credentials: 'include' 
      });
      const data = await res.json();
      if (data.success) setAllFeeConfigs(data.data);
    } catch (err) { console.error(err); }
  };

  // 🔥 FETCH SPECIFIC FEE CONFIG ON BLUR OR SEARCH
  const fetchFeeConfig = async (country, platform) => {
    if (!country.trim() || !platform.trim()) return;
    setFeeLoading(true);
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/config/fees?country=${country}&platform=${platform}`, { 
        headers: getAuthHeaders(), credentials: 'include' 
      });
      const data = await res.json();
      if (data.success && data.data) {
        
        let parsedTiers = [{ min: '', max: '', fee: '' }];
        if (Array.isArray(data.data.platform_charge) && data.data.platform_charge.length > 0) {
          parsedTiers = data.data.platform_charge;
        } else if (typeof data.data.platform_charge === 'string') {
          try {
            const parsed = JSON.parse(data.data.platform_charge);
            if (Array.isArray(parsed)) parsedTiers = parsed;
          } catch(e) { }
        }

        setFeeConfig({
          country: data.data.country, platform: data.data.platform, platform_charge: parsedTiers,
          buyer_reward: data.data.buyer_reward, buyer_refund_fee: data.data.buyer_refund_fee,
          seller_deposit_fee: data.data.seller_deposit_fee, seller_withdrawal_fee: data.data.seller_withdrawal_fee,
          exchange_rate: data.data.exchange_rate || 1
        });
      } else {
        setFeeConfig(prev => ({
          ...prev, platform_charge: [{ min: '', max: '', fee: '' }], buyer_reward: '', buyer_refund_fee: '', seller_deposit_fee: '', seller_withdrawal_fee: '', exchange_rate: 1
        }));
      }
    } catch (err) { console.error(err); } 
    finally { setFeeLoading(false); }
  };

  const handleFeeSelectorChange = (field, value) => {
    setFeeConfig(prev => ({ ...prev, [field]: value }));
  };

  // 🔥 DYNAMIC TIER HANDLERS
  const handleAddTier = () => {
    setFeeConfig(prev => ({
      ...prev,
      platform_charge: [...prev.platform_charge, { min: '', max: '', fee: '' }]
    }));
  };

  const handleRemoveTier = (index) => {
    setFeeConfig(prev => {
      const newTiers = prev.platform_charge.filter((_, i) => i !== index);
      return { ...prev, platform_charge: newTiers };
    });
  };

  const handleTierChange = (index, field, value) => {
    setFeeConfig(prev => {
      const newTiers = [...prev.platform_charge];
      newTiers[index][field] = value === '' ? '' : Number(value);
      return { ...prev, platform_charge: newTiers };
    });
  };

  const handleFeeBlur = () => {
    if (feeConfig.country && feeConfig.platform) {
      fetchFeeConfig(feeConfig.country, feeConfig.platform);
    }
  };

  const handleEditFeeClick = (config) => {
    let parsedTiers = [{ min: '', max: '', fee: '' }];
    if (Array.isArray(config.platform_charge) && config.platform_charge.length > 0) {
      parsedTiers = config.platform_charge;
    } else if (typeof config.platform_charge === 'string') {
      try {
        const parsed = JSON.parse(config.platform_charge);
        if (Array.isArray(parsed)) parsedTiers = parsed;
      } catch(e) { }
    }

    setFeeConfig({
      country: config.country, platform: config.platform, platform_charge: parsedTiers,
      buyer_reward: config.buyer_reward, buyer_refund_fee: config.buyer_refund_fee,
      seller_deposit_fee: config.seller_deposit_fee, seller_withdrawal_fee: config.seller_withdrawal_fee,
      exchange_rate: config.exchange_rate || 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveFeeConfig = async (e) => {
    e.preventDefault();
    if (!feeConfig.country.trim() || !feeConfig.platform.trim()) {
      alert("Please enter both country and platform names!");
      return;
    }
    
    const hasInvalidTiers = feeConfig.platform_charge.some(t => t.min === '' || t.max === '' || t.fee === '');
    if (hasInvalidTiers) {
      alert("Please fill in all tier values (Min, Max, Fee) correctly.");
      return;
    }

    const payload = {
      ...feeConfig,
      platform_charge: JSON.stringify(feeConfig.platform_charge) 
    };
    
    const success = await handleAction('https://backend-6aiq.onrender.com/api/config/fees', 'POST', payload);
    if (success) fetchAllFeeConfigs();
  };

  const handleDeleteFeeConfig = async (country, platform) => {
    if (window.confirm(`Are you sure you want to delete the fee configuration for ${country} - ${platform}?`)) {
        const success = await handleAction(`https://backend-6aiq.onrender.com/api/config/fees/${encodeURIComponent(country)}/${encodeURIComponent(platform)}`, 'DELETE');
        if (success) fetchAllFeeConfigs();
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/admin/monthly-stats?month=${selectedMonth}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setMonthlyReport(data.data);
    } catch (err) { }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/admin/stats', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {}
  };

  const fetchDeposits = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/admin/deposits', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) { setDeposits(data.data.filter(d => d.status === 'pending')); setHistoryDeposits(data.data); }
    } catch (err) {}
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/withdrawals/all', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) { setWithdrawals(data.data.filter(w => w.status === 'pending')); setHistoryWithdrawals(data.data); }
    } catch (err) {}
  };

  const fetchRefunds = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/products/refunds/all', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setHistoryRefunds(data.data); 
    } catch (err) {}
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/products', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) { setAllProducts(data.data); setPendingProducts(data.data.filter(p => p.status === 'pending')); }
    } catch (err) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/users/payment-settings', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setPaymentSettings(data.data);
    } catch (err) {}
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/applications/all', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setApplications(data.data);
    } catch (err) {}
  };

  const fetchVerifications = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/admin/verifications', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setVerifications(data.data.filter(v => v.verification_status === 'pending'));
    } catch (err) {}
  };

  const fetchUsers = async (role) => {
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/users/admin/role/${role}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setUsersList(data.data);
    } catch (err) {}
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/admin/appeals', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setAppeals(data.data);
    } catch (err) {}
  };

  const fetchSupportTickets = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/support/all', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setSupportTickets(data.data);
    } catch (err) {}
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/announcements/admin/all', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch (err) {}
  };

  const fetchAdminBlogs = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/blogs/admin/all', { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setAdminBlogs(data.data);
    } catch (err) {}
  };

  const fetchAndShowUserProfile = async (userId) => {
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/users/admin/user/${userId}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      
      if (data.success) {
        setSelectedUserProfile(data.data);
        setProfileViewMode('details'); 
        
        try {
          const appRes = await fetch('https://backend-6aiq.onrender.com/api/applications/all', { headers: getAuthHeaders(), credentials: 'include' });
          const appData = await appRes.json();
          
          if (appData.success) {
             if (data.data.role === 'buyer') {
                 const userApps = appData.data.filter(app => app.buyer_email === data.data.email);
                 setSelectedUserApps(userApps);
                 const active = userApps.filter(a => !['completed', 'rejected'].includes(a.status)).length;
                 const success = userApps.filter(a => a.status === 'completed').length;
                 const failed = userApps.filter(a => a.status === 'rejected').length;
                 setUserAppStats({ listed: 0, active, success, failed });
             } else if (data.data.role === 'seller') {
                 const prodRes = await fetch('https://backend-6aiq.onrender.com/api/products', { headers: getAuthHeaders(), credentials: 'include' });
                 const prodData = await prodRes.json();
                 let sProducts = [];
                 if (prodData.success) sProducts = prodData.data.filter(p => p.seller_email === data.data.email);
                 setSellerProductsList(sProducts);
                 const userApps = appData.data.filter(app => sProducts.some(sp => sp.product_name === app.product_name || sp.id === app.product_id));
                 setSelectedUserApps(userApps);
                 const listed = sProducts.length;
                 const active = userApps.filter(a => !['completed', 'rejected'].includes(a.status)).length;
                 const success = userApps.filter(a => a.status === 'completed').length;
                 const failed = userApps.filter(a => a.status === 'rejected').length;
                 setUserAppStats({ listed, active, success, failed });
             }
          }
        } catch (e) {}
        setShowUserProfileModal(true);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchStats();
    fetchMonthlyReport();
    if (activeTab === 'deposits' || activeTab === 'history') fetchDeposits();
    if (activeTab === 'withdrawals' || activeTab === 'history') fetchWithdrawals();
    if (activeTab === 'history') fetchRefunds(); 
    if (activeTab === 'products' || activeTab === 'all-products') fetchProducts();
    if (activeTab === 'settings') { fetchSettings(); fetchAllFeeConfigs(); } 
    if (activeTab === 'applications') fetchApplications(); 
    if (activeTab === 'verify-requests') fetchVerifications(); 
    if (activeTab === 'appeals') fetchAppeals(); 
    if (activeTab === 'all-buyers') fetchUsers('buyer'); 
    if (activeTab === 'all-sellers') fetchUsers('seller'); 
    if (activeTab === 'support-tickets') fetchSupportTickets(); 
    if (activeTab === 'announcements') fetchAnnouncements(); 
    if (activeTab === 'blogs') fetchAdminBlogs();
  }, [activeTab, selectedMonth]);

  const handleAction = async (url, method = 'PATCH', bodyData = null) => {
    try {
      const options = { method, headers: getAuthHeaders(), credentials: 'include' };
      if (bodyData) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(bodyData); }
      const res = await fetch(url, options);
      if (res.status === 429) { alert('Rate limiter active.'); return false; }
      const data = await res.json();
      if (res.ok) { alert(data.message || 'Action successful'); return true; } 
      else { alert(data.message || 'Action failed'); return false; }
    } catch (err) { alert('Connection Error.'); return false; }
  };

  const approveDeposit = async (id) => { if(window.confirm('Approve Deposit?')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/admin/deposits/${id}/approve`)) fetchDeposits(); } };
  const rejectDeposit = async (id) => { if(window.confirm('Reject Deposit?')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/admin/deposits/${id}/reject`)) fetchDeposits(); } };
  
  const handleWithdrawalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingWithdrawalProof(true);
    try {
      const cloudData = new FormData();
      cloudData.append("file", file);
      cloudData.append("upload_preset", "promot_insight_preset");
      cloudData.append("cloud_name", "dtlkf5smb");

      const res = await fetch("https://api.cloudinary.com/v1_1/dtlkf5smb/image/upload", {
        method: "POST",
        body: cloudData,
      });
      const cloudJson = await res.json();
      if (!cloudJson.secure_url) throw new Error("Upload failed");

      setWithdrawalProof(prev => ({ ...prev, screenshot_url: cloudJson.secure_url }));
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      alert("Image upload failed! Please try again.");
    } finally {
      setIsUploadingWithdrawalProof(false);
    }
  };

  const submitWithdrawalApproval = async (e) => {
    e.preventDefault();
    if(await handleAction(`https://backend-6aiq.onrender.com/api/withdrawals/${withdrawalToApprove.id}/approve`, 'PATCH', withdrawalProof)) {
      setShowApproveWithdrawalModal(false); setWithdrawalToApprove(null); setWithdrawalProof({ transaction_id: '', screenshot_url: '' }); fetchWithdrawals();
    }
  };

  const rejectWithdrawal = async (id) => { if(window.confirm('Reject Withdrawal and Refund Wallet?')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/withdrawals/${id}/reject`)) fetchWithdrawals(); } };
  const approveProduct = async (id) => { if(window.confirm('Approve product?')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/products/${id}/approve`)) { fetchProducts(); setShowProductModal(false); } } };
  const rejectProduct = async (id) => { if(window.confirm('Reject product and refund?')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/products/${id}/reject`, 'PATCH')) { fetchProducts(); setShowProductModal(false); } } };
  const stopProductAction = async (id) => { if(window.confirm('Stop this product? It will appear as Sold Out.')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/products/${id}/stop`, 'PATCH')) { fetchProducts(); setShowProductModal(false); } } };
  const resumeProductAction = async (id) => { if(window.confirm('Resume this product? It will be live and available again.')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/products/${id}/resume`, 'PATCH')) { fetchProducts(); setShowProductModal(false); } } };
  const verifyUser = async (id, status) => { if(window.confirm(`Mark user as ${status}?`)) { if(await handleAction(`https://backend-6aiq.onrender.com/api/admin/verify-user/${id}`, 'PATCH', { status })) fetchVerifications(); } };

  const approveAppeal = async (id) => { if(window.confirm('Approve this appeal and reactivate the account?')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/admin/appeals/${id}/approve`)) fetchAppeals(); } };
  const rejectAppeal = async (id) => { if(window.confirm('Reject this appeal? The account will remain disabled.')) { if(await handleAction(`https://backend-6aiq.onrender.com/api/admin/appeals/${id}/reject`)) fetchAppeals(); } };

  const handleDisputeFavorSeller = async (appealId, applicationId) => {
    if (!disputeComment) return alert("Please enter an Admin Comment explaining your decision.");
    if(window.confirm('Favor Seller? This will reject the buyer\'s order and refund the seller.')) { 
      if(await handleAction(`https://backend-6aiq.onrender.com/api/appeals/dispute/${appealId}/favor-seller`, 'PATCH', { application_id: applicationId, admin_comment: disputeComment })) {
        fetchAppeals(); setShowAppealModal(false); setDisputeComment('');
      }
    }
  };

  const handleDisputeFavorBuyer = async (appealId, applicationId) => {
    if (!disputeComment) return alert("Please enter an Admin Comment explaining your decision.");
    if(window.confirm('Favor Buyer? This will move the order to Pending Refund.')) { 
      if(await handleAction(`https://backend-6aiq.onrender.com/api/appeals/dispute/${appealId}/favor-buyer`, 'PATCH', { application_id: applicationId, admin_comment: disputeComment })) {
        fetchAppeals(); setShowAppealModal(false); setDisputeComment('');
      }
    }
  };

  const actionApplication = async (appId, actionType) => {
    if(window.confirm(`Proceed to ${actionType.replace('-', ' ')}?`)) {
      if(await handleAction(`https://backend-6aiq.onrender.com/api/applications/${appId}/${actionType}`)) {
         fetchApplications(); setShowAppDetailsModal(false);
      }
    }
  };

  const deleteApplication = async (appId) => {
    if(window.confirm('Are you sure you want to permanently clear this rejected application record?')) {
      if(await handleAction(`https://backend-6aiq.onrender.com/api/applications/${appId}/delete`, 'DELETE')) {
         fetchApplications(); setShowAppDetailsModal(false);
      }
    }
  };

  const handleRefundImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingRefundProof(true);
    try {
      const cloudData = new FormData();
      cloudData.append("file", file);
      cloudData.append("upload_preset", "promot_insight_preset");
      cloudData.append("cloud_name", "dtlkf5smb");

      const res = await fetch("https://api.cloudinary.com/v1_1/dtlkf5smb/image/upload", {
        method: "POST",
        body: cloudData,
      });
      const cloudJson = await res.json();
      if (!cloudJson.secure_url) throw new Error("Upload failed");

      setRefundData(prev => ({ ...prev, screenshot_url: cloudJson.secure_url }));
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      alert("Image upload failed! Please try again.");
    } finally {
      setIsUploadingRefundProof(false);
    }
  };

  const submitRefund = async (e) => {
    e.preventDefault();
    if(await handleAction(`https://backend-6aiq.onrender.com/api/applications/${refundAppId}/confirm-refund`, 'PATCH', {
      refund_order_number: refundData.orderNumber, 
      refund_screenshot_url: refundData.screenshot_url || refundData.orderNumber,
      refund_comment: refundData.comment
    })) {
      setShowRefundModal(false); setShowAppDetailsModal(false); setRefundData({ orderNumber: '', screenshot_url: '', comment: '' }); fetchApplications();
    }
  };

  const toggleUserStatus = async (id, payload) => {
    if(window.confirm('Are you sure you want to change this user\'s status?')) {
      if(await handleAction(`https://backend-6aiq.onrender.com/api/users/admin/status/${id}`, 'PATCH', payload)) fetchUsers(activeTab === 'all-buyers' ? 'buyer' : 'seller');
    }
  };

  const updateTrust = async (id, oldScore) => {
    const score = prompt("Enter new Trust Score (0.0 - 5.0):", oldScore || "5.0");
    if (score !== null && !isNaN(score)) {
      if(await handleAction(`https://backend-6aiq.onrender.com/api/users/${id}/trust-score`, 'PATCH', { trust_score: parseFloat(score) })) fetchUsers(activeTab === 'all-buyers' ? 'buyer' : 'seller');
    }
  };

  const updateSetting = async (id, newDetails) => {
    if (!newDetails) return alert("Account details cannot be empty");
    if (await handleAction(`https://backend-6aiq.onrender.com/api/admin/payment-settings/${id}`, 'PATCH', { account_details: newDetails })) fetchSettings();
  };

  const openTicketView = async (ticket) => {
    setSelectedTicket(ticket); setShowTicketViewModal(true); setRepliesLoading(true);
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/support/${ticket.id}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if(res.ok) { setTicketReplies(data.data.replies || []); setSelectedTicket(data.data.ticket); }
    } catch (err) {} finally { setRepliesLoading(false); }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if(!replyMessage.trim()) return;
    setIsSubmittingTicket(true);
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/support/${selectedTicket.id}/reply`, { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: JSON.stringify({ message: replyMessage }) });
      const data = await res.json();
      if(res.ok) { setTicketReplies([...ticketReplies, data.data]); setReplyMessage(''); fetchSupportTickets(); setSelectedTicket(prev => ({...prev, status: 'answered'})); }
    } catch (err) {} finally { setIsSubmittingTicket(false); }
  };

  const handleCloseTicket = async (ticketId) => {
    if(!window.confirm("Are you sure you want to close this ticket? It will be marked as resolved.")) return;
    try {
      const res = await fetch(`https://backend-6aiq.onrender.com/api/support/${ticketId}/close`, { method: 'PATCH', headers: getAuthHeaders(), credentials: 'include' });
      if(res.ok) { alert("Ticket closed successfully"); setShowTicketViewModal(false); fetchSupportTickets(); }
    } catch(err) {}
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault(); setIsPublishing(true);
    const success = await handleAction('https://backend-6aiq.onrender.com/api/announcements', 'POST', newAnnouncement);
    if (success) { setNewAnnouncement({ title: '', message: '' }); fetchAnnouncements(); }
    setIsPublishing(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      const success = await handleAction(`https://backend-6aiq.onrender.com/api/announcements/${id}`, 'DELETE');
      if (success) fetchAnnouncements();
    }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content) return alert("Title and content are required.");
    setIsPublishingBlog(true);
    const formData = new FormData();
    formData.append("title", newBlog.title); formData.append("content", newBlog.content); formData.append("is_published", newBlog.is_published);
    if (blogImage) formData.append("image", blogImage); 
    try {
      const res = await fetch("https://backend-6aiq.onrender.com/api/blogs", { method: "POST", headers: getAuthHeaders(), body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Blog published successfully!"); setNewBlog({ title: '', content: '', is_published: true }); setBlogImage(null);
        document.getElementById('blog-image-upload').value = ''; fetchAdminBlogs();
      } else alert(data.message || "Failed to publish blog.");
    } catch (err) {}
    setIsPublishingBlog(false);
  };

  const handleDeleteBlog = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      const success = await handleAction(`https://backend-6aiq.onrender.com/api/blogs/${id}`, 'DELETE');
      if (success) fetchAdminBlogs();
    }
  };

  const renderStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-200">Approved</span>;
      case 'order_approved': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-blue-200">Order Apprvd</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-200">Rejected</span>;
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-200">Pending</span>;
      case 'stopped': return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-orange-200">Stopped</span>;
      case 'forwarded_to_seller': return <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-indigo-200">With Seller</span>;
      case 'disputed': return <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-pink-200">Disputed</span>;
      case 'pending_refund': return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-orange-200">Refund Pndg</span>;
      case 'completed': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-200">Completed</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-[10px] font-bold uppercase">{status.replace('_', ' ')}</span>;
    }
  };

  const openTrxDetails = (trx, type) => {
    setSelectedTrx(trx); setTrxType(type); setShowTrxDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar /> 
      
      <div className="bg-[#0066ff] pt-6 pb-12 px-4 shadow-lg text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold">Admin Master Panel</h2>
            <p className="text-blue-100 text-sm opacity-80">Smart Review System Management</p>
          </div>
          <button onClick={() => {
            fetchStats(); fetchMonthlyReport();
            if(activeTab === 'applications') fetchApplications();
            if(activeTab === 'products' || activeTab === 'all-products') fetchProducts();
            if(activeTab === 'verify-requests') fetchVerifications();
            if(activeTab === 'appeals') fetchAppeals();
            if(activeTab === 'history') { fetchDeposits(); fetchWithdrawals(); fetchRefunds(); }
            if(activeTab === 'all-buyers') fetchUsers('buyer');
            if(activeTab === 'all-sellers') fetchUsers('seller');
            if(activeTab === 'support-tickets') fetchSupportTickets();
            if(activeTab === 'announcements') fetchAnnouncements();
            if(activeTab === 'blogs') fetchAdminBlogs();
            if(activeTab === 'settings') { fetchSettings(); fetchAllFeeConfigs(); }
          }} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all">
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 -mt-6">

        <div className="bg-white p-2 rounded-xl shadow-sm border mb-6 flex overflow-x-auto gap-2 scrollbar-hide">
          {[
            { id: 'overview', icon: <BarChart3 size={16} />, label: 'Overview' },
            { id: 'all-buyers', icon: <Users size={16} />, label: 'Buyers' },
            { id: 'all-sellers', icon: <Briefcase size={16} />, label: 'Sellers' },
            { id: 'verify-requests', icon: <ShieldCheck size={16} />, label: 'Verifications' },
            { id: 'products', icon: <Package size={16} />, label: 'Pending Products' },
            { id: 'all-products', icon: <LayoutDashboard size={16} />, label: 'All Products' },
            { id: 'applications', icon: <FileText size={16} />, label: 'Applications' },
            { id: 'deposits', icon: <Wallet size={16} />, label: 'Deposits' },
            { id: 'withdrawals', icon: <History size={16} />, label: 'Withdrawals' },
            { id: 'history', icon: <History size={16} />, label: 'Trx History' },
            { id: 'appeals', icon: <Scale size={16} />, label: 'Appeals' },
            { id: 'support-tickets', icon: <Headset size={16} />, label: 'Support Tickets' },
            { id: 'announcements', icon: <Megaphone size={16} />, label: 'Announcements' },
            { id: 'blogs', icon: <FileText size={16} />, label: 'Blogs' },
            { id: 'settings', icon: <Settings size={16} />, label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[#0066ff] text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ALL BUYERS / SELLERS TAB */}
        {(activeTab === 'all-buyers' || activeTab === 'all-sellers') && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in-up">
            <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-700 capitalize flex items-center gap-2">
                <Users size={20} className={activeTab === 'all-buyers' ? "text-blue-600" : "text-orange-600"}/> 
                Manage {activeTab.replace('all-', '')}s
              </h3>
              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Trust Score</th>
                    <th className="p-4">Wallet Balance</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase())).map(user => (
                    <tr key={user.id} className={`border-b hover:bg-gray-50 ${!user.is_active ? 'bg-red-50/50' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        {user.last_ip && user.last_ip !== 'Unknown' && (
                          <div className="mt-1.5 flex flex-col items-start gap-1">
                             <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 inline-flex items-center gap-1">
                               🌍 {user.ip_location || 'Location Unknown'}
                             </span>
                             <a 
                               href={`https://ipinfo.io/${user.last_ip}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0066ff] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                               title="Click to view full IP details"
                             >
                               <MapPin size={10} /> {user.last_ip}
                             </a>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.verification_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {user.verification_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => updateTrust(user.id, user.trust_score)}
                          className="flex items-center gap-1 text-orange-500 font-bold hover:bg-orange-50 px-2 py-1 rounded border border-transparent hover:border-orange-200 transition-colors"
                          title="Click to edit trust score"
                        >
                          <Star size={14} fill="currentColor" /> {Number(user.trust_score || 0).toFixed(1)}
                        </button>
                      </td>
                      <td className="p-4 font-bold text-green-600">${Number(user.wallet_balance).toFixed(2)}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => fetchAndShowUserProfile(user.id)} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" title="View Full Profile"><Eye size={16}/></button>
                        
                        <button 
                          onClick={() => toggleUserStatus(user.id, { is_frozen: !user.is_frozen })}
                          className={`px-3 py-1.5 rounded-lg transition-colors border text-xs font-bold flex items-center gap-1 ${user.is_frozen ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'}`}
                        >
                          {user.is_frozen ? <><Play size={14} /> Unfreeze</> : <><Snowflake size={14} /> Freeze</>}
                        </button>
                        
                        <button 
                          onClick={() => toggleUserStatus(user.id, { is_active: !user.is_active })}
                          className={`px-3 py-1.5 rounded-lg transition-colors border text-xs font-bold flex items-center gap-1 ${!user.is_active ? 'bg-green-500 text-white border-green-500' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'}`}
                        >
                          {user.is_active ? <><ShieldAlert size={14} /> Disable</> : <><ShieldCheck size={14} /> Enable</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-gray-500 font-bold uppercase text-xs">Total Users</p>
                <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <p className="text-gray-500 font-bold uppercase text-xs">Total Products</p>
                <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalProducts}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                <p className="text-gray-500 font-bold uppercase text-xs">Pending Deposits</p>
                <p className="text-3xl font-black text-yellow-600 mt-2">{stats.pendingDeposits}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                <p className="text-gray-500 font-bold uppercase text-xs">Pending Withdrawals</p>
                <p className="text-3xl font-black text-red-600 mt-2">{stats.pendingWithdrawals}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Monthly Business Report</h3>
                    <p className="text-xs text-gray-500">Performance overview by selected month</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border shadow-sm">
                  <Calendar size={18} className="text-gray-400 ml-2" />
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="p-1.5 text-sm font-bold text-gray-700 outline-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-blue-600 font-bold text-xs uppercase mb-1">Monthly Total Orders</p>
                  <p className="text-4xl font-black text-blue-800">{monthlyReport.total_orders}</p>
                  <div className="mt-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Total Activity</div>
                </div>
                <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-green-600 font-bold text-xs uppercase mb-1">Completed / Refunded</p>
                  <p className="text-4xl font-black text-green-800">{monthlyReport.completed_orders}</p>
                  <div className="mt-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Successful Payouts</div>
                </div>
                <div className="bg-red-50/50 border border-red-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-red-600 font-bold text-xs uppercase mb-1">Failed / Rejected</p>
                  <p className="text-4xl font-black text-red-800">{monthlyReport.failed_orders}</p>
                  <div className="mt-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Order Issues</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB (DYNAMIC FEES) */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fade-in-up mt-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <Settings size={22} className="text-[#0066ff]" /> Dynamic Tariffs & Fee Configuration
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-semibold">
                Type Country and Platform to automatically fetch, configure, or update active system parameters using UPSERT logic.
              </p>

              <form onSubmit={handleSaveFeeConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-600 mb-1">Target Country</label>
                    <input type="text" required placeholder="e.g. USA, India, Bangladesh..." value={feeConfig.country} onChange={(e) => handleFeeSelectorChange('country', e.target.value)} onBlur={handleFeeBlur} className="w-full p-2.5 bg-white border rounded-lg font-bold text-sm text-gray-800 outline-none focus:border-[#0066ff]"/>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-600 mb-1">Target Platform</label>
                    <input type="text" required placeholder="e.g. Amazon, Daraz, Shopee..." value={feeConfig.platform} onChange={(e) => handleFeeSelectorChange('platform', e.target.value)} onBlur={handleFeeBlur} className="w-full p-2.5 bg-white border rounded-lg font-bold text-sm text-gray-800 outline-none focus:border-[#0066ff]"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
                  {feeLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center text-sm font-bold text-[#0066ff]">Fetching active configurations...</div>
                  )}
                  
                  <div className="col-span-full mb-2 bg-gray-50 border p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-800">Dynamic Tier-Based Platform Charge</label>
                        <p className="text-[10px] text-gray-500">Set fixed fees based on the product price range.</p>
                      </div>
                      <button type="button" onClick={handleAddTier} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">+ Add Tier</button>
                    </div>
                    
                    {feeConfig.platform_charge.map((tier, index) => (
                      <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 mb-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex-1"><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Min Price ($)</label><input type="number" step="0.01" min="0" required value={tier.min} onChange={(e) => handleTierChange(index, 'min', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#0066ff]" placeholder="e.g. 1" /></div>
                        <div className="flex-1"><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Max Price ($)</label><input type="number" step="0.01" min="0" required value={tier.max} onChange={(e) => handleTierChange(index, 'max', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#0066ff]" placeholder="e.g. 20" /></div>
                        <div className="flex-1"><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Fixed Fee ($)</label><input type="number" step="0.01" min="0" required value={tier.fee} onChange={(e) => handleTierChange(index, 'fee', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#0066ff]" placeholder="e.g. 2" /></div>
                        {feeConfig.platform_charge.length > 1 && (
                          <div className="pb-1"><button type="button" onClick={() => handleRemoveTier(index)} className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors" title="Remove Tier"><Trash2 size={16} /></button></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 🔥 NEW: Exchange Rate Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Exchange Rate (1 USD = ?)</label>
                    <input type="number" step="0.0001" min="0.0001" required placeholder="e.g. 1.0000" className="w-full p-2.5 border rounded-lg font-semibold text-sm outline-none focus:border-[#0066ff]" value={feeConfig.exchange_rate} onChange={(e) => handleFeeSelectorChange('exchange_rate', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Buyer Reward (Fixed Amt)</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="w-full p-2.5 border rounded-lg font-semibold text-sm outline-none focus:border-[#0066ff]" value={feeConfig.buyer_reward} onChange={(e) => handleFeeSelectorChange('buyer_reward', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Refund Fee (%)</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="w-full p-2.5 border rounded-lg font-semibold text-sm outline-none focus:border-[#0066ff]" value={feeConfig.buyer_refund_fee} onChange={(e) => handleFeeSelectorChange('buyer_refund_fee', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Seller Deposit Fee (%)</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="w-full p-2.5 border rounded-lg font-semibold text-sm outline-none focus:border-[#0066ff]" value={feeConfig.seller_deposit_fee} onChange={(e) => handleFeeSelectorChange('seller_deposit_fee', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Seller Withdraw Fee (%)</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="w-full p-2.5 border rounded-lg font-semibold text-sm outline-none focus:border-[#0066ff]" value={feeConfig.seller_withdrawal_fee} onChange={(e) => handleFeeSelectorChange('seller_withdrawal_fee', e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={feeLoading || !feeConfig.country || !feeConfig.platform} className="bg-[#0066ff] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50">Save & Apply Tariffs</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">All Saved Fee Configurations</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">{allFeeConfigs.length} Total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="p-3">Country</th><th className="p-3">Platform</th><th className="p-3 text-center">Tiers Config.</th>
                      <th className="p-3 text-center">Ex. Rate</th>
                      <th className="p-3 text-center">Reward (Fixed)</th><th className="p-3 text-center">Refund Fee (%)</th>
                      <th className="p-3 text-center">Dep. Fee (%)</th><th className="p-3 text-center">W.Draw Fee (%)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFeeConfigs.map(conf => {
                      let tierCount = 0;
                      if (Array.isArray(conf.platform_charge)) {
                        tierCount = conf.platform_charge.length;
                      } else {
                        try {
                          const parsed = JSON.parse(conf.platform_charge);
                          if(Array.isArray(parsed)) tierCount = parsed.length;
                        } catch(e) {}
                      }

                      return (
                        <tr key={`${conf.country}-${conf.platform}`} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-bold text-gray-800 capitalize">{conf.country}</td>
                          <td className="p-3 font-bold text-indigo-700 capitalize">{conf.platform}</td>
                          <td className="p-3 text-center font-semibold">
                            {tierCount > 0 ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">{tierCount} Tiers</span>
                            ) : (
                              <span className="text-gray-500">{conf.platform_charge}%</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-[#0066ff]">{conf.exchange_rate || 1}</td>
                          <td className="p-3 text-center font-semibold text-green-600">${conf.buyer_reward}</td>
                          <td className="p-3 text-center font-semibold text-red-500">{conf.buyer_refund_fee}%</td>
                          <td className="p-3 text-center font-semibold">{conf.seller_deposit_fee}%</td>
                          <td className="p-3 text-center font-semibold">{conf.seller_withdrawal_fee}%</td>
                          <td className="p-3 text-right flex items-center justify-end gap-1">
                            <button onClick={() => handleEditFeeClick(conf)} className="text-[#0066ff] hover:bg-blue-50 p-2 rounded-lg transition-colors font-bold text-xs" title="Edit"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteFeeConfig(conf.country, conf.platform)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors font-bold text-xs" title="Delete"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      );
                    })}
                    {allFeeConfigs.length === 0 && <tr><td colSpan="9" className="p-6 text-center text-gray-500">No custom fees configured yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Receiving Accounts */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-6 border-b pb-2">Payment Receiving Accounts</h3>
              <div className="space-y-6">
                {paymentSettings.map(setting => (
                  <div key={setting.id} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="w-full md:w-1/4">
                      <label className="block text-sm font-bold text-gray-600 mb-1">Method</label>
                      <input type="text" readOnly value={setting.method_name} className="w-full p-2 bg-gray-200 border rounded font-semibold text-gray-700 outline-none" />
                    </div>
                    <div className="w-full md:w-2/4">
                      <label className="block text-sm font-bold text-gray-600 mb-1">Account Details / Wallet Address</label>
                      <input type="text" defaultValue={setting.account_details} id={`setting-${setting.id}`} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="w-full md:w-1/4">
                      <button onClick={() => updateSetting(setting.id, document.getElementById(`setting-${setting.id}`).value)} className="w-full bg-gray-800 text-white p-2 rounded font-bold hover:bg-gray-900">Save Changes</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OTHER ADMIN TABS IMPLEMENTATIONS... (Applications, Products, Appeals, Tickets, Announcements, Blogs) */}
        
        {/* APPEALS TAB */}
        {activeTab === 'appeals' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Scale size={20} className="text-indigo-600" />
                User Appeals
              </h3>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-bold">
                {appeals.filter(a => a.status === 'pending').length} Pending
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-4 w-1/4">User Info</th>
                    <th className="p-4 w-2/4">Appeal Type & Reason</th>
                    <th className="p-4 w-1/4 text-right">Status & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map(appeal => (
                    <tr key={appeal.id} className={`border-b hover:bg-gray-50 ${appeal.status === 'pending' ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{appeal.name}</div>
                        <div className="text-xs text-gray-500 mb-1">{appeal.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-gray-300">{appeal.role}</span>
                          <button 
                            onClick={() => fetchAndShowUserProfile(appeal.user_id)}
                            className="text-[#0066ff] text-[10px] font-bold hover:underline flex items-center gap-1"
                          >
                            <Eye size={12} /> Profile
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">
                        {appeal.appeal_type === 'order_dispute' ? (
                          <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block border border-pink-200">Order Dispute (Seller Appeal)</span>
                        ) : (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block border border-purple-200">Account Ban Appeal</span>
                        )}
                        <p className="line-clamp-2 text-xs mb-2 text-gray-500 italic">"{appeal.reason}"</p>
                        <button 
                          onClick={() => { setSelectedAppeal(appeal); setShowAppealModal(true); setDisputeComment(''); }}
                          className="text-[#0066ff] text-xs font-bold hover:underline flex items-center gap-1 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-max"
                        >
                          <Eye size={14} /> Resolve Issue
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="mb-2">
                          {renderStatusBadge(appeal.status)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appeals.length === 0 && (
                    <tr><td colSpan="3" className="p-8 text-center text-gray-500">No appeals submitted yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUPPORT TICKETS TAB */}
        {activeTab === 'support-tickets' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Headset size={20} className="text-[#0066ff]" />
                User Support Tickets
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold border border-blue-200">
                {supportTickets.filter(t => t.status === 'open').length} Open
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Subject & Message</th>
                    <th className="p-4">Status & Time</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {supportTickets.map(ticket => (
                    <tr key={ticket.id} className={`border-b hover:bg-gray-50 ${ticket.status === 'open' ? 'bg-yellow-50/30' : ''}`}>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{ticket.user_name}</p>
                        <p className="text-xs text-gray-500">{ticket.user_email}</p>
                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block border border-gray-300">
                          {ticket.user_role}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs md:max-w-sm">
                        <p className="font-bold text-gray-800 truncate" title={ticket.subject}>{ticket.subject}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1" title={ticket.message}>{ticket.message}</p>
                      </td>
                      <td className="p-4">
                         <span className={`px-2 py-1 inline-block rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                             ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                             ticket.status === 'answered' ? 'bg-green-100 text-green-700 border border-green-200' :
                             'bg-gray-100 text-gray-600 border border-gray-200'
                         }`}>
                           {ticket.status}
                         </span>
                         <p className="text-[10px] text-gray-400">{new Date(ticket.updated_at).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4 text-right">
                         <button 
                           onClick={() => openTicketView(ticket)}
                           className="bg-[#0066ff] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-xs inline-flex items-center justify-center gap-1"
                         >
                           <MessageCircle size={14}/> Reply
                         </button>
                      </td>
                    </tr>
                  ))}
                  {supportTickets.length === 0 && (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">No support tickets found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VERIFY REQUESTS TAB */}
        {activeTab === 'verify-requests' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Pending User Verifications</h3>
              <span className="bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded-full font-bold">{verifications.length} Requests</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {verifications.length > 0 ? verifications.map(v => (
                <div key={v.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md p-5 transition-shadow">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                      {v.name ? v.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{v.name}</h4>
                      <p className="text-xs text-gray-500">{v.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm mb-5">
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Amazon Location & Account</p>
                      <p className="font-medium text-gray-700">{v.amazon_location || 'N/A'} - {v.amazon_account || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Amazon Profile Link</p>
                      {v.amazon_profile_url ? (
                        <a href={v.amazon_profile_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block">
                          View Profile ↗
                        </a>
                      ) : (
                        <p className="text-gray-400 italic">No link provided</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Payment & Contacts</p>
                      <p className="font-medium text-gray-700">PayPal: {v.paypal_account || 'N/A'}</p>
                      <p className="font-medium text-gray-700">WA: {v.whatsapp_account || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => verifyUser(v.id, 'approved')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => verifyUser(v.id, 'rejected')} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-10 text-center text-gray-500">No pending verification requests at the moment.</div>
              )}
            </div>
          </div>
        )}

        {/* PENDING PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Pending Product Approvals</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {pendingProducts.map(p => (
                <div key={p.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md bg-gray-50 flex flex-col justify-between">
                  <div>
                    <img src={p.image_url} alt="Product" className="w-full h-32 object-contain bg-white rounded mb-3 border p-2" />
                    <h4 className="font-bold text-gray-800 truncate">{p.product_name || p.store_name}</h4>
                    <div className="flex justify-between text-sm mt-2"><span className="text-gray-600">Price: <b className="text-black">${p.price}</b></span><span className="text-gray-600">Reward: <b className="text-green-600">${p.reward}</b></span></div>
                    <p className="text-xs text-gray-500 mt-2 truncate">Platform: {p.platform} | Qty: {p.required_orders}</p>
                    <div className="mt-3 bg-blue-50 p-2 rounded border border-blue-100">
                      <p className="text-xs text-blue-800 font-bold truncate">👤 {p.seller_name || 'N/A'}</p>
                      <p className="text-xs text-blue-600 truncate">✉️ {p.seller_email || 'N/A'} (ID: #{p.seller_id})</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <button onClick={() => { setSelectedProductDetails(p); setShowProductModal(true); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-bold hover:bg-gray-300 text-sm">View Details</button>
                    <button onClick={() => approveProduct(p.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 text-sm">Approve</button>
                  </div>
                </div>
              ))}
              {pendingProducts.length === 0 && <div className="col-span-full py-10 text-center text-gray-500">No products waiting for approval.</div>}
            </div>
          </div>
        )}

        {/* ALL PRODUCTS TAB */}
        {activeTab === 'all-products' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700">All Listed Products</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search product..." className="pl-9 pr-4 py-1.5 border rounded-full text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Seller Info</th>
                    <th className="p-4">Financials</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.image_url} alt="Product" className="w-12 h-12 rounded object-contain bg-white border p-1" />
                        <div>
                          <p className="font-bold text-gray-800 w-48 truncate">{p.product_name || p.store_name}</p>
                          <p className="text-xs text-gray-500">Platform: {p.platform}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-700">{p.seller_name}</p>
                        <p className="text-xs text-gray-500">{p.seller_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-700">Price: <span className="font-bold">${p.price}</span></p>
                        <p className="text-xs text-green-600 font-bold">Reward: ${p.reward}</p>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(p.status)}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setSelectedProductDetails(p); setShowProductModal(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allProducts.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No products found in the system.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Manage Buyer Orders & Applications</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-4">Buyer Info</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{app.buyer_name}</p>
                        <p className="text-xs text-gray-500 mb-1">{app.buyer_email}</p>
                        {app.ip_address && app.ip_address !== 'Unknown' && (
                          <div className="mt-1.5 flex flex-col items-start gap-1">
                             <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 inline-flex items-center gap-1">
                               🌍 {app.ip_location || 'Location Unknown'}
                             </span>
                             <a 
                               href={`https://ipinfo.io/${app.ip_address}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0066ff] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                               title="Track Applicant IP"
                             >
                               <MapPin size={10} /> {app.ip_address}
                             </a>
                          </div>
                        )}
                      </td>
                      <td className="p-4 flex items-center gap-3">
                        <img src={app.image_url} alt="Product" className="w-10 h-10 rounded object-contain bg-white border" />
                        <div>
                          <p className="font-bold text-gray-800 w-48 truncate">{app.product_name}</p>
                          <p className="text-xs text-green-600 font-bold">Reward: ${app.reward}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(app.status)}
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        {app.status === 'rejected' && (
                          <button 
                            onClick={() => deleteApplication(app.id)} 
                            className="bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm flex items-center justify-center gap-1"
                            title="Clear Record"
                          >
                            <Trash2 size={14}/> Clear
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedAppDetails(app); setShowAppDetailsModal(true); }} 
                          className="bg-white border border-gray-300 text-[#0066ff] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 shadow-sm flex items-center justify-center gap-1"
                        >
                          <Eye size={14}/> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No applications found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEPOSITS TAB */}
        {activeTab === 'deposits' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Pending Deposit Requests</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr><th className="p-4">User</th><th className="p-4">Amount</th><th className="p-4">Method</th><th className="p-4">Trx ID</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {deposits.map(d => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">{d.email}</td>
                      <td className="p-4 text-green-600 font-bold">${d.amount}</td>
                      <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{d.payment_method}</span></td>
                      <td className="p-4 font-mono text-gray-500">{d.transaction_id}</td>
                      <td className="p-4 text-right gap-2 flex justify-end">
                        <button onClick={() => approveDeposit(d.id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-semibold text-xs mr-2">Approve</button>
                        <button onClick={() => rejectDeposit(d.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold text-xs">Reject</button>
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No pending deposits.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Pending Withdrawal Requests</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr><th className="p-4">User Info</th><th className="p-4">Amount</th><th className="p-4">Method</th><th className="p-4">Account Details</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-bold text-gray-700">{w.name}</p>
                        <p className="text-xs text-gray-500">{w.email}</p>
                      </td>
                      <td className="p-4 text-red-600 font-bold">${w.amount}</td>
                      <td className="p-4"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">{w.payment_method}</span></td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">{w.account_details}</td>
                      <td className="p-4 text-right gap-2 flex justify-end">
                        <button onClick={() => { setWithdrawalToApprove(w); setShowApproveWithdrawalModal(true); }} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-semibold text-xs mr-2">Mark Paid</button>
                        <button onClick={() => rejectWithdrawal(w.id)} className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900 font-semibold text-xs">Reject & Refund</button>
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No pending withdrawals.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-700">Transaction History</h3>
              <div className="flex flex-wrap gap-2 bg-gray-200 p-1 rounded-lg">
                <button onClick={() => setSubTabHistory('withdrawals')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${subTabHistory === 'withdrawals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Withdrawals</button>
                <button onClick={() => setSubTabHistory('deposits')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${subTabHistory === 'deposits' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Deposits</button>
                <button onClick={() => setSubTabHistory('refunds')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${subTabHistory === 'refunds' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Product Refunds</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  {subTabHistory === 'withdrawals' ? (
                    <tr><th>User Info</th><th>Amount</th><th>Method & Account</th><th>Date</th><th className="text-right">Status & Details</th></tr>
                  ) : subTabHistory === 'deposits' ? (
                    <tr><th>User Info</th><th>Amount</th><th>Method & Trx ID</th><th>Date</th><th className="text-right">Status & Details</th></tr>
                  ) : (
                    <tr><th>Seller Info</th><th>Refund Amount</th><th>Description</th><th className="text-right">Date & Status</th></tr>
                  )}
                </thead>
                <tbody>
                  {subTabHistory === 'withdrawals' && historyWithdrawals.map(w => (
                    <tr key={w.id} className="border-b hover:bg-gray-50">
                      <td className="p-4"><p className="font-bold text-gray-700">{w.name}</p><p className="text-xs text-gray-500">{w.email}</p></td>
                      <td className="p-4 text-red-600 font-bold">${w.amount}</td>
                      <td className="p-4"><p className="font-bold text-gray-700">{w.payment_method}</p><p className="text-xs text-gray-500 max-w-[200px] truncate">{w.account_details}</p></td>
                      <td className="p-4 text-gray-600 text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right flex flex-col items-end gap-1">
                        {renderStatusBadge(w.status)}
                        <button onClick={() => openTrxDetails(w, 'withdrawal')} className="text-[#0066ff] text-[10px] font-bold hover:underline flex items-center gap-1 mt-1"><Eye size={12}/> View Details</button>
                      </td>
                    </tr>
                  ))}
                  {subTabHistory === 'deposits' && historyDeposits.map(d => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="p-4"><p className="font-bold text-gray-700">{d.name}</p><p className="text-xs text-gray-500">{d.email}</p></td>
                      <td className="p-4 text-green-600 font-bold">${d.amount}</td>
                      <td className="p-4"><p className="font-bold text-gray-700">{d.payment_method}</p><p className="text-xs text-gray-500 font-mono">{d.transaction_id}</p></td>
                      <td className="p-4 text-gray-600 text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right flex flex-col items-end gap-1">
                        {renderStatusBadge(d.status)}
                        <button onClick={() => openTrxDetails(d, 'deposit')} className="text-[#0066ff] text-[10px] font-bold hover:underline flex items-center gap-1 mt-1"><Eye size={12}/> View Details</button>
                      </td>
                    </tr>
                  ))}
                  {subTabHistory === 'refunds' && historyRefunds.map(r => (
                    <tr key={r.id} className="border-b hover:bg-gray-50 bg-red-50/20">
                      <td className="p-4"><p className="font-bold text-gray-700">{r.name}</p><p className="text-xs text-gray-500">{r.email}</p></td>
                      <td className="p-4 text-green-600 font-bold">+${Number(r.amount).toFixed(2)}</td>
                      <td className="p-4"><p className="text-sm text-gray-700 italic">{r.description}</p></td>
                      <td className="p-4 text-right"><span className="block text-gray-600 text-xs mb-1">{new Date(r.created_at).toLocaleDateString()}</span>{renderStatusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="space-y-6 animate-fade-in-up mt-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Megaphone size={20} className="text-[#0066ff]"/> Create New Announcement
              </h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <input required type="text" placeholder="Announcement Title" className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff]" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                <textarea required placeholder="Write your message here..." className="w-full p-3 border rounded-xl h-24 outline-none focus:border-[#0066ff]" value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}></textarea>
                <button type="submit" disabled={isPublishing} className="bg-[#0066ff] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50">
                  {isPublishing ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Recent Announcements</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">{announcements.length} Active</span>
              </div>
              <div className="divide-y">
                {announcements.map(a => (
                  <div key={a.id} className="p-4 hover:bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1 min-w-0"> 
                      <h4 className="font-bold text-gray-800 break-words">{a.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 break-words">{a.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDeleteAnnouncement(a.id)} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1 shrink-0">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                ))}
                {announcements.length === 0 && <p className="p-8 text-center text-gray-500 font-medium">No announcements published yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* BLOGS TAB */}
        {activeTab === 'blogs' && (
          <div className="space-y-6 animate-fade-in-up mt-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#0066ff]"/> Publish New Blog Post
              </h3>
              <form onSubmit={handleCreateBlog} className="space-y-4">
                <input required type="text" placeholder="Blog Title" className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff]" value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Feature Image (Optional)</label>
                    <input type="file" accept="image/*" id="blog-image-upload" className="w-full p-2 border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" onChange={e => setBlogImage(e.target.files[0])} />
                  </div>
                  <div className="flex items-center gap-2 md:mt-6">
                    <input type="checkbox" id="publish" className="w-4 h-4 cursor-pointer" checked={newBlog.is_published} onChange={e => setNewBlog({...newBlog, is_published: e.target.checked})} />
                    <label htmlFor="publish" className="text-sm font-bold text-gray-700 cursor-pointer">Publish Immediately</label>
                  </div>
                </div>

                <textarea required placeholder="Write the blog content here (Supports HTML/Text)..." className="w-full p-3 border rounded-xl h-40 outline-none focus:border-[#0066ff]" value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})}></textarea>
                
                <button type="submit" disabled={isPublishingBlog} className="bg-[#0066ff] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isPublishingBlog ? 'Publishing...' : <><FileText size={18} /> Publish Blog</>}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Manage Published Blogs</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">{adminBlogs.length} Total</span>
              </div>
              <div className="divide-y">
                {adminBlogs.map(blog => (
                  <div key={blog.id} className="p-4 hover:bg-gray-50 flex flex-col md:flex-row items-start md:items-center gap-4">
                    {blog.image_url ? (
                      <img src={blog.image_url} alt="blog" className="w-20 h-14 object-cover rounded-lg border bg-gray-100 shrink-0" />
                    ) : (
                      <div className="w-20 h-14 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 shrink-0"><ImageIcon size={20} /></div>
                    )}
                    <div className="flex-1 min-w-0"> 
                      <h4 className="font-bold text-gray-800 truncate">{blog.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{blog.content.substring(0, 100)}...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${blog.is_published ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{blog.is_published ? 'Published' : 'Draft'}</span>
                        <span className="text-[10px] text-gray-400">{new Date(blog.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteBlog(blog.id)} className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1 shrink-0">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                ))}
                {adminBlogs.length === 0 && <p className="p-8 text-center text-gray-500 font-medium">No blogs found.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN TICKET CHAT MODAL */}
        {showTicketViewModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 className="font-bold text-gray-800 text-sm pr-2">Ticket: {selectedTicket.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 inline-block rounded text-[10px] font-bold uppercase tracking-wider ${selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : selectedTicket.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>Status: {selectedTicket.status}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase bg-white border px-1.5 py-0.5 rounded">User: {selectedTicket.user_name}</span>
                    </div>
                 </div>
                 <button onClick={() => setShowTicketViewModal(false)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm rounded-full p-1 border border-gray-200 shrink-0"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white relative">
                 <div className="flex flex-col items-start">
                    <div className="max-w-[85%] bg-gray-100 border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm">{selectedTicket.message}</div>
                    <span className="text-[10px] text-gray-400 mt-1 font-bold">{selectedTicket.user_name} • {new Date(selectedTicket.created_at).toLocaleString()}</span>
                 </div>
                 {repliesLoading ? (
                   <div className="text-center text-xs text-gray-400 py-4 animate-pulse">Loading replies...</div>
                 ) : (
                   ticketReplies.map(reply => (
                     <div key={reply.id} className={`flex flex-col ${reply.user_role === 'admin' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${reply.user_role === 'admin' ? 'bg-[#0066ff] text-white rounded-tr-sm' : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                           {reply.message}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                           {reply.user_role === 'admin' ? <span className="font-bold text-[#0066ff]">You (Admin)</span> : <span className="font-bold">{reply.user_name}</span>} • {new Date(reply.created_at).toLocaleString()}
                        </span>
                     </div>
                   ))
                 )}
              </div>

              <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
                 {selectedTicket.status === 'closed' ? (
                    <div className="text-center py-2 text-sm font-bold text-gray-500 bg-gray-200 rounded-xl border border-gray-300">This ticket is closed and resolved.</div>
                 ) : (
                    <>
                      <form onSubmit={handleReplyTicket} className="flex gap-2">
                        <input type="text" required value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type your reply to the user..." className="flex-1 p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] transition-all" />
                        <button type="submit" disabled={isSubmittingTicket} className="bg-[#0066ff] text-white p-3 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"><Send size={18} className={isSubmittingTicket ? 'animate-pulse' : ''} /></button>
                      </form>
                      <button onClick={() => handleCloseTicket(selectedTicket.id)} className="w-full mt-2 text-xs font-bold text-gray-500 bg-white border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition-colors">Mark Ticket as Resolved & Close</button>
                    </>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* APPROVE WITHDRAWAL MODAL */}
        {showApproveWithdrawalModal && withdrawalToApprove && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><Wallet className="text-green-500" /> Confirm Payment Sent</h3>
              <p className="text-sm text-gray-600 mb-4">You are marking a withdrawal of <b className="text-red-600">${withdrawalToApprove.amount}</b> to <b className="text-gray-800">{withdrawalToApprove.name}</b> as Paid.</p>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Transfer To:</p>
                <p className="font-semibold text-sm">{withdrawalToApprove.payment_method}</p>
                <p className="font-mono text-sm break-all bg-white p-1 mt-1 border rounded">{withdrawalToApprove.account_details}</p>
              </div>

              <form onSubmit={submitWithdrawalApproval} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Transaction ID (Required)</label>
                  <input required type="text" className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" value={withdrawalProof.transaction_id} onChange={e => setWithdrawalProof({...withdrawalProof, transaction_id: e.target.value})} placeholder="e.g., TRX123456789" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Payment Screenshot (Optional / Required)</label>
                  <input type="file" accept="image/*" onChange={handleWithdrawalImageUpload} className="w-full p-2 border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" />
                  {isUploadingWithdrawalProof && <p className="text-xs text-green-600 mt-1 animate-pulse font-semibold">Uploading image to secure storage...</p>}
                  {withdrawalProof.screenshot_url && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image successfully attached!</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => { setShowApproveWithdrawalModal(false); setWithdrawalToApprove(null); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                  <button type="submit" disabled={isUploadingWithdrawalProof} className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 shadow-md disabled:opacity-50">Mark Paid & Notify User</button>
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
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 capitalize"><Wallet size={20} className={trxType === 'deposit' ? 'text-green-500' : 'text-red-500'}/> {trxType} Details</h3>
                <button onClick={() => setShowTrxDetailsModal(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
              </div>
              
              <div className="space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="flex justify-between"><span className="font-bold text-gray-500">User:</span> <span className="font-semibold">{selectedTrx.name || selectedTrx.email}</span></p>
                <div className="w-full h-px bg-gray-200"></div>
                <p className="flex justify-between"><span className="font-bold text-gray-500">Amount:</span> <span className={`font-black text-lg ${trxType === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>${Number(selectedTrx.amount).toFixed(2)}</span></p>
                <div className="w-full h-px bg-gray-200"></div>
                <p className="flex justify-between"><span className="font-bold text-gray-500">Method:</span> <span className="font-semibold">{selectedTrx.payment_method}</span></p>
                <div className="w-full h-px bg-gray-200"></div>
                
                {trxType === 'withdrawal' && selectedTrx.account_details && (
                  <div className="bg-white p-2 border rounded"><span className="font-bold text-gray-500 block text-xs mb-1">To Account:</span><span className="font-mono text-xs break-all">{selectedTrx.account_details}</span></div>
                )}

                {(selectedTrx.transaction_id || selectedTrx.screenshot_url) && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded mt-2">
                    <p className="font-bold text-blue-800 text-xs mb-2 uppercase border-b border-blue-200 pb-1">Payment Proof</p>
                    {selectedTrx.transaction_id && <p className="text-xs mb-2"><span className="font-semibold">Trx ID:</span> <span className="font-mono bg-white px-1 border rounded">{selectedTrx.transaction_id}</span></p>}
                    {selectedTrx.screenshot_url && <a href={selectedTrx.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#0066ff] font-bold hover:underline text-xs bg-white px-2 py-1 rounded border border-blue-200 w-max"><ImageIcon size={14} /> View Screenshot</a>}
                  </div>
                )}
                
                <div className="w-full h-px bg-gray-200"></div>
                <p className="flex justify-between"><span className="font-bold text-gray-500">Date:</span> <span>{new Date(selectedTrx.created_at).toLocaleString()}</span></p>
                <div className="w-full h-px bg-gray-200"></div>
                <p className="flex justify-between items-center"><span className="font-bold text-gray-500">Status:</span> {renderStatusBadge(selectedTrx.status)}</p>
              </div>
              <div className="mt-6"><button onClick={() => setShowTrxDetailsModal(false)} className="w-full bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl hover:bg-gray-300 transition-colors">Close</button></div>
            </div>
          </div>
        )}

        {/* APPEAL DETAILS MODAL */}
        {showAppealModal && selectedAppeal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Scale size={24} className="text-indigo-500"/> Appeal Details</h3>
                <button onClick={() => setShowAppealModal(false)} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                  <button onClick={() => fetchAndShowUserProfile(selectedAppeal.user_id)} className="absolute top-4 right-4 text-[#0066ff] text-xs font-bold hover:underline flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-1 rounded"><Eye size={14} /> View Profile</button>
                  <p className="font-bold text-gray-800 text-lg">{selectedAppeal.name}</p>
                  <p className="text-sm text-gray-500">{selectedAppeal.email}</p>
                  <div className="flex gap-2 mt-2"><span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-gray-300">{selectedAppeal.role}</span>{renderStatusBadge(selectedAppeal.status)}</div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <p className="font-bold text-indigo-800 mb-2 text-sm">{selectedAppeal.appeal_type === 'order_dispute' ? 'Seller Reason for Rejecting Review:' : 'Appeal Message:'}</p>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto bg-white p-3 rounded-lg border border-indigo-50">{selectedAppeal.reason}</div>
                </div>

                {selectedAppeal.status === 'pending' && selectedAppeal.appeal_type === 'order_dispute' && (
                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><AlertTriangle size={16} className="text-orange-500"/> Admin Decision Comment</label>
                    <textarea className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20 text-sm" placeholder="Explain why you are favoring the buyer or seller. This will be sent to the user..." value={disputeComment} onChange={(e) => setDisputeComment(e.target.value)}></textarea>
                    <p className="text-[10px] text-gray-500 mt-1">Required to resolve the dispute.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-200">
                <button onClick={() => setShowAppealModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors mr-auto">Close</button>
                {selectedAppeal.status === 'pending' && selectedAppeal.appeal_type !== 'order_dispute' && (
                  <>
                    <button onClick={() => { rejectAppeal(selectedAppeal.id); setShowAppealModal(false); }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors">Reject</button>
                    <button onClick={() => { approveAppeal(selectedAppeal.id); setShowAppealModal(false); }} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors">Approve & Unban</button>
                  </>
                )}
                {selectedAppeal.status === 'pending' && selectedAppeal.appeal_type === 'order_dispute' && (
                  <>
                    <button onClick={() => handleDisputeFavorSeller(selectedAppeal.id, selectedAppeal.application_id)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm text-xs">Favor Seller (Reject Order)</button>
                    <button onClick={() => handleDisputeFavorBuyer(selectedAppeal.id, selectedAppeal.application_id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm text-xs">Favor Buyer (Go to Refund)</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* USER PROFILE MODAL */}
        {showUserProfileModal && selectedUserProfile && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><User size={24} className="text-blue-500"/> User Profile</h3>
                <button onClick={() => setShowUserProfileModal(false)} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-800 text-lg">{selectedUserProfile.name}</p>
                  <p className="text-sm text-gray-500">{selectedUserProfile.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold uppercase">{selectedUserProfile.role}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold uppercase">Trust Score: {selectedUserProfile.trust_score || '5.0'}</span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold uppercase">${Number(selectedUserProfile.wallet_balance || 0).toFixed(2)}</span>
                  </div>
                </div>

                {selectedUserProfile.role === 'buyer' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div onClick={() => setProfileViewMode(profileViewMode === 'pending' ? 'details' : 'pending')} className={`border rounded-xl p-3 text-center flex flex-col items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${profileViewMode === 'pending' ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-500' : 'bg-blue-50 border-blue-100'}`}>
                      <Clock size={18} className="text-blue-500 mb-1" />
                      <p className="text-xl font-black text-blue-700 leading-none">{userAppStats.active}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">Pending</p>
                    </div>
                    <div onClick={() => setProfileViewMode(profileViewMode === 'success' ? 'details' : 'success')} className={`border rounded-xl p-3 text-center flex flex-col items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${profileViewMode === 'success' ? 'bg-green-100 border-green-300 ring-2 ring-green-500' : 'bg-green-50 border-green-100'}`}>
                      <CheckCircle size={18} className="text-green-500 mb-1" />
                      <p className="text-xl font-black text-green-700 leading-none">{userAppStats.success}</p>
                      <p className="text-[10px] font-bold text-green-500 uppercase mt-1">Success</p>
                    </div>
                    <div onClick={() => setProfileViewMode(profileViewMode === 'failed' ? 'details' : 'failed')} className={`border rounded-xl p-3 text-center flex flex-col items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${profileViewMode === 'failed' ? 'bg-red-100 border-red-300 ring-2 ring-red-500' : 'bg-red-50 border-red-100'}`}>
                      <XCircle size={18} className="text-red-500 mb-1" />
                      <p className="text-xl font-black text-red-700 leading-none">{userAppStats.failed}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase mt-1">Failed</p>
                    </div>
                  </div>
                )}

                {selectedUserProfile.role === 'seller' && (
                  <div className="grid grid-cols-4 gap-2">
                    <div onClick={() => setProfileViewMode(profileViewMode === 'listed' ? 'details' : 'listed')} className={`border rounded-xl p-2 text-center flex flex-col items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${profileViewMode === 'listed' ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-500' : 'bg-purple-50 border-purple-100'}`}>
                      <Package size={16} className="text-purple-500 mb-1" />
                      <p className="text-lg font-black text-purple-700 leading-none">{userAppStats.listed}</p>
                      <p className="text-[9px] font-bold text-purple-500 uppercase mt-1">Listed</p>
                    </div>
                    <div onClick={() => setProfileViewMode(profileViewMode === 'pending' ? 'details' : 'pending')} className={`border rounded-xl p-2 text-center flex flex-col items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${profileViewMode === 'pending' ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-500' : 'bg-blue-50 border-blue-100'}`}>
                      <Clock size={16} className="text-blue-500 mb-1" />
                      <p className="text-lg font-black text-blue-700 leading-none">{userAppStats.active}</p>
                      <p className="text-[9px] font-bold text-blue-500 uppercase mt-1">Pending</p>
                    </div>
                    <div onClick={() => setProfileViewMode(profileViewMode === 'success' ? 'details' : 'success')} className={`border rounded-xl p-2 text-center flex flex-col items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${profileViewMode === 'success' ? 'bg-green-100 border-green-300 ring-2 ring-green-500' : 'bg-green-50 border-green-100'}`}>
                      <CheckCircle size={16} className="text-green-500 mb-1" />
                      <p className="text-lg font-black text-green-700 leading-none">{userAppStats.success}</p>
                      <p className="text-[9px] font-bold text-green-500 uppercase mt-1">Success</p>
                    </div>
                    <div onClick={() => setProfileViewMode(profileViewMode === 'failed' ? 'details' : 'failed')} className={`border rounded-xl p-2 text-center flex flex-col items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${profileViewMode === 'failed' ? 'bg-red-100 border-red-300 ring-2 ring-red-500' : 'bg-red-50 border-red-100'}`}>
                      <AlertTriangle size={16} className="text-red-500 mb-1" />
                      <p className="text-lg font-black text-red-700 leading-none">{userAppStats.failed}</p>
                      <p className="text-[9px] font-bold text-red-500 uppercase mt-1">Issues</p>
                    </div>
                  </div>
                )}

                {profileViewMode === 'details' ? (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-2 text-sm">
                    <p><span className="font-bold text-gray-700 w-32 inline-block">Amazon Acc:</span> {selectedUserProfile.amazon_account || 'N/A'}</p>
                    <p><span className="font-bold text-gray-700 w-32 inline-block">Amazon Loc:</span> {selectedUserProfile.amazon_location || 'N/A'}</p>
                    <p><span className="font-bold text-gray-700 w-32 inline-block">PayPal Account:</span> {selectedUserProfile.paypal_account || 'N/A'}</p>
                    <p><span className="font-bold text-gray-700 w-32 inline-block">WhatsApp:</span> {selectedUserProfile.whatsapp_account || 'N/A'}</p>
                    <p><span className="font-bold text-gray-700 w-32 inline-block">Facebook:</span> {selectedUserProfile.facebook_account || 'N/A'}</p>
                    <p><span className="font-bold text-gray-700 w-32 inline-block">Telegram:</span> {selectedUserProfile.telegram_account || 'N/A'}</p>
                    <p><span className="font-bold text-gray-700 w-32 inline-block">Verification:</span> <span className="uppercase font-bold text-indigo-600">{selectedUserProfile.verification_status}</span></p>
                    
                    {selectedUserProfile.last_ip && (
                      <div className="mt-2 border-t border-indigo-100 pt-2 space-y-1.5">
                        <p className="flex items-center"><span className="font-bold text-gray-700 w-32 inline-block">Login Location:</span><span className="font-bold text-gray-800 bg-white px-2 py-0.5 border border-indigo-200 rounded text-xs">🌍 {selectedUserProfile.ip_location || 'Unknown'}</span></p>
                        <p className="flex items-center"><span className="font-bold text-gray-700 w-32 inline-block">Last Login IP:</span><span className="font-mono text-gray-800 bg-white px-2 py-0.5 border border-indigo-200 rounded mr-2 text-xs">{selectedUserProfile.last_ip}</span>
                          {selectedUserProfile.last_ip !== 'Unknown' && (
                            <a href={`https://ipinfo.io/${selectedUserProfile.last_ip}`} target="_blank" rel="noreferrer" className="text-[#0066ff] text-[10px] font-bold hover:underline flex items-center gap-1 inline-flex bg-blue-50 border border-blue-200 px-2 py-1 rounded"><MapPin size={12} /> Track Map</a>
                          )}
                        </p>
                      </div>
                    )}
                    {selectedUserProfile.amazon_profile_url && (
                      <div className="mt-3"><a href={selectedUserProfile.amazon_profile_url} target="_blank" rel="noreferrer" className="block text-center bg-white border border-indigo-200 text-indigo-600 py-2 rounded-lg font-bold hover:bg-indigo-100">Open Amazon Profile ↗</a></div>
                    )}
                  </div>
                ) : profileViewMode === 'listed' ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
                     <div className="flex justify-between items-center mb-3 sticky top-0 bg-gray-50 pb-2 border-b"><h4 className="font-bold text-gray-700 capitalize flex items-center gap-1"><Package size={16} className="text-purple-500"/> Listed Products</h4><button onClick={() => setProfileViewMode('details')} className="text-xs text-blue-600 hover:underline font-bold">Back to Details</button></div>
                     <div className="space-y-2">
                       {sellerProductsList.map(p => (
                          <div key={p.id} onClick={() => { setSelectedProductDetails(p); setShowProductModal(true); }} className="flex gap-3 bg-white p-2 rounded-lg border border-gray-200 items-center shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                             {p.image_url ? (<img src={p.image_url} alt="Product" className="w-10 h-10 object-contain border rounded bg-gray-50 p-0.5" />) : (<div className="w-10 h-10 bg-gray-100 border rounded flex items-center justify-center text-[8px] text-gray-400">No Img</div>)}
                             <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{p.product_name || p.store_name}</p><p className="text-[10px] text-gray-500 font-semibold mt-0.5">Price: ${p.price} | Target: {p.required_orders}</p></div>
                             <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded shrink-0 ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : p.status === 'stopped' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                          </div>
                       ))}
                       {sellerProductsList.length === 0 && <div className="text-center py-6 text-gray-400 text-xs font-semibold">No listed products found.</div>}
                     </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
                     <div className="flex justify-between items-center mb-3 sticky top-0 bg-gray-50 pb-2 border-b">
                       <h4 className="font-bold text-gray-700 capitalize flex items-center gap-1">
                         {profileViewMode === 'pending' && <Clock size={16} className="text-blue-500"/>}
                         {profileViewMode === 'success' && <CheckCircle size={16} className="text-green-500"/>}
                         {profileViewMode === 'failed' && <AlertTriangle size={16} className="text-red-500"/>}
                         {profileViewMode} Orders
                       </h4>
                       <button onClick={() => setProfileViewMode('details')} className="text-xs text-blue-600 hover:underline font-bold">Back to Details</button>
                     </div>
                     <div className="space-y-2">
                       {selectedUserApps.filter(app => {
                           if(profileViewMode === 'pending') return !['completed', 'rejected'].includes(app.status);
                           if(profileViewMode === 'success') return app.status === 'completed';
                           if(profileViewMode === 'failed') return app.status === 'rejected';
                           return false;
                       }).map(app => (
                          <div key={app.id} onClick={() => { setSelectedAppDetails(app); setShowAppDetailsModal(true); }} className="flex gap-3 bg-white p-2 rounded-lg border border-gray-200 items-center shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                             {app.image_url ? (<img src={app.image_url} alt="Product" className="w-10 h-10 object-contain border rounded bg-gray-50 p-0.5" />) : (<div className="w-10 h-10 bg-gray-100 border rounded flex items-center justify-center text-[8px] text-gray-400">No Img</div>)}
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{app.product_name}</p>
                               {selectedUserProfile.role === 'seller' ? (<p className="text-[10px] text-gray-500 font-semibold mt-0.5">Buyer: {app.buyer_email}</p>) : (<p className="text-[10px] text-gray-500 font-semibold mt-0.5">Reward: <span className="text-green-600 font-bold">${app.reward}</span></p>)}
                             </div>
                             <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded shrink-0 ${app.status === 'completed' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{app.status.replace('_', ' ')}</span>
                          </div>
                       ))}
                       {selectedUserApps.filter(app => {
                           if(profileViewMode === 'pending') return !['completed', 'rejected'].includes(app.status);
                           if(profileViewMode === 'success') return app.status === 'completed';
                           if(profileViewMode === 'failed') return app.status === 'rejected';
                           return false;
                       }).length === 0 && <div className="text-center py-6 text-gray-400 text-xs font-semibold">No {profileViewMode} orders found.</div>}
                     </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end pt-4 border-t"><button onClick={() => setShowUserProfileModal(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">Close Profile</button></div>
            </div>
          </div>
        )}

        {/* PRODUCT DETAILS MODAL */}
        {showProductModal && selectedProductDetails && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-2xl font-bold text-gray-800">Review Product Details</h3>
                <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                   <img src={selectedProductDetails.image_url} alt="Product" className="w-full h-48 object-contain bg-white rounded-lg border shadow-sm p-2" />
                   
                   <div className="mt-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Total Deposit Deducted</p>
                      
                      {/* USD & Local Currency Display */}
                      <div className="flex flex-col gap-1 mb-4">
                         <p className="text-2xl font-black text-yellow-700">
                            ${parseFloat(selectedProductDetails.total_deposit || 0).toFixed(2)} <span className="text-sm font-bold text-gray-500">USD</span>
                         </p>
                         <p className="text-sm font-bold text-gray-600 bg-yellow-100/50 w-max px-2 py-0.5 rounded border border-yellow-200">
                            ~ {getConvertedPrice(selectedProductDetails.total_deposit, selectedProductDetails.country, selectedProductDetails.platform)} <span className="text-[10px] uppercase">Local ({selectedProductDetails.country || 'N/A'})</span>
                         </p>
                      </div>

                      {/* Seller Balance Deduction Math */}
                      <div className="space-y-2 text-xs font-semibold bg-white p-3 rounded-lg border border-yellow-100">
                         <div className="flex justify-between text-gray-600">
                            <span>Previous Balance:</span>
                            <span>${(parseFloat(selectedProductDetails.seller_wallet_balance || 0) + parseFloat(selectedProductDetails.total_deposit || 0)).toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-red-500 border-b border-gray-100 pb-2">
                            <span>Deducted (This Product):</span>
                            <span>- ${parseFloat(selectedProductDetails.total_deposit || 0).toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-green-700 pt-1 font-bold">
                            <span>Remaining Balance:</span>
                            <span>${parseFloat(selectedProductDetails.seller_wallet_balance || 0).toFixed(2)}</span>
                         </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-3 text-center italic">Safely held by system</p>
                   </div>
                </div>
                
                <div className="md:col-span-2 space-y-3 text-sm">
                  <div className="bg-gray-100 p-2 rounded border mb-3 flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    <div>
                      <p className="font-bold text-gray-800">{selectedProductDetails.seller_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{selectedProductDetails.seller_email || 'N/A'} (ID: #{selectedProductDetails.seller_id})</p>
                    </div>
                    <button onClick={() => { setShowProductModal(false); fetchAndShowUserProfile(selectedProductDetails.seller_id); }} className="ml-auto bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1">
                      <Eye size={14} /> View Profile
                    </button>
                  </div>

                  <p><span className="font-semibold text-gray-500 w-24 inline-block">Product:</span> <span className="font-bold text-gray-800">{selectedProductDetails.product_name}</span></p>
                  <p><span className="font-semibold text-gray-500 w-24 inline-block">Store Name:</span> {selectedProductDetails.store_name}</p>
                  <p><span className="font-semibold text-gray-500 w-24 inline-block">Keyword:</span> <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">{selectedProductDetails.search_keyword}</span></p>
                  <p><span className="font-semibold text-gray-500 w-24 inline-block">Category:</span> <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{selectedProductDetails.category || 'General'}</span></p>
                  <p><span className="font-semibold text-gray-500 w-24 inline-block">Platform:</span> {selectedProductDetails.platform} ({selectedProductDetails.country})</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                    <span className="font-semibold text-gray-500 w-24 shrink-0 inline-block">Financials:</span> 
                    <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100">
                       Price: <b>${selectedProductDetails.price}</b> <span className="text-[10px] text-gray-400 font-bold ml-1">({getConvertedPrice(selectedProductDetails.price, selectedProductDetails.country, selectedProductDetails.platform)} Local)</span>
                    </span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span className="bg-green-50 px-2 py-1 rounded border border-green-100">
                       Reward: <b className="text-green-600">${selectedProductDetails.reward}</b> <span className="text-[10px] text-green-600/70 font-bold ml-1">({getConvertedPrice(selectedProductDetails.reward, selectedProductDetails.country, selectedProductDetails.platform)} Local)</span>
                    </span>
                  </div>
                  <p><span className="font-semibold text-gray-500 w-24 inline-block">Status:</span> {renderStatusBadge(selectedProductDetails.status)}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 mt-2">
                    <p className="text-sm"><span className="font-semibold text-gray-500 mr-2">Target Qty:</span> <b className="text-gray-800">{selectedProductDetails.required_orders}</b></p>
                    <div className="w-px h-4 bg-blue-200 hidden sm:block"></div>
                    <p className="text-sm"><span className="font-semibold text-gray-500 mr-2">Available Qty:</span> <b className="text-[#0066ff] text-lg">{Math.max(0, selectedProductDetails.required_orders - (selectedProductDetails.application_count || 0))}</b></p>
                  </div>
                  
                  <div className="mt-2"><span className="font-semibold text-gray-500 block mb-1">Product Link:</span><a href={selectedProductDetails.product_link?.startsWith('http') ? selectedProductDetails.product_link : `https://${selectedProductDetails.product_link}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all bg-gray-50 p-2 block rounded border">{selectedProductDetails.product_link}</a></div>
                  <div className="mt-2"><span className="font-semibold text-gray-500 block mb-1">Seller Instructions:</span><p className="bg-gray-100 p-3 rounded text-gray-800 whitespace-pre-wrap border">{selectedProductDetails.instructions}</p></div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowProductModal(false)} className="px-5 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 mr-auto">Close</button>
                {selectedProductDetails.status === 'pending' && (
                  <><button onClick={() => rejectProduct(selectedProductDetails.id)} className="px-5 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 shadow-md">Reject & Refund</button><button onClick={() => approveProduct(selectedProductDetails.id)} className="px-5 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow-md">Approve Product</button></>
                )}
                {selectedProductDetails.status === 'approved' && (<button onClick={() => stopProductAction(selectedProductDetails.id)} className="px-5 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600 shadow-md">Stop Product</button>)}
                {selectedProductDetails.status === 'stopped' && (
                  <><button onClick={() => rejectProduct(selectedProductDetails.id)} className="px-5 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 shadow-md">Delete & Refund</button><button onClick={() => resumeProductAction(selectedProductDetails.id)} className="px-5 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 shadow-md">Resume Product</button></>
                )}
              </div>
            </div>
          </div>
        )}

        {/* APPLICATION DETAILS MODAL */}
        {showAppDetailsModal && selectedAppDetails && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-2xl font-bold text-gray-800">Application & Order Details</h3>
                <button onClick={() => setShowAppDetailsModal(false)} className="text-gray-500 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                 <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded font-bold uppercase text-sm border border-purple-200">Status: {selectedAppDetails.status.replace('_', ' ')}</span>
                 {selectedAppDetails.category && (<span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded font-bold uppercase text-sm border border-yellow-300">Task: {selectedAppDetails.category}</span>)}
              </div>

              {selectedAppDetails.status === 'disputed' && (
                <div className="bg-pink-100 text-pink-800 p-4 rounded-xl border border-pink-200 mb-4 font-bold text-center flex flex-col items-center justify-center gap-2">
                  <AlertTriangle size={24}/>This order is currently under dispute. Please resolve it from the "User Appeals" tab.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div className="space-y-4">
                   <div className="bg-gray-50 p-4 rounded-lg border">
                     <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Product Info</h4>
                     <img src={selectedAppDetails.image_url} alt="Product" className="w-16 h-16 object-contain bg-white border rounded mb-2" />
                     <p className="text-sm font-semibold text-gray-800">{selectedAppDetails.product_name}</p>
                     <p className="text-xs text-gray-500 mt-1 mb-2">Product Reward: <span className="text-green-600 font-bold">${selectedAppDetails.reward}</span></p>

                     <div className="space-y-1.5 text-xs pt-3 border-t border-gray-200">
                        {selectedAppDetails.store_name && <p><span className="font-semibold text-gray-500 w-16 inline-block">Store:</span> <span className="font-bold">{selectedAppDetails.store_name}</span></p>}
                        {selectedAppDetails.platform && <p><span className="font-semibold text-gray-500 w-16 inline-block">Platform:</span> <span className="font-bold">{selectedAppDetails.platform} {selectedAppDetails.country && `(${selectedAppDetails.country})`}</span></p>}
                        {selectedAppDetails.search_keyword && <p><span className="font-semibold text-gray-500 w-16 inline-block">Keyword:</span> <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">{selectedAppDetails.search_keyword}</span></p>}
                        {selectedAppDetails.product_link && <p className="flex items-start gap-1"><span className="font-semibold text-gray-500 w-16 shrink-0 inline-block">Link:</span> <a href={selectedAppDetails.product_link?.startsWith('http') ? selectedAppDetails.product_link : `https://${selectedAppDetails.product_link}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">Click Here ↗</a></p>}
                     </div>
                     {selectedAppDetails.instructions && (
                        <div className="mt-3 bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                          <span className="font-bold text-gray-500 block mb-1">Seller Instructions:</span><p className="text-gray-700 italic">{selectedAppDetails.instructions}</p>
                        </div>
                     )}
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 relative">
                       <h4 className="font-bold text-blue-800 mb-2 border-b border-blue-200 pb-1 flex items-center justify-between">Buyer<span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">⭐ {selectedAppDetails.trust_score ? parseFloat(selectedAppDetails.trust_score).toFixed(1) : '5.0'}</span></h4>
                       <p className="text-sm font-semibold truncate">{selectedAppDetails.buyer_name}</p>
                       <p className="text-xs text-gray-600 truncate">{selectedAppDetails.buyer_email}</p>
                       <button onClick={() => { setShowAppDetailsModal(false); fetchAndShowUserProfile(selectedAppDetails.user_id); }} className="mt-3 w-full bg-white border border-blue-200 text-blue-600 py-1.5 rounded text-xs font-bold hover:bg-blue-100">Buyer Profile</button>
                     </div>
                     <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 relative">
                       <h4 className="font-bold text-purple-800 mb-2 border-b border-purple-200 pb-1">Seller</h4>
                       <p className="text-sm font-semibold truncate">{selectedAppDetails.seller_name || 'N/A'}</p>
                       <p className="text-xs text-gray-600 truncate">{selectedAppDetails.seller_email || 'N/A'}</p>
                       <button onClick={() => { setShowAppDetailsModal(false); fetchAndShowUserProfile(selectedAppDetails.seller_id); }} disabled={!selectedAppDetails.seller_id} className="mt-3 w-full bg-white border border-purple-200 text-purple-600 py-1.5 rounded text-xs font-bold hover:bg-purple-100 disabled:opacity-50">Seller Profile</button>
                     </div>
                   </div>
                </div>

                <div className="space-y-4">
                   {(selectedAppDetails.status === 'order_submitted' || selectedAppDetails.status === 'order_approved' || selectedAppDetails.status === 'forwarded_to_seller' || selectedAppDetails.status === 'review_submitted' || selectedAppDetails.status === 'pending_refund' || selectedAppDetails.status === 'completed' || selectedAppDetails.status === 'disputed' || selectedAppDetails.status === 'rejected') && selectedAppDetails.order_number && (
                     <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                       <h4 className="font-bold text-indigo-800 mb-2 border-b border-indigo-200 pb-1">Order Submission</h4>
                       <p className="text-sm"><span className="font-semibold text-gray-600">Order No:</span> {selectedAppDetails.order_number || 'N/A'}</p>
                       {selectedAppDetails.screenshot_url && (<p className="text-sm mt-1"><span className="font-semibold text-gray-600">Screenshot 1:</span> <a href={selectedAppDetails.screenshot_url} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">View Image Link</a></p>)}
                       {selectedAppDetails.screenshot_url_2 && (<p className="text-sm mt-1"><span className="font-semibold text-gray-600">Screenshot 2:</span> <a href={selectedAppDetails.screenshot_url_2} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">View Image Link</a></p>)}
                       {selectedAppDetails.order_comment && (<div className="mt-3 text-sm bg-white p-2 rounded border border-indigo-100"><span className="font-semibold text-gray-600 text-xs block mb-1">Buyer Comment:</span><p className="text-gray-700 italic">{selectedAppDetails.order_comment}</p></div>)}
                     </div>
                   )}

                   {(selectedAppDetails.status === 'review_submitted' || selectedAppDetails.status === 'forwarded_to_seller' || selectedAppDetails.status === 'pending_refund' || selectedAppDetails.status === 'completed' || selectedAppDetails.status === 'disputed' || selectedAppDetails.status === 'rejected') && (selectedAppDetails.review_link || selectedAppDetails.review_screenshot_url || selectedAppDetails.review_screenshot_url_2) && (
                     <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                       <h4 className="font-bold text-pink-800 mb-2 border-b border-pink-200 pb-1">Review Submission</h4>
                       {selectedAppDetails.review_link && (<p className="text-sm mb-2"><span className="font-semibold text-gray-600">Review Link:</span> <a href={selectedAppDetails.review_link} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">Click to Open</a></p>)}
                       {selectedAppDetails.review_screenshot_url && (<p className="text-sm"><span className="font-semibold text-gray-600">Screenshot 1:</span> <a href={selectedAppDetails.review_screenshot_url} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">View Image Link</a></p>)}
                       {selectedAppDetails.review_screenshot_url_2 && (<p className="text-sm mt-1"><span className="font-semibold text-gray-600">Screenshot 2:</span> <a href={selectedAppDetails.review_screenshot_url_2} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">View Image Link</a></p>)}
                     </div>
                   )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-xl flex-wrap">
                <button onClick={() => setShowAppDetailsModal(false)} className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors mr-auto">Close</button>
                {selectedAppDetails.status === 'pending' && (
                  <>
                    <button onClick={() => actionApplication(selectedAppDetails.id, 'reject')} className="bg-red-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-600 shadow-md">Reject Apply</button>
                    {selectedAppDetails.category === 'Pre-Pay' ? (<button onClick={() => { setRefundAppId(selectedAppDetails.id); setShowRefundModal(true); }} className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 shadow-md">Approve & Pay (External)</button>) : (<button onClick={() => actionApplication(selectedAppDetails.id, 'approve')} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md">Approve Apply</button>)}
                  </>
                )}
                {selectedAppDetails.status === 'order_submitted' && (
                  <>
                    <button onClick={() => actionApplication(selectedAppDetails.id, 'reject-order')} className="bg-red-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-600 shadow-md">Reject Order</button>
                    {selectedAppDetails.category === 'No Review' ? (<button onClick={() => actionApplication(selectedAppDetails.id, 'forward')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-md">Forward to Seller</button>) : (<button onClick={() => actionApplication(selectedAppDetails.id, 'approve-order')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-md">Approve Order</button>)}
                  </>
                )}
                {selectedAppDetails.status === 'forwarded_to_seller' && (<div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold w-full md:w-auto text-center border border-yellow-200">Waiting for Seller Verification</div>)}
                {selectedAppDetails.status === 'review_submitted' && (
                  <><button onClick={() => actionApplication(selectedAppDetails.id, 'reject-review')} className="bg-red-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-600 shadow-md">Reject Review</button><button onClick={() => actionApplication(selectedAppDetails.id, 'forward')} className="bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-600 shadow-md">Forward to Seller</button><button onClick={() => actionApplication(selectedAppDetails.id, 'approve-review')} className="bg-pink-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-pink-700 shadow-md">Force Approve (Admin)</button></>
                )}
                {selectedAppDetails.status === 'pending_refund' && (<button onClick={() => { setRefundAppId(selectedAppDetails.id); setShowRefundModal(true); }} className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 shadow-md">Process Refund</button>)}
              </div>
            </div>
          </div>
        )}

        {/* DYNAMIC REFUND / PAYMENT MODAL */}
        {showRefundModal && selectedAppDetails && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedAppDetails.category === 'Pre-Pay' ? 'Confirm Pre-Pay (External)' : 'Confirm Refund Payment'}</h3>
              <div className={`border p-3 rounded-lg mb-4 ${selectedAppDetails.category === 'Pre-Pay' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                 {selectedAppDetails.category === 'Pre-Pay' ? (
                   <p className="text-sm text-orange-800 font-semibold leading-relaxed">You are marking this Pre-Pay application as paid. Send the funds directly to the buyer's external account (e.g. PayPal) and submit the proof below. <strong className="font-black text-red-600">Funds will NOT be added to the system wallet.</strong></p>
                 ) : (
                   <p className="text-sm text-green-800 font-semibold leading-relaxed">Funds (Product Price + Reward) will be added directly to the buyer's wallet. The buyer will be notified that they can withdraw this balance at any time.</p>
                 )}
              </div>
              <form onSubmit={submitRefund} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{selectedAppDetails.category === 'Pre-Pay' ? 'Transaction ID (Optional)' : 'Admin Order Number'}</label>
                  <input type="text" className="w-full p-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={refundData.orderNumber} onChange={e => setRefundData({...refundData, orderNumber: e.target.value})} placeholder={selectedAppDetails.category === 'Pre-Pay' ? 'Enter Trx ID...' : 'Enter Order Number...'} />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Payment Screenshot (Optional / Required)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleRefundImageUpload} 
                    className="w-full p-2 border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                  />
                  {isUploadingRefundProof && <p className="text-xs text-blue-600 mt-1 animate-pulse font-semibold">Uploading image to secure storage...</p>}
                  {refundData.screenshot_url && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image successfully attached!</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Admin Comment (Optional)</label>
                  <textarea className="w-full p-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20" value={refundData.comment} onChange={e => setRefundData({...refundData, comment: e.target.value})} placeholder="Great job..." />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowRefundModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                  <button type="submit" disabled={isUploadingRefundProof} className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md disabled:opacity-50">{selectedAppDetails.category === 'Pre-Pay' ? 'Confirm Payment' : 'Send Refund'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}