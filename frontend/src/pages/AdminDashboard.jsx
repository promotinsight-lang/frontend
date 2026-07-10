import AdminChatNotifier from '../components/admin/AdminChatNotifier';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCcw, CheckCircle, XCircle, Eye, Search, ShieldCheck, ShieldAlert, Snowflake, Play, Star, Users, Trash2, Scale, Package, Wallet, Image as ImageIcon, BarChart3, Calendar, Headset, MessageCircle, History, Megaphone, MapPin, FileText, Settings, Edit, Briefcase, LayoutDashboard, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import { ResponsiveTableShell, AdminMobileCard, AdminField } from '../components/admin/AdminMobileUi';
import VerificationFieldsGuide from '../components/admin/VerificationFieldsGuide';
import PaymentMethodsManager from '../components/admin/PaymentMethodsManager';

// --- ৮টি মডাল ইম্পোর্ট (Imports) ---
import FullImageModal from '../components/admin/FullImageModal';
import RefundModal from '../components/admin/RefundModal';
import ApproveWithdrawalModal from '../components/admin/ApproveWithdrawalModal';
import TrxDetailsModal from '../components/admin/TrxDetailsModal';
import AppealDetailsModal from '../components/admin/AppealDetailsModal';
import UserProfileModal from '../components/admin/UserProfileModal';
import ProductDetailsModal from '../components/admin/ProductDetailsModal';
import AppDetailsModal from '../components/admin/AppDetailsModal';
import { getCurrencyForCountry } from '../utils/currency';
import PrivateChatAdminPanel from '../components/admin/PrivateChatAdminPanel';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

const parseMaybeJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getVerificationPlatforms = (verification) => {
  const platforms = parseMaybeJson(verification?.verification_platforms, []);
  if (Array.isArray(platforms) && platforms.length > 0) return platforms;
  if (verification?.amazon_account || verification?.amazon_profile_url) return ['Amazon'];
  return [];
};

const getVerificationResponses = (verification) =>
  parseMaybeJson(verification?.verification_responses, {});

const getVerificationGlobalDetails = (verification) => {
  const global = getVerificationResponses(verification)?.global || {};
  return {
    email: global.paypal_account || verification?.paypal_account || '',
    whatsapp: global.whatsapp_account || verification?.whatsapp_account || '',
    wechat: global.facebook_account || verification?.facebook_account || '',
    telegram: global.telegram_account || verification?.telegram_account || '',
  };
};

const getVerificationPlatformDetails = (verification) => {
  const responses = getVerificationResponses(verification);
  const platforms = getVerificationPlatforms(verification);

  return platforms.map((platformName, index) => ({
    name: platformName,
    values: responses?.platforms?.[platformName] || {
      account_name: index === 0 ? verification?.amazon_account : '',
      profile_url: index === 0 ? verification?.amazon_profile_url : '',
    },
  }));
};

export default function AdminDashboard() {
  const location = useLocation();
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
  
  const [, setPaymentSettings] = useState([]);
  const [applications, setApplications] = useState([]); 
  const [verifications, setVerifications] = useState([]); 
  const [appeals, setAppeals] = useState([]); 

  const [usersList, setUsersList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [subTabHistory, setSubTabHistory] = useState('withdrawals');

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  
  // Refund Modal States (ক্লিন করা হয়েছে)
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAppId, setRefundAppId] = useState(null);

  const [showAppDetailsModal, setShowAppDetailsModal] = useState(false);
  const [selectedAppDetails, setSelectedAppDetails] = useState(null);

  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userAppStats, setUserAppStats] = useState({ listed: 0, active: 0, success: 0, failed: 0 });
  const [selectedUserApps, setSelectedUserApps] = useState([]); 
  const [sellerProductsList, setSellerProductsList] = useState([]); 
  const [profileViewMode, setProfileViewMode] = useState('details'); 

  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);

  // Withdrawal Modal States (ক্লিন করা হয়েছে)
  const [showApproveWithdrawalModal, setShowApproveWithdrawalModal] = useState(false);
  const [withdrawalToApprove, setWithdrawalToApprove] = useState(null);

  const [showTrxDetailsModal, setShowTrxDetailsModal] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [trxType, setTrxType] = useState('');

  const [supportTickets, setSupportTickets] = useState([]);
  const [, setSelectedTicket] = useState(null);
  const [, setTicketReplies] = useState([]);
  const [showTicketViewModal, setShowTicketViewModal] = useState(false);
  const [, setRepliesLoading] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  const [adminBlogs, setAdminBlogs] = useState([]);
  const [newBlog, setNewBlog] = useState({ title: '', content: '', is_published: true });
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogImage, setBlogImage] = useState(null);
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);

  // Full Image Lightbox States for Admin View Details
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState('');

  // Helper for Dual Currency Calculation
  const getConvertedPrice = (amount, country, platform) => {
    if (!amount) return '0.00';
    const config = allFeeConfigs.find(c => c.country?.toLowerCase() === country?.toLowerCase() && c.platform?.toLowerCase() === platform?.toLowerCase());
    const rate = config && config.exchange_rate ? parseFloat(config.exchange_rate) : 1;
    return (parseFloat(amount) * rate).toFixed(2);
  };

  // 🔥 DYNAMIC FEE CONFIGURATION STATES
  const [feeConfig, setFeeConfig] = useState({
    country: '', platform: '', platform_charge: [{ min: '', max: '', fee: '' }], buyer_reward: '', 
    buyer_refund_fee: '', seller_deposit_fee: '', seller_withdrawal_fee: '', exchange_rate: 1,
    verification_fields: [
      { key: 'account_name', label: 'Account Name', type: 'text', required: true, placeholder: 'Account name on this platform' },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: true, placeholder: 'Profile URL on this platform' },
    ],
  });
  const [allFeeConfigs, setAllFeeConfigs] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [globalVerificationFields, setGlobalVerificationFields] = useState([]);
  const [verificationConfigLoading, setVerificationConfigLoading] = useState(false);
  const getAuthHeaders = () => {
    const headers = {};
    return headers;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
    else setActiveTab('overview');
  }, [location.search]);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showProductModal || showRefundModal || showAppDetailsModal || showUserProfileModal || showAppealModal || showApproveWithdrawalModal || showTrxDetailsModal || showTicketViewModal || showFullImageModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showProductModal, showRefundModal, showAppDetailsModal, showUserProfileModal, showAppealModal, showApproveWithdrawalModal, showTrxDetailsModal, showTicketViewModal, showFullImageModal]);

  // 🔥 FETCH ALL SAVED CONFIGURATIONS
  const fetchAllFeeConfigs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/config/fees/all`, { 
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
      const res = await fetch(`${API_BASE}/api/config/fees?country=${country}&platform=${platform}`, { 
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
          } catch {}
        }

        const fetchedRate = data.data.exchange_rate || 1;
        // 🔥 NEW: Tiers গুলোকে UI এর জন্য Local Currency তে কনভার্ট করা
        parsedTiers = parsedTiers.map(t => ({
            min: t.min ? (parseFloat(t.min) * fetchedRate).toFixed(2) : '',
            max: t.max ? (parseFloat(t.max) * fetchedRate).toFixed(2) : '',
            fee: t.fee ? (parseFloat(t.fee) * fetchedRate).toFixed(2) : ''
        }));

        let parsedVerificationFields = [
          { key: 'account_name', label: 'Account Name', type: 'text', required: true, placeholder: 'Account name on this platform' },
          { key: 'profile_url', label: 'Profile URL', type: 'url', required: true, placeholder: 'Profile URL on this platform' },
        ];
        if (Array.isArray(data.data.verification_fields) && data.data.verification_fields.length > 0) {
          parsedVerificationFields = data.data.verification_fields;
        } else if (typeof data.data.verification_fields === 'string') {
          try {
            const parsed = JSON.parse(data.data.verification_fields);
            if (Array.isArray(parsed) && parsed.length > 0) parsedVerificationFields = parsed;
          } catch { /* keep defaults */ }
        }

        let platformVerFields = parsedVerificationFields;
        try {
          const vRes = await fetch(
            `${API_BASE}/api/admin/verification-config/platform?country=${encodeURIComponent(country)}&platform=${encodeURIComponent(platform)}`,
            { headers: getAuthHeaders(), credentials: 'include' }
          );
          if (vRes.ok) {
            const vData = await vRes.json();
            if (vData.success && Array.isArray(vData.data) && vData.data.length > 0) {
              platformVerFields = vData.data;
            }
          }
        } catch { /* use fee row fields */ }

        const localReward = data.data.buyer_reward ? (parseFloat(data.data.buyer_reward) * fetchedRate).toFixed(2) : '';

        setFeeConfig({
          country: data.data.country, platform: data.data.platform, platform_charge: parsedTiers,
          buyer_reward: localReward, buyer_refund_fee: data.data.buyer_refund_fee,
          seller_deposit_fee: data.data.seller_deposit_fee, seller_withdrawal_fee: data.data.seller_withdrawal_fee,
          exchange_rate: fetchedRate,
          verification_fields: platformVerFields,
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
      } catch {}
    }

    const rate = config.exchange_rate || 1;
    // 🔥 NEW: Tiers গুলোকে UI এর জন্য Local Currency তে কনভার্ট করা
    parsedTiers = parsedTiers.map(t => ({
        min: t.min ? (parseFloat(t.min) * rate).toFixed(2) : '',
        max: t.max ? (parseFloat(t.max) * rate).toFixed(2) : '',
        fee: t.fee ? (parseFloat(t.fee) * rate).toFixed(2) : ''
    }));

    let parsedVerificationFields = [
      { key: 'account_name', label: 'Account Name', type: 'text', required: true, placeholder: 'Account name on this platform' },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: true, placeholder: 'Profile URL on this platform' },
    ];
    if (Array.isArray(config.verification_fields) && config.verification_fields.length > 0) {
      parsedVerificationFields = config.verification_fields;
    } else if (typeof config.verification_fields === 'string') {
      try {
        const parsed = JSON.parse(config.verification_fields);
        if (Array.isArray(parsed) && parsed.length > 0) parsedVerificationFields = parsed;
      } catch { /* keep defaults */ }
    }

    const localReward = config.buyer_reward ? (parseFloat(config.buyer_reward) * rate).toFixed(2) : '';

    setFeeConfig({
      country: config.country, platform: config.platform, platform_charge: parsedTiers,
      buyer_reward: localReward, buyer_refund_fee: config.buyer_refund_fee,
      seller_deposit_fee: config.seller_deposit_fee, seller_withdrawal_fee: config.seller_withdrawal_fee,
      exchange_rate: rate,
      verification_fields: parsedVerificationFields,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchGlobalVerificationFields = async () => {
    setVerificationConfigLoading(true);
    try {
      let res = await fetch(`${API_BASE}/api/admin/verification-config/global`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/api/config/verification/global`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setGlobalVerificationFields(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerificationConfigLoading(false);
    }
  };

  const saveGlobalVerificationFields = async () => {
    const success = await handleAction(
      `${API_BASE}/api/admin/verification-config/global`,
      'POST',
      { fields: globalVerificationFields }
    );
    if (success) fetchGlobalVerificationFields();
  };

  const savePlatformVerificationFields = async () => {
    if (!feeConfig.country.trim() || !feeConfig.platform.trim()) {
      alert('Enter Country and Platform above first (same as tariffs).');
      return;
    }
    const success = await handleAction(
      `${API_BASE}/api/admin/verification-config/platform`,
      'POST',
      {
        country: feeConfig.country.trim(),
        platform: feeConfig.platform.trim(),
        fields: feeConfig.verification_fields,
      }
    );
    if (success) fetchFeeConfig(feeConfig.country, feeConfig.platform);
  };

  const handleVerificationFieldChange = (index, prop, value) => {
    setFeeConfig((prev) => {
      const fields = [...prev.verification_fields];
      fields[index] = { ...fields[index], [prop]: prop === 'required' ? Boolean(value) : value };
      return { ...prev, verification_fields: fields };
    });
  };

  const handleAddVerificationField = () => {
    setFeeConfig((prev) => ({
      ...prev,
      verification_fields: [
        ...prev.verification_fields,
        { key: `field_${prev.verification_fields.length + 1}`, label: 'New Field', type: 'text', required: false, placeholder: '' },
      ],
    }));
  };

  const handleRemoveVerificationField = (index) => {
    setFeeConfig((prev) => ({
      ...prev,
      verification_fields: prev.verification_fields.filter((_, i) => i !== index),
    }));
  };

  const handleGlobalVerificationFieldChange = (index, prop, value) => {
    setGlobalVerificationFields((prev) => {
      const fields = [...prev];
      fields[index] = { ...fields[index], [prop]: prop === 'required' ? Boolean(value) : value };
      return fields;
    });
  };

  const handleAddGlobalVerificationField = () => {
    setGlobalVerificationFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: 'New Field', type: 'text', required: false, placeholder: '' },
    ]);
  };

  const handleRemoveGlobalVerificationField = (index) => {
    setGlobalVerificationFields((prev) => prev.filter((_, i) => i !== index));
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

    const currentRate = parseFloat(feeConfig.exchange_rate) || 1;
    const usdReward = feeConfig.buyer_reward ? (parseFloat(feeConfig.buyer_reward) / currentRate).toFixed(4) : '';

    // 🔥 NEW: Tiers গুলোকে Database এর জন্য USD তে কনভার্ট করা
    const usdTiers = feeConfig.platform_charge.map(t => ({
        min: t.min ? (parseFloat(t.min) / currentRate).toFixed(4) : '',
        max: t.max ? (parseFloat(t.max) / currentRate).toFixed(4) : '',
        fee: t.fee ? (parseFloat(t.fee) / currentRate).toFixed(4) : ''
    }));

    const payload = {
      ...feeConfig,
      buyer_reward: usdReward,
      platform_charge: JSON.stringify(usdTiers),
      verification_fields: feeConfig.verification_fields,
    };
    
    const success = await handleAction(`${API_BASE}/api/config/fees`, 'POST', payload);
    if (success) {
      await handleAction(
        `${API_BASE}/api/admin/verification-config/platform`,
        'POST',
        {
          country: feeConfig.country.trim(),
          platform: feeConfig.platform.trim(),
          fields: feeConfig.verification_fields,
        }
      );
      fetchAllFeeConfigs();
    }
  };

  const handleDeleteFeeConfig = async (country, platform) => {
    if (window.confirm(`Are you sure you want to delete the fee configuration for ${country} - ${platform}?`)) {
        const success = await handleAction(`${API_BASE}/api/config/fees/${encodeURIComponent(country)}/${encodeURIComponent(platform)}`, 'DELETE');
        if (success) fetchAllFeeConfigs();
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/monthly-stats?month=${selectedMonth}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setMonthlyReport(data.data);
    } catch { }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  const fetchDeposits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/deposits`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) { setDeposits(data.data.filter(d => d.status === 'pending')); setHistoryDeposits(data.data); }
    } catch {}
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/withdrawals/all`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) { setWithdrawals(data.data.filter(w => w.status === 'pending')); setHistoryWithdrawals(data.data); }
    } catch {}
  };

  const fetchRefunds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products/refunds/all`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setHistoryRefunds(data.data); 
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) { setAllProducts(data.data); setPendingProducts(data.data.filter(p => p.status === 'pending')); }
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/payment-settings`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setPaymentSettings(data.data);
    } catch {}
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/all`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setApplications(data.data);
    } catch {}
  };

  const fetchVerifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verifications`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setVerifications(data.data.filter(v => v.verification_status === 'pending'));
    } catch {}
  };

  const fetchUsers = async (role) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/admin/role/${role}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setUsersList(data.data);
    } catch {}
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/appeals`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setAppeals(data.data);
    } catch {}
  };

  const fetchSupportTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/support/all`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setSupportTickets(data.data);
    } catch {}
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/announcements/admin/all`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch {}
  };

  const fetchAdminBlogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blogs/admin/all`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if (data.success) setAdminBlogs(data.data);
    } catch {}
  };

  const fetchAndShowUserProfile = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/admin/user/${userId}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      
      if (data.success) {
        setSelectedUserProfile(data.data);
        setProfileViewMode('details'); 
        
        try {
          const appRes = await fetch(`${API_BASE}/api/applications/all`, { headers: getAuthHeaders(), credentials: 'include' });
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
                 const prodRes = await fetch(`${API_BASE}/api/products`, { headers: getAuthHeaders(), credentials: 'include' });
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
        } catch {}
        setShowUserProfileModal(true);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    fetchMonthlyReport();
    if (activeTab === 'deposits' || activeTab === 'history') fetchDeposits();
    if (activeTab === 'withdrawals' || activeTab === 'history') fetchWithdrawals();
    if (activeTab === 'history') fetchRefunds(); 
    if (activeTab === 'products' || activeTab === 'all-products') fetchProducts();
    fetchAllFeeConfigs(); // 🔥 Exchange rates সব ট্যাবের জন্য লোড হবে
    if (activeTab === 'settings') { fetchSettings(); fetchGlobalVerificationFields(); } 
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
    } catch { alert('Connection Error.'); return false; }
  };

  const approveDeposit = async (id) => { if(window.confirm('Approve Deposit?')) { if(await handleAction(`${API_BASE}/api/admin/deposits/${id}/approve`)) fetchDeposits(); } };
  const rejectDeposit = async (id) => { if(window.confirm('Reject Deposit?')) { if(await handleAction(`${API_BASE}/api/admin/deposits/${id}/reject`)) fetchDeposits(); } };
  
  const rejectWithdrawal = async (id) => { if(window.confirm('Reject Withdrawal and Refund Wallet?')) { if(await handleAction(`${API_BASE}/api/withdrawals/${id}/reject`)) fetchWithdrawals(); } };
  const approveProduct = async (id) => { if(window.confirm('Approve product?')) { if(await handleAction(`${API_BASE}/api/products/${id}/approve`)) { fetchProducts(); setShowProductModal(false); } } };
  const rejectProduct = async (id) => { if(window.confirm('Reject product and refund?')) { if(await handleAction(`${API_BASE}/api/products/${id}/reject`, 'PATCH')) { fetchProducts(); setShowProductModal(false); } } };
  const stopProductAction = async (id) => { if(window.confirm('Stop this product? It will appear as Sold Out.')) { if(await handleAction(`${API_BASE}/api/products/${id}/stop`, 'PATCH')) { fetchProducts(); setShowProductModal(false); } } };
  const resumeProductAction = async (id) => { if(window.confirm('Resume this product? It will be live and available again.')) { if(await handleAction(`${API_BASE}/api/products/${id}/resume`, 'PATCH')) { fetchProducts(); setShowProductModal(false); } } };
  const verifyUser = async (id, status) => { if(window.confirm(`Mark user as ${status}?`)) { if(await handleAction(`${API_BASE}/api/admin/verify-user/${id}`, 'PATCH', { status })) fetchVerifications(); } };

  const approveAppeal = async (id) => { if(window.confirm('Approve this appeal and reactivate the account?')) { if(await handleAction(`${API_BASE}/api/admin/appeals/${id}/approve`)) fetchAppeals(); } };
  const rejectAppeal = async (id) => { if(window.confirm('Reject this appeal? The account will remain disabled.')) { if(await handleAction(`${API_BASE}/api/admin/appeals/${id}/reject`)) fetchAppeals(); } };

  const actionApplication = async (appId, actionType) => {
    if(window.confirm(`Proceed to ${actionType.replace('-', ' ')}?`)) {
      if(await handleAction(`${API_BASE}/api/applications/${appId}/${actionType}`)) {
         fetchApplications(); setShowAppDetailsModal(false);
      }
    }
  };

  const deleteApplication = async (appId) => {
    if(window.confirm('Are you sure you want to permanently clear this rejected application record?')) {
      if(await handleAction(`${API_BASE}/api/applications/${appId}/delete`, 'DELETE')) {
         fetchApplications(); setShowAppDetailsModal(false);
      }
    }
  };

  // Submit Refund (Updated to accept refundData from modal)
  const submitRefund = async (refundData) => {
    if(await handleAction(`${API_BASE}/api/applications/${refundAppId}/confirm-refund`, 'PATCH', {
      refund_order_number: refundData.orderNumber, 
      refund_screenshot_url: refundData.screenshot_url || refundData.orderNumber,
      refund_comment: refundData.comment
    })) {
      setShowRefundModal(false); setShowAppDetailsModal(false); fetchApplications();
    }
  };

  const toggleUserStatus = async (id, payload) => {
    if(window.confirm('Are you sure you want to change this user\'s status?')) {
      if(await handleAction(`${API_BASE}/api/users/admin/status/${id}`, 'PATCH', payload)) fetchUsers(activeTab === 'all-buyers' ? 'buyer' : 'seller');
    }
  };

  const updateTrust = async (id, oldScore) => {
    const score = prompt("Enter new Trust Score (0.0 - 5.0):", oldScore ?? "0.0");
    if (score !== null && !isNaN(score)) {
      if(await handleAction(`${API_BASE}/api/users/${id}/trust-score`, 'PATCH', { trust_score: parseFloat(score) })) fetchUsers(activeTab === 'all-buyers' ? 'buyer' : 'seller');
    }
  };

  const openTicketView = async (ticket) => {
    setSelectedTicket(ticket); setShowTicketViewModal(true); setRepliesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/${ticket.id}`, { headers: getAuthHeaders(), credentials: 'include' });
      const data = await res.json();
      if(res.ok) { setTicketReplies(data.data.replies || []); setSelectedTicket(data.data.ticket); }
    } catch {} finally { setRepliesLoading(false); }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault(); setIsPublishing(true);
    const success = await handleAction(`${API_BASE}/api/announcements`, 'POST', newAnnouncement);
    if (success) { setNewAnnouncement({ title: '', message: '' }); fetchAnnouncements(); }
    setIsPublishing(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      const success = await handleAction(`${API_BASE}/api/announcements/${id}`, 'DELETE');
      if (success) fetchAnnouncements();
    }
  };

  const resetBlogForm = () => {
    setNewBlog({ title: '', content: '', is_published: true });
    setEditingBlog(null);
    setBlogImage(null);
    const input = document.getElementById('blog-image-upload');
    if (input) input.value = '';
  };

  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setNewBlog({
      title: blog.title || '',
      content: blog.content || '',
      is_published: blog.is_published !== false,
    });
    setBlogImage(null);
    const input = document.getElementById('blog-image-upload');
    if (input) input.value = '';
    document.getElementById('blog-editor-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const applyBlogFormat = (tag) => {
    const textarea = document.getElementById('blog-content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = newBlog.content.slice(start, end);
    const fallback = tag === 'strong' ? 'bold text' : tag === 'h1' ? 'Main title' : 'Section title';
    const wrapped = `<${tag}>${selected || fallback}</${tag}>`;
    const content = `${newBlog.content.slice(0, start)}${wrapped}${newBlog.content.slice(end)}`;
    setNewBlog((prev) => ({ ...prev, content }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrapped.length, start + wrapped.length);
    }, 0);
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content) return alert("Title and content are required.");
    setIsPublishingBlog(true);
    const formData = new FormData();
    formData.append("title", newBlog.title); formData.append("content", newBlog.content); formData.append("is_published", newBlog.is_published);
    if (blogImage) formData.append("image", blogImage); 
    try {
      const endpoint = editingBlog ? `${API_BASE}/api/blogs/${editingBlog.id}` : `${API_BASE}/api/blogs`;
      const res = await fetch(endpoint, { method: editingBlog ? "PUT" : "POST", headers: getAuthHeaders(), body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(editingBlog ? "Blog updated successfully!" : "Blog published successfully!");
        resetBlogForm();
        fetchAdminBlogs();
      } else alert(data.message || (editingBlog ? "Failed to update blog." : "Failed to publish blog."));
    } catch {}
    setIsPublishingBlog(false);
  };

  const handleDeleteBlog = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      const success = await handleAction(`${API_BASE}/api/blogs/${id}`, 'DELETE');
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
      
      {/* 🔴 Global Admin Chat Notifier */}
      <AdminChatNotifier />
      
      <div className="bg-[#0066ff] pt-6 pb-12 px-4 shadow-lg text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
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
            fetchAllFeeConfigs(); // 🔥 রিফ্রেশ বাটনেও রেট ফেচ হবে
            if(activeTab === 'settings') { fetchSettings(); fetchGlobalVerificationFields(); }
          }} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all">
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 -mt-6">

        <div className="bg-white p-2 rounded-xl shadow-sm border mb-6 flex overflow-x-auto gap-2 scrollbar-hide hide-scrollbar">
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
            { id: 'live-chat', icon: <MessageSquare size={16} />, label: 'Live Chat' },
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
              <h3 className="font-bold text-gray-700 capitalize flex items-center gap-2 w-full md:w-auto">
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

            <ResponsiveTableShell
              empty={
                usersList.filter(
                  (u) =>
                    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                ).length === 0
              }
              emptyMessage="No users found."
              mobile={usersList
                .filter(
                  (u) =>
                    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                )
                .map((user) => (
                  <AdminMobileCard
                    key={user.id}
                    title={user.name}
                    subtitle={user.email}
                    className={!user.is_active ? 'border-red-200 bg-red-50/40' : ''}
                    actions={
                      <>
                        <button
                          onClick={() => fetchAndShowUserProfile(user.id)}
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="View Full Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, { is_frozen: !user.is_frozen })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex flex-1 items-center justify-center gap-1 ${user.is_frozen ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
                        >
                          {user.is_frozen ? (
                            <>
                              <Play size={14} /> Unfreeze
                            </>
                          ) : (
                            <>
                              <Snowflake size={14} /> Freeze
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, { is_active: !user.is_active })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex flex-1 items-center justify-center gap-1 ${!user.is_active ? 'bg-green-500 text-white border-green-500' : 'bg-red-50 text-red-600 border-red-100'}`}
                        >
                          {user.is_active ? (
                            <>
                              <ShieldAlert size={14} /> Disable
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} /> Enable
                            </>
                          )}
                        </button>
                      </>
                    }
                  >
                    <AdminField label="Verification">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.verification_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                      >
                        {user.verification_status}
                      </span>
                    </AdminField>
                    <AdminField label="Trust">
                      <button
                        onClick={() => updateTrust(user.id, user.trust_score)}
                        className="flex items-center gap-1 text-orange-500 font-bold ml-auto"
                      >
                        <Star size={14} fill="currentColor" /> {Number(user.trust_score || 0).toFixed(1)}
                      </button>
                    </AdminField>
                    <AdminField label="Rank">
                      <span className="flex items-center gap-1 text-indigo-600 font-bold ml-auto">
                        <ShieldCheck size={14} /> {user.user_rank || 'New User'}
                      </span>
                    </AdminField>
                    <AdminField label="Wallet">
                      <span className="text-green-600 font-bold">
                        ${Number(user.wallet_balance).toFixed(2)}
                      </span>
                    </AdminField>
                    {user.last_ip && user.last_ip !== 'Unknown' && (
                      <AdminField label="IP" align="start">
                        <span className="text-xs">{user.ip_location || 'Unknown'}</span>
                        <a
                          href={`https://ipinfo.io/${user.last_ip}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0066ff] text-xs font-bold block mt-1"
                        >
                          {user.last_ip}
                        </a>
                      </AdminField>
                    )}
                  </AdminMobileCard>
                ))}
            >
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Trust Score / Rank</th>
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
                        <div className="flex flex-col items-start gap-1">
                          <button
                            onClick={() => updateTrust(user.id, user.trust_score)}
                            className="flex items-center gap-1 text-orange-500 font-bold hover:bg-orange-50 px-2 py-1 rounded border border-transparent hover:border-orange-200 transition-colors"
                            title="Click to edit trust score"
                          >
                            <Star size={14} fill="currentColor" /> {Number(user.trust_score || 0).toFixed(1)}
                          </button>
                          <span className="flex items-center gap-1 text-indigo-600 font-bold px-2 py-1 rounded bg-indigo-50 border border-indigo-100">
                            <ShieldCheck size={14} /> {user.user_rank || 'New User'}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500 px-2">
                            {Number(user.completed_orders || 0)} completed
                          </span>
                        </div>
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
                </tbody>
              </table>
            </ResponsiveTableShell>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
              <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Monthly Business Report</h3>
                    <p className="text-xs text-gray-500">Performance overview by selected month</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border shadow-sm w-full sm:w-auto">
                  <Calendar size={18} className="text-gray-400 ml-2" />
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="p-1.5 text-sm font-bold text-gray-700 outline-none cursor-pointer w-full"
                  />
                </div>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <Settings size={22} className="text-[#0066ff]" /> Dynamic Tariffs & Fee Configuration
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-semibold">
                Type Country and Platform to automatically fetch, configure, or update active system parameters using UPSERT logic.
              </p>

              <form onSubmit={handleSaveFeeConfig} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
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
                  
                  <div className="col-span-full mb-2 bg-gray-50 border p-4 rounded-xl overflow-x-auto">
                    <div className="flex justify-between items-center mb-4 min-w-[300px]">
                      <div>
                        <label className="block text-sm font-bold text-gray-800">Dynamic Tier-Based Platform Charge</label>
                        <p className="text-[10px] text-gray-500">Set fixed fees based on the product price range.</p>
                      </div>
                      <button type="button" onClick={handleAddTier} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors shrink-0">+ Add Tier</button>
                    </div>
                    
                    {feeConfig.platform_charge.map((tier, index) => {
                      const currentCurrency = getCurrencyForCountry(feeConfig.country);
                      return (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 mb-3 sm:items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm min-w-[300px]">
                        <div className="flex-1 w-full"><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Min Price ({currentCurrency.code})</label><input type="number" step="0.01" min="0" required value={tier.min} onChange={(e) => handleTierChange(index, 'min', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#0066ff]" placeholder="e.g. 1" /></div>
                        <div className="flex-1 w-full"><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Max Price ({currentCurrency.code})</label><input type="number" step="0.01" min="0" required value={tier.max} onChange={(e) => handleTierChange(index, 'max', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#0066ff]" placeholder="e.g. 20" /></div>
                        <div className="flex-1 w-full"><label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Fixed Fee ({currentCurrency.code})</label><input type="number" step="0.01" min="0" required value={tier.fee} onChange={(e) => handleTierChange(index, 'fee', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#0066ff]" placeholder="e.g. 2" /></div>
                        {feeConfig.platform_charge.length > 1 && (
                          <div className="pb-1 mt-2 sm:mt-0"><button type="button" onClick={() => handleRemoveTier(index)} className="p-2 w-full sm:w-auto bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors flex justify-center" title="Remove Tier"><Trash2 size={16} /></button></div>
                        )}
                      </div>
                    )})}
                  </div>

                  {/* 🔥 NEW: Exchange Rate Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Exchange Rate (1 USD = ?)</label>
                    <input type="number" step="0.0001" min="0.0001" required placeholder="e.g. 1.0000" className="w-full p-2.5 border rounded-lg font-semibold text-sm outline-none focus:border-[#0066ff]" value={feeConfig.exchange_rate} onChange={(e) => handleFeeSelectorChange('exchange_rate', e.target.value)} />
                  </div>
                  {(() => {
                    const currentCurrency = getCurrencyForCountry(feeConfig.country);
                    return (
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Buyer Reward (Fixed in {currentCurrency.code})
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                            {currentCurrency.symbol}
                          </span>
                          <input 
                            type="number" 
                            step="0.01" 
                            required 
                            placeholder="0.00" 
                            className="w-full pl-8 pr-12 p-2.5 border rounded-lg font-semibold text-sm outline-none focus:border-[#0066ff]" 
                            value={feeConfig.buyer_reward} 
                            onChange={(e) => handleFeeSelectorChange('buyer_reward', e.target.value)} 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                            {currentCurrency.code}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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

                <div className="col-span-full mb-2 bg-amber-50 border border-amber-100 p-4 rounded-xl overflow-x-auto">
                  <VerificationFieldsGuide variant="platform" />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-800">Buyer Verification Fields (this Country + Platform)</label>
                      <p className="text-[10px] text-gray-500">Buyer verification-এ এই country + platform বেছে নিলে এই ফিল্ডগুলো দেখাবে। Tariffs আলাদা; নিচের বাটন দিয়ে শুধু verification সেভ করুন।</p>
                    </div>
                    <button type="button" onClick={handleAddVerificationField} className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 shrink-0">+ Add Field</button>
                  </div>
                  {feeConfig.verification_fields.map((field, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-3 bg-white p-3 rounded-lg border items-end min-w-[300px]">
                      <div><label className="text-[10px] font-bold text-gray-500">Key</label><input value={field.key} onChange={(e) => handleVerificationFieldChange(index, 'key', e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="account_name" /></div>
                      <div className="sm:col-span-2"><label className="text-[10px] font-bold text-gray-500">Label</label><input value={field.label} onChange={(e) => handleVerificationFieldChange(index, 'label', e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Amazon Account Name" /></div>
                      <div><label className="text-[10px] font-bold text-gray-500">Type</label><select value={field.type} onChange={(e) => handleVerificationFieldChange(index, 'type', e.target.value)} className="w-full p-2 border rounded text-sm"><option value="text">Text</option><option value="email">Email</option><option value="url">URL</option><option value="tel">Phone</option></select></div>
                      <div><label className="text-[10px] font-bold text-gray-500">Placeholder</label><input value={field.placeholder || ''} onChange={(e) => handleVerificationFieldChange(index, 'placeholder', e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Example for buyer..." /></div>
                      <div className="flex items-center justify-between lg:justify-start gap-2 pb-1">
                        <label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={!!field.required} onChange={(e) => handleVerificationFieldChange(index, 'required', e.target.checked)} /> Required</label>
                        {feeConfig.verification_fields.length > 1 && (
                          <button type="button" onClick={() => handleRemoveVerificationField(index)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={savePlatformVerificationFields}
                    disabled={!feeConfig.country || !feeConfig.platform}
                    className="w-full sm:w-auto bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-50 mt-2"
                  >
                    Save Verification Fields (this Country + Platform)
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <button type="submit" disabled={feeLoading || !feeConfig.country || !feeConfig.platform} className="w-full sm:w-auto bg-[#0066ff] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50">Save & Apply Tariffs (fees only)</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-2 border-b pb-2 flex items-center gap-2">
                <ShieldCheck size={22} className="text-green-600" /> Global Buyer Verification Fields
              </h3>
              <p className="text-xs text-gray-500 mb-2">Email, WhatsApp, WeChat, Telegram, etc. — buyer যেকোনো country/platform বেছে নিলেও দেখাবে।</p>
              <VerificationFieldsGuide variant="global" />
              {verificationConfigLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="space-y-3 mb-4 min-w-[300px]">
                    {globalVerificationFields.map((field, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-gray-50 p-3 rounded-lg border items-end">
                        <div><label className="text-[10px] font-bold text-gray-500">Key</label><input value={field.key} onChange={(e) => handleGlobalVerificationFieldChange(index, 'key', e.target.value)} className="w-full p-2 border rounded text-sm bg-white" placeholder="paypal_account" /></div>
                        <div className="sm:col-span-2"><label className="text-[10px] font-bold text-gray-500">Label</label><input value={field.label} onChange={(e) => handleGlobalVerificationFieldChange(index, 'label', e.target.value)} className="w-full p-2 border rounded text-sm bg-white" placeholder="Email Address" /></div>
                        <div><label className="text-[10px] font-bold text-gray-500">Type</label><select value={field.type} onChange={(e) => handleGlobalVerificationFieldChange(index, 'type', e.target.value)} className="w-full p-2 border rounded text-sm bg-white"><option value="text">Text</option><option value="email">Email</option><option value="url">URL</option><option value="tel">Phone</option></select></div>
                        <div><label className="text-[10px] font-bold text-gray-500">Placeholder</label><input value={field.placeholder || ''} onChange={(e) => handleGlobalVerificationFieldChange(index, 'placeholder', e.target.value)} className="w-full p-2 border rounded text-sm bg-white" placeholder="yourname@email.com" /></div>
                        <div className="flex items-center justify-between lg:justify-start gap-2 pb-1">
                          <label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={!!field.required} onChange={(e) => handleGlobalVerificationFieldChange(index, 'required', e.target.checked)} /> Required</label>
                          <button type="button" onClick={() => handleRemoveGlobalVerificationField(index)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="button" onClick={handleAddGlobalVerificationField} className="bg-gray-100 w-full sm:w-auto text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold">+ Add Global Field</button>
                    <button type="button" onClick={saveGlobalVerificationFields} className="bg-green-600 w-full sm:w-auto text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700">Save Global Fields</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">All Saved Fee Configurations</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">{allFeeConfigs.length} Total</span>
              </div>
              <ResponsiveTableShell
                empty={allFeeConfigs.length === 0}
                emptyMessage="No custom fees configured yet."
                mobile={allFeeConfigs.map((conf) => {
                  let tierCount = 0;
                  if (Array.isArray(conf.platform_charge)) {
                    tierCount = conf.platform_charge.length;
                  } else {
                    try {
                      const parsed = JSON.parse(conf.platform_charge);
                      if (Array.isArray(parsed)) tierCount = parsed.length;
                    } catch {}
                  }
                  return (
                    <AdminMobileCard
                      key={`${conf.country}-${conf.platform}`}
                      title={`${conf.country} — ${conf.platform}`}
                      actions={
                        <>
                          <button onClick={() => handleEditFeeClick(conf)} className="text-[#0066ff] bg-blue-50 p-2 rounded-lg text-xs font-bold flex flex-1 items-center justify-center gap-1"><Edit size={14}/> Edit</button>
                          <button onClick={() => handleDeleteFeeConfig(conf.country, conf.platform)} className="text-red-500 bg-red-50 p-2 rounded-lg text-xs font-bold flex flex-1 items-center justify-center gap-1"><Trash2 size={14}/> Delete</button>
                        </>
                      }
                    >
                      <AdminField label="Platform fee">{tierCount > 0 ? `${tierCount} tiers` : `${conf.platform_charge}%`}</AdminField>
                      <AdminField label="Ex. rate"><span className="text-[#0066ff] font-bold">{conf.exchange_rate || 1}</span></AdminField>
                      <AdminField label="Reward">${conf.buyer_reward}</AdminField>
                      <AdminField label="Refund">{conf.buyer_refund_fee}%</AdminField>
                      <AdminField label="Deposit">{conf.seller_deposit_fee}%</AdminField>
                      <AdminField label="Withdraw">{conf.seller_withdrawal_fee}%</AdminField>
                    </AdminMobileCard>
                  );
                })}
              >
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
                        } catch {}
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
                  </tbody>
                </table>
              </ResponsiveTableShell>
            </div>

            {/* Payment Receiving Accounts & Methods Manager */}
            <div className="mt-8">
               <PaymentMethodsManager />
            </div>
          </div>
        )}

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
            <ResponsiveTableShell
              empty={appeals.length === 0}
              emptyMessage="No appeals submitted yet."
              mobile={appeals.map((appeal) => (
                <AdminMobileCard
                  key={appeal.id}
                  title={appeal.name}
                  subtitle={appeal.email}
                  className={appeal.status === 'pending' ? 'border-indigo-200 bg-indigo-50/30' : ''}
                  actions={
                    <button
                      onClick={() => {
                        setSelectedAppeal(appeal);
                        setShowAppealModal(true);
                      }}
                      className="w-full bg-[#0066ff] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Eye size={14} /> Resolve Issue
                    </button>
                  }
                >
                  <AdminField label="Role">{appeal.role}</AdminField>
                  <AdminField label="Type">
                    {appeal.appeal_type === 'order_dispute' ? 'Order Dispute' : 'Account Ban'}
                  </AdminField>
                  <AdminField label="Status">{renderStatusBadge(appeal.status)}</AdminField>
                  <AdminField label="Reason" align="start">
                    <span className="text-xs italic text-gray-500 text-left max-w-full">"{appeal.reason}"</span>
                  </AdminField>
                  <button
                    onClick={() => fetchAndShowUserProfile(appeal.user_id)}
                    className="text-[#0066ff] text-xs font-bold mt-2"
                  >
                    View Profile
                  </button>
                </AdminMobileCard>
              ))}
            >
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
                          onClick={() => { setSelectedAppeal(appeal); setShowAppealModal(true); }}
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
                </tbody>
              </table>
            </ResponsiveTableShell>
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
            
            <ResponsiveTableShell
              empty={supportTickets.length === 0}
              emptyMessage="No support tickets found."
              mobile={supportTickets.map((ticket) => (
                <AdminMobileCard
                  key={ticket.id}
                  title={ticket.subject}
                  subtitle={`${ticket.user_name} · ${ticket.user_email}`}
                  className={ticket.status === 'open' ? 'border-yellow-200 bg-yellow-50/30' : ''}
                  actions={
                    <button
                      onClick={() => openTicketView(ticket)}
                      className="w-full bg-[#0066ff] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <MessageCircle size={14} /> Reply
                    </button>
                  }
                >
                  <AdminField label="Role">{ticket.user_role}</AdminField>
                  <AdminField label="Status">{ticket.status}</AdminField>
                  <AdminField label="Updated">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </AdminField>
                  <AdminField label="Message" align="start">
                    <span className="text-xs text-gray-500 text-left max-w-full line-clamp-3">
                      {ticket.message}
                    </span>
                  </AdminField>
                </AdminMobileCard>
              ))}
            >
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
                </tbody>
              </table>
           </ResponsiveTableShell>
          </div>
        )}

        {/* VERIFY REQUESTS TAB */}
        {activeTab === 'verify-requests' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Pending User Verifications</h3>
              <span className="bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded-full font-bold">{verifications.length} Requests</span>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {verifications.length > 0 ? verifications.map(v => {
                const contactDetails = getVerificationGlobalDetails(v);
                return (
                <div key={v.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 transition-shadow">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
                      {v.name ? v.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 truncate">{v.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{v.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm mb-5">
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Country & Selected Platforms</p>
                      <p className="font-medium text-gray-700 break-all">{v.verification_country || v.amazon_location || 'N/A'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {getVerificationPlatforms(v).map((platformName) => (
                          <span key={platformName} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {platformName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Platform Details</p>
                      <div className="space-y-2 mt-1">
                        {getVerificationPlatformDetails(v).map(({ name, values }) => {
                          const accountName = values?.account_name || values?.amazon_account || 'N/A';
                          const profileUrl = values?.profile_url || values?.amazon_profile_url || '';
                          const imageUrl = values?.verification_image_url || values?.image_url || '';
                          return (
                            <div key={name} className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                              <p className="font-bold text-gray-700">{name}</p>
                              <p className="text-xs text-gray-600 break-all"><span className="font-semibold">{v.role === 'seller' ? 'Store Name' : 'Profile Name'}:</span> {accountName}</p>
                              {profileUrl ? (
                                <a href={profileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block max-w-full text-xs font-bold">
                                  View Profile
                                </a>
                              ) : (
                                <p className="text-gray-400 italic text-xs">No link provided</p>
                              )}
                              {imageUrl && (
                                <a href={imageUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate block max-w-full text-xs font-bold mt-1">
                                  View Profile Screenshot
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {!v.verification_responses && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Amazon Location & Account</p>
                      <p className="font-medium text-gray-700 break-all">{v.amazon_location || 'N/A'} - {v.amazon_account || 'N/A'}</p>
                    </div>
                    )}
                    {!v.verification_responses && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Amazon Profile Link</p>
                      {v.amazon_profile_url ? (
                        <a href={v.amazon_profile_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block max-w-full">
                          View Profile ↗
                        </a>
                      ) : (
                        <p className="text-gray-400 italic">No link provided</p>
                      )}
                    </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Payment & Contacts</p>
                      <p className="font-medium text-gray-700 break-all">{v.role === 'seller' ? 'Email Address' : 'PayPal Email'}: {contactDetails.email || 'N/A'}</p>
                      <p className="font-medium text-gray-700 break-all">WhatsApp: {contactDetails.whatsapp || 'N/A'}</p>
                      <p className="font-medium text-gray-700 break-all">{v.role === 'seller' ? 'WeChat ID' : 'Facebook ID'}: {contactDetails.wechat || 'N/A'}</p>
                      <p className="font-medium text-gray-700 break-all">Telegram: {contactDetails.telegram || 'N/A'}</p>
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
                );
              }) : (
                <div className="col-span-full py-10 text-center text-gray-500">No pending verification requests at the moment.</div>
              )}
            </div>
          </div>
        )}

        {/* PENDING PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Pending Product Approvals</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
              {pendingProducts.map(p => (
                <div key={p.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md bg-gray-50 flex flex-col justify-between">
                  <div>
                    <img src={p.image_url} alt="Product" className="w-full h-32 object-contain bg-white rounded mb-3 border p-2" />
                    <h4 className="font-bold text-gray-800 truncate">{p.product_name || p.store_name}</h4>
                    <div className="flex justify-between text-sm mt-2"><span className="text-gray-600">Price: <b className="text-black">USD ${p.price}</b></span><span className="text-gray-600">Reward: <b className="text-green-600">USD ${p.reward}</b></span></div>
                    <div className="flex justify-between text-[10px] mt-0.5"><span className="text-gray-500">~ {getConvertedPrice(p.price, p.country, p.platform)} {p.country}</span><span className="text-green-600/80">~ {getConvertedPrice(p.reward, p.country, p.platform)} {p.country}</span></div>
                    <p className="text-xs text-gray-500 mt-2 truncate">Platform: {p.platform} ({p.country}) | Qty: {p.required_orders}</p>
                    <div className="mt-3 bg-blue-50 p-2 rounded border border-blue-100 overflow-hidden">
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
            <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-bold text-gray-700">All Listed Products</h3>
              <div className="relative w-full sm:w-auto">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search product..." className="w-full sm:w-auto pl-9 pr-4 py-1.5 border rounded-full text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <ResponsiveTableShell
              empty={allProducts.length === 0}
              emptyMessage="No products found in the system."
              mobile={allProducts.map((p) => (
                <AdminMobileCard
                  key={p.id}
                  title={p.product_name || p.store_name}
                  subtitle={p.platform}
                  actions={
                    <button
                      onClick={() => {
                        setSelectedProductDetails(p);
                        setShowProductModal(true);
                      }}
                      className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Eye size={16} /> View Details
                    </button>
                  }
                >
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-full h-28 object-contain bg-gray-50 rounded-lg border mb-2 p-2" />
                  )}
                  <AdminField label="Seller">{p.seller_name}</AdminField>
                  <AdminField label="Price">${p.price}</AdminField>
                  <AdminField label="Reward"><span className="text-green-600">${p.reward}</span></AdminField>
                  <AdminField label="Status">{renderStatusBadge(p.status)}</AdminField>
                </AdminMobileCard>
              ))}
            >
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
                        <img src={p.image_url} alt="Product" className="w-12 h-12 rounded object-contain bg-white border p-1 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 w-48 truncate">{p.product_name || p.store_name}</p>
                          <p className="text-xs text-gray-500">Platform: {p.platform}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-700 truncate max-w-[150px]">{p.seller_name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{p.seller_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-700">Price: <span className="font-bold">${p.price}</span></p>
                        <p className="text-xs text-green-600 font-bold">Reward: ${p.reward}</p>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(p.status)}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setSelectedProductDetails(p); setShowProductModal(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center justify-center ml-auto">
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableShell>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Manage Buyer Orders & Applications</h3></div>
            <ResponsiveTableShell
              empty={applications.length === 0}
              emptyMessage="No applications found."
              mobile={applications.map((app) => (
                <AdminMobileCard
                  key={app.id}
                  title={app.product_name}
                  subtitle={app.buyer_name}
                  actions={
                    <>
                      {app.status === 'rejected' && (
                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="flex-1 border border-red-200 text-red-500 py-2 rounded-lg text-xs font-bold"
                        >
                          <Trash2 size={14} className="inline mr-1" /> Clear
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedAppDetails(app);
                          setShowAppDetailsModal(true);
                        }}
                        className="flex-1 bg-[#0066ff] text-white py-2 rounded-lg text-xs font-bold"
                      >
                        <Eye size={14} className="inline mr-1" /> Details
                      </button>
                    </>
                  }
                >
                  <AdminField label="Buyer email">{app.buyer_email}</AdminField>
                  <AdminField label="Reward"><span className="text-green-600">${app.reward}</span></AdminField>
                  <AdminField label="Status">{renderStatusBadge(app.status)}</AdminField>
                </AdminMobileCard>
              ))}
            >
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
                        <img src={app.image_url} alt="Product" className="w-10 h-10 rounded object-contain bg-white border shrink-0" />
                        <div className="min-w-0">
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
                </tbody>
              </table>
            </ResponsiveTableShell>
          </div>
        )}

       {/* DEPOSITS TAB */}
        {activeTab === 'deposits' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Pending Deposit Requests</h3></div>
            <ResponsiveTableShell
              empty={deposits.length === 0}
              emptyMessage="No pending deposits."
              mobile={deposits.map((d) => (
                <AdminMobileCard key={d.id} title={d.email} subtitle={d.payment_method} actions={
                  <>
                    <button onClick={() => openTrxDetails(d, 'deposit')} className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Eye size={14}/> Details</button>
                    <button onClick={() => approveDeposit(d.id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold">Approve</button>
                    <button onClick={() => rejectDeposit(d.id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold">Reject</button>
                  </>
                }>
                  <AdminField label="Amount"><span className="text-green-600 font-bold">${d.amount}</span></AdminField>
                  <AdminField label="Trx ID"><span className="font-mono text-xs">{d.transaction_id}</span></AdminField>
                </AdminMobileCard>
              ))}
            >
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
                      <td className="p-4 font-mono text-gray-500 break-all">{d.transaction_id}</td>
                      <td className="p-4 text-right flex justify-end gap-2 items-center">
                        <button onClick={() => openTrxDetails(d, 'deposit')} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold text-xs flex items-center gap-1"><Eye size={14}/> Details</button>
                        <button onClick={() => approveDeposit(d.id)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 font-semibold text-xs">Approve</button>
                        <button onClick={() => rejectDeposit(d.id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 font-semibold text-xs">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableShell>
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-bold text-gray-700">Pending Withdrawal Requests</h3></div>
            <ResponsiveTableShell
              empty={withdrawals.length === 0}
              emptyMessage="No pending withdrawals."
              mobile={withdrawals.map((w) => (
                <AdminMobileCard key={w.id} title={w.name} subtitle={w.email} actions={
                  <>
                    <button onClick={() => { setWithdrawalToApprove(w); setShowApproveWithdrawalModal(true); }} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold">Mark Paid</button>
                    <button onClick={() => rejectWithdrawal(w.id)} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-xs font-bold">Reject</button>
                  </>
                }>
                  <AdminField label="Amount"><span className="text-red-600 font-bold">${w.amount}</span></AdminField>
                  <AdminField label="Method">{w.payment_method}</AdminField>
                  <AdminField label="Account" align="start"><span className="text-xs break-all text-left max-w-full">{w.account_details}</span></AdminField>
                </AdminMobileCard>
              ))}
            >
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
                      <td className="p-4 text-gray-600 max-w-[200px] break-all text-xs">{w.account_details}</td>
                      <td className="p-4 text-right gap-2 flex justify-end">
                        <button onClick={() => { setWithdrawalToApprove(w); setShowApproveWithdrawalModal(true); }} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-semibold text-xs mr-2">Mark Paid</button>
                        <button onClick={() => rejectWithdrawal(w.id)} className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900 font-semibold text-xs">Reject & Refund</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableShell>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-fade-in-up mt-6">
            <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-700">Transaction History</h3>
              <div className="flex flex-wrap gap-2 bg-gray-200 p-1 rounded-lg w-full md:w-auto">
                <button onClick={() => setSubTabHistory('withdrawals')} className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${subTabHistory === 'withdrawals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Withdrawals</button>
                <button onClick={() => setSubTabHistory('deposits')} className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${subTabHistory === 'deposits' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Deposits</button>
                <button onClick={() => setSubTabHistory('refunds')} className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${subTabHistory === 'refunds' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Product Refunds</button>
              </div>
            </div>
            <ResponsiveTableShell
              empty={
                (subTabHistory === 'withdrawals' && historyWithdrawals.length === 0) ||
                (subTabHistory === 'deposits' && historyDeposits.length === 0) ||
                (subTabHistory === 'refunds' && historyRefunds.length === 0)
              }
              emptyMessage="No records in this history tab."
              mobile={
                <>
                  {subTabHistory === 'withdrawals' &&
                    historyWithdrawals.map((w) => (
                      <AdminMobileCard
                        key={w.id}
                        title={w.name}
                        subtitle={w.email}
                        actions={
                          <button
                            onClick={() => openTrxDetails(w, 'withdrawal')}
                            className="w-full text-[#0066ff] py-2 text-xs font-bold border border-blue-100 rounded-lg bg-blue-50"
                          >
                            <Eye size={12} className="inline mr-1" /> View Details
                          </button>
                        }
                      >
                        <AdminField label="Amount"><span className="text-red-600 font-bold">${w.amount}</span></AdminField>
                        <AdminField label="Method">{w.payment_method}</AdminField>
                        <AdminField label="Date">{new Date(w.created_at).toLocaleDateString()}</AdminField>
                        <AdminField label="Status">{renderStatusBadge(w.status)}</AdminField>
                      </AdminMobileCard>
                    ))}
                  {subTabHistory === 'deposits' &&
                    historyDeposits.map((d) => (
                      <AdminMobileCard
                        key={d.id}
                        title={d.name}
                        subtitle={d.email}
                        actions={
                          <button
                            onClick={() => openTrxDetails(d, 'deposit')}
                            className="w-full text-[#0066ff] py-2 text-xs font-bold border border-blue-100 rounded-lg bg-blue-50"
                          >
                            <Eye size={12} className="inline mr-1" /> View Details
                          </button>
                        }
                      >
                        <AdminField label="Amount"><span className="text-green-600 font-bold">${d.amount}</span></AdminField>
                        <AdminField label="Method">{d.payment_method}</AdminField>
                        <AdminField label="Trx"><span className="break-all text-[10px]">{d.transaction_id}</span></AdminField>
                        <AdminField label="Date">{new Date(d.created_at).toLocaleDateString()}</AdminField>
                        <AdminField label="Status">{renderStatusBadge(d.status)}</AdminField>
                      </AdminMobileCard>
                    ))}
                  {subTabHistory === 'refunds' &&
                    historyRefunds.map((r) => (
                      <AdminMobileCard
                        key={r.id}
                        title={r.name}
                        subtitle={r.email}
                        className="border-red-100 bg-red-50/20"
                      >
                        <AdminField label="Refund"><span className="text-green-600 font-bold">+${Number(r.amount).toFixed(2)}</span></AdminField>
                        <AdminField label="Description" align="start"><span className="text-xs italic text-left max-w-full">{r.description}</span></AdminField>
                        <AdminField label="Date">{new Date(r.created_at).toLocaleDateString()}</AdminField>
                        <AdminField label="Status">{renderStatusBadge(r.status)}</AdminField>
                      </AdminMobileCard>
                    ))}
                </>
              }
            >
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
                        <button onClick={() => openTrxDetails(w, 'withdrawal')} className="text-[#0066ff] text-[10px] font-bold hover:underline flex items-center justify-end gap-1 mt-1"><Eye size={12}/> View Details</button>
                      </td>
                    </tr>
                  ))}
                  {subTabHistory === 'deposits' && historyDeposits.map(d => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="p-4"><p className="font-bold text-gray-700">{d.name}</p><p className="text-xs text-gray-500">{d.email}</p></td>
                      <td className="p-4 text-green-600 font-bold">${d.amount}</td>
                      <td className="p-4"><p className="font-bold text-gray-700">{d.payment_method}</p><p className="text-xs text-gray-500 font-mono break-all">{d.transaction_id}</p></td>
                      <td className="p-4 text-gray-600 text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right flex flex-col items-end gap-1">
                        {renderStatusBadge(d.status)}
                        <button onClick={() => openTrxDetails(d, 'deposit')} className="text-[#0066ff] text-[10px] font-bold hover:underline flex items-center justify-end gap-1 mt-1"><Eye size={12}/> View Details</button>
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
            </ResponsiveTableShell>
          </div>
        )}

        {/* 🔴 LIVE CHAT TAB */}
        {activeTab === 'live-chat' && (
          <div className="animate-fade-in-up mt-6">
            <PrivateChatAdminPanel />
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="space-y-6 animate-fade-in-up mt-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Megaphone size={20} className="text-[#0066ff]"/> Create New Announcement
              </h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <input required type="text" placeholder="Announcement Title" className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] text-sm" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                <textarea required placeholder="Write your message here..." className="w-full p-3 border rounded-xl h-24 outline-none focus:border-[#0066ff] text-sm" value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}></textarea>
                <button type="submit" disabled={isPublishing} className="w-full sm:w-auto bg-[#0066ff] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50">
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
                    <button onClick={() => handleDeleteAnnouncement(a.id)} className="w-full md:w-auto bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-1 shrink-0">
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
            <div id="blog-editor-card" className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#0066ff]"/> {editingBlog ? 'Edit Blog Post' : 'Publish New Blog Post'}
              </h3>
              <form onSubmit={handleCreateBlog} className="space-y-4">
                <input required type="text" placeholder="Blog Title" className="w-full p-3 border rounded-xl outline-none focus:border-[#0066ff] text-sm" value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{editingBlog ? 'Replace Feature Image (Optional)' : 'Feature Image (Optional)'}</label>
                    <input type="file" accept="image/*" id="blog-image-upload" className="w-full p-2 border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" onChange={e => setBlogImage(e.target.files[0])} />
                  </div>
                  <div className="flex items-center gap-2 md:mt-6 pt-2 md:pt-0">
                    <input type="checkbox" id="publish" className="w-4 h-4 cursor-pointer" checked={newBlog.is_published} onChange={e => setNewBlog({...newBlog, is_published: e.target.checked})} />
                    <label htmlFor="publish" className="text-sm font-bold text-gray-700 cursor-pointer">Publish Immediately</label>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button type="button" onClick={() => applyBlogFormat('strong')} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-700 hover:bg-gray-50">Bold</button>
                    <button type="button" onClick={() => applyBlogFormat('h1')} className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-black text-blue-700 hover:bg-blue-100">H1 Title</button>
                    <button type="button" onClick={() => applyBlogFormat('h2')} className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-black text-indigo-700 hover:bg-indigo-100">H2 Title</button>
                  </div>
                  <textarea id="blog-content-editor" required placeholder="Write the blog content here. Use toolbar for Bold, H1, H2..." className="w-full p-3 border rounded-xl h-48 outline-none focus:border-[#0066ff] text-sm font-mono" value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})}></textarea>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="submit" disabled={isPublishingBlog} className="w-full sm:w-auto bg-[#0066ff] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isPublishingBlog ? (editingBlog ? 'Updating...' : 'Publishing...') : <><FileText size={18} /> {editingBlog ? 'Update Blog' : 'Publish Blog'}</>}
                  </button>
                  {editingBlog && (
                    <button type="button" onClick={resetBlogForm} className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50">
                      Cancel Edit
                    </button>
                  )}
                </div>
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
                      <img src={blog.image_url} alt="blog" className="w-full md:w-20 h-40 md:h-14 object-cover rounded-lg border bg-gray-100 shrink-0" />
                    ) : (
                      <div className="w-full md:w-20 h-40 md:h-14 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 shrink-0"><ImageIcon size={24} /></div>
                    )}
                    <div className="flex-1 min-w-0 w-full"> 
                      <h4 className="font-bold text-gray-800 truncate">{blog.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 md:line-clamp-1">{blog.content.substring(0, 100)}...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${blog.is_published ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{blog.is_published ? 'Published' : 'Draft'}</span>
                        <span className="text-[10px] text-gray-400">{new Date(blog.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
                      <button onClick={() => handleEditBlog(blog)} className="w-full md:w-auto bg-white border border-blue-200 text-blue-600 px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDeleteBlog(blog.id)} className="w-full md:w-auto bg-white border border-red-200 text-red-600 px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {adminBlogs.length === 0 && <p className="p-8 text-center text-gray-500 font-medium">No blogs found.</p>}
              </div>
            </div>
          </div>
        )}

        {/* 1. APPROVE WITHDRAWAL MODAL */}
        {showApproveWithdrawalModal && withdrawalToApprove && (
          <ApproveWithdrawalModal
            withdrawalToApprove={withdrawalToApprove}
            onClose={() => {
              setShowApproveWithdrawalModal(false);
              setWithdrawalToApprove(null);
            }}
            onSuccess={() => {
              setShowApproveWithdrawalModal(false);
              setWithdrawalToApprove(null);
              fetchWithdrawals();
            }}
            onImageClick={(url) => {
              setFullImageUrl(url);
              setShowFullImageModal(true);
            }}
            API_BASE={API_BASE}
            handleAction={handleAction}
          />
        )}

        {/* 2. TRANSACTION DETAILS MODAL */}
        {showTrxDetailsModal && selectedTrx && (
          <TrxDetailsModal
            selectedTrx={selectedTrx}
            trxType={trxType}
            onClose={() => setShowTrxDetailsModal(false)}
            onImageClick={(url) => {
              setFullImageUrl(url);
              setShowFullImageModal(true);
            }}
          />
        )}

        {/* 3. APPEAL DETAILS MODAL */}
        {showAppealModal && selectedAppeal && (
          <AppealDetailsModal
            selectedAppeal={selectedAppeal}
            onClose={() => setShowAppealModal(false)}
            onViewProfile={(userId) => fetchAndShowUserProfile(userId)}
            onActionSuccess={() => {
              setShowAppealModal(false);
              fetchAppeals();
            }}
            approveAppeal={approveAppeal}
            rejectAppeal={rejectAppeal}
            API_BASE={API_BASE}
            handleAction={handleAction}
          />
        )}

        {/* 4. USER PROFILE MODAL */}
        {showUserProfileModal && selectedUserProfile && (
          <UserProfileModal
            selectedUserProfile={selectedUserProfile}
            userAppStats={userAppStats}
            sellerProductsList={sellerProductsList}
            selectedUserApps={selectedUserApps}
            profileViewMode={profileViewMode}
            setProfileViewMode={setProfileViewMode}
            onClose={() => setShowUserProfileModal(false)}
            onViewProduct={(product) => {
              setSelectedProductDetails(product);
              setShowProductModal(true);
            }}
            onViewApp={(app) => {
              setSelectedAppDetails(app);
              setShowAppDetailsModal(true);
            }}
          />
        )}

        {/* 5. PRODUCT DETAILS MODAL */}
        {showProductModal && selectedProductDetails && (
          <ProductDetailsModal
            selectedProductDetails={selectedProductDetails}
            onClose={() => setShowProductModal(false)}
            getConvertedPrice={getConvertedPrice}
            onViewProfile={(userId) => {
              setShowProductModal(false);
              fetchAndShowUserProfile(userId);
            }}
            onImageClick={(url) => {
              setFullImageUrl(url);
              setShowFullImageModal(true);
            }}
            approveProduct={approveProduct}
            rejectProduct={rejectProduct}
            stopProductAction={stopProductAction}
            resumeProductAction={resumeProductAction}
          />
        )}

        {/* 6. APPLICATION DETAILS MODAL */}
        {showAppDetailsModal && selectedAppDetails && (
          <AppDetailsModal
            selectedAppDetails={selectedAppDetails}
            onClose={() => setShowAppDetailsModal(false)}
            onViewProfile={(userId) => {
              setShowAppDetailsModal(false);
              fetchAndShowUserProfile(userId);
            }}
            onImageClick={(url) => {
              setFullImageUrl(url);
              setShowFullImageModal(true);
            }}
            onRefundClick={() => {
              setRefundAppId(selectedAppDetails.id);
              setShowRefundModal(true);
            }}
            actionApplication={actionApplication}
          />
        )}

        {/* 7. DYNAMIC REFUND / PAYMENT MODAL */}
        {showRefundModal && selectedAppDetails && (
          <RefundModal
            selectedAppDetails={selectedAppDetails}
            onClose={() => {
              setShowRefundModal(false);
              setRefundAppId(null);
            }}
            onSuccess={submitRefund}
          />
        )}

        {/* 8. FULL IMAGE LIGHTBOX FOR ADMIN */}
        {showFullImageModal && (
          <FullImageModal 
            fullImageUrl={fullImageUrl} 
            onClose={() => setShowFullImageModal(false)} 
          />
        )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      </div>
    </div>
  );
}
