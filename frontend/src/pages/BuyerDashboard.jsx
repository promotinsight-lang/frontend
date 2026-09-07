import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ShoppingBag, CheckCircle, Clock, X, ShieldAlert, XCircle, AlertCircle, Wallet, CreditCard, Image as ImageIcon, Headset, PlusCircle, MessageCircle, MessageSquare, Send, Megaphone, Copy } from 'lucide-react';
import { useBuyerCurrency } from '../hooks/useBuyerCurrency';
import BottomNavbar from '../components/BottomNavbar';
import LiveChatModal from '../components/LiveChatModal';
import { isReviewRequiredCampaignCategory, normalizeCampaignCategoryKey } from '../utils/campaignCategories';

const BuyerDashboard = () => {
  const { formatWallet, formatProduct } = useBuyerCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); 
  const [applications, setApplications] = useState([]);
  const [announcements, setAnnouncements] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false); 
  
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [actionAppId, setActionAppId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [orderForm, setOrderForm] = useState({ order_number: '', order_total_amount: '', order_paypal_address: '', screenshot_url: '', screenshot_url_2: '', order_comment: '' });
  const [reviewForm, setReviewForm] = useState({ review_link: '', review_screenshot_url: '', review_screenshot_url_2: '' });

  const [supportTickets, setSupportTickets] = useState([]);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplies, setTicketReplies] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [showTicketViewModal, setShowTicketViewModal] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
const [showLiveChatModal, setShowLiveChatModal] = useState(false);
  const [copiedProductLink, setCopiedProductLink] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab === 'referral' ? 'wallet' : tab);

    const appIdParam = params.get('appId');
    const action = params.get('action');
    if (appIdParam && applications.length > 0) {
       const appToOpen = applications.find(a => String(a.application_id) === String(appIdParam) || String(a.id) === String(appIdParam));
       if (appToOpen) {
          if (action === 'order' && ['approved', 'pending'].includes(appToOpen.application_status)) {
            setActionAppId(appToOpen.application_id);
            setShowOrderModal(true);
          } else {
            setSelectedItem({ type: 'application', data: appToOpen });
          }
       }
    }
  }, [location.search, applications]); 

  const closeModal = () => {
    setSelectedItem(null);
    const params = new URLSearchParams(location.search);
    if (params.has('appId')) {
       navigate(`/dashboard?tab=${activeTab}`, { replace: true });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      
      const profileRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/profile`, {
        headers: {},
        credentials: 'include'
      });
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success) {
          const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ 
            ...lsUser, 
            wallet_balance: profileData.user.wallet_balance, 
            loan_credit_balance: profileData.user.loan_credit_balance,
            wallet_breakdown: profileData.user.wallet_breakdown,
            is_active: profileData.user.is_active, 
            is_frozen: profileData.user.is_frozen,
          }));
          
          if (profileData.user.is_active === false) {
            setIsAccountDisabled(true);
            setLoading(false);
            return; 
          }
          
        }
      }

      try {
        const annRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/announcements`, {
           headers: {},
           credentials: 'include'
        });
        const annData = await annRes.json();
        if (annRes.ok && annData.success) setAnnouncements(annData.data || []);
      } catch (e) { console.error("Announcement fetch error", e); }

      const appRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/my`, {
        headers: {},
        credentials: 'include'
      });
      const appData = await appRes.json();
      if (appRes.ok) setApplications(appData.data || []);
      
      if (activeTab === 'support') {
         const tRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/support/my`, {
            headers: {},
            credentials: 'include'
         });
         const tData = await tRes.json();
         if (tRes.ok) setSupportTickets(tData.data || []);
      }

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]); 

  const activeApps = applications.filter(app => !['completed', 'rejected'].includes(app.application_status));
  const completedApps = applications.filter(app => app.application_status === 'completed');
  const failedApps = applications.filter(app => app.application_status === 'rejected');
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const walletBalance = Number(storedUser.wallet_balance || 0);
  const loanCreditBalance = Number(storedUser.loan_credit_balance || 0);

  const handleImageUpload = async (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
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

      const downloadURL = cloudJson.secure_url;

      if (formType === 'order') {
        setOrderForm(prev => ({ ...prev, screenshot_url: downloadURL }));
      } else if (formType === 'order2') {
        setOrderForm(prev => ({ ...prev, screenshot_url_2: downloadURL }));
      } else if (formType === 'review') {
        setReviewForm(prev => ({ ...prev, review_screenshot_url: downloadURL }));
      } else if (formType === 'review2') {
        setReviewForm(prev => ({ ...prev, review_screenshot_url_2: downloadURL }));
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      alert("Image upload failed! Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/${actionAppId}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderForm)
      });
      if(res.ok) {
        alert('Order submitted successfully!');
        setShowOrderModal(false);
        setOrderForm({ order_number: '', order_total_amount: '', order_paypal_address: '', screenshot_url: '', screenshot_url_2: '', order_comment: '' });
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to submit order');
      }
    } catch {
      alert('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/${actionAppId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reviewForm)
      });
      if(res.ok) {
        alert('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewForm({ review_link: '', review_screenshot_url: '', review_screenshot_url_2: '' });
        fetchData();
      } else {
        alert('Failed to submit review');
      }
    } catch {
      alert('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/support/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ticketForm)
      });
      if(res.ok) {
        alert('Support ticket created successfully!');
        setShowCreateTicketModal(false);
        setTicketForm({ subject: '', message: '' });
        fetchData(); 
      } else {
        alert('Failed to create ticket');
      }
    } catch {
      alert('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTicketView = async (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketViewModal(true);
    setRepliesLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/support/${ticket.id}`, {
        headers: {},
        credentials: 'include'
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
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/support/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyMessage })
      });
      const data = await res.json();
      if(res.ok) {
        setTicketReplies([...ticketReplies, data.data]);
        setReplyMessage('');
        fetchData(); 
      } else {
        alert('Failed to send reply');
      }
    } catch {
      alert('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInstructionText = (data) => {
    return data?.instruction || data?.instructions || "Please follow standard guidelines. Search the item on Amazon after admin approval.";
  };

  const canShowProductLink = (app) => {
    return normalizeCampaignCategoryKey(app?.category) !== 'no_need_review';
  };

  const copyProductLink = async (link) => {
    if (!link) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = link;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopiedProductLink(link);
      window.setTimeout(() => {
        setCopiedProductLink((current) => (current === link ? '' : current));
      }, 1800);
    } catch (error) {
      console.error('Copy link failed:', error);
      alert('Could not copy the link right now.');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString();
  };

  const isReviewTask = (app) => {
    return isReviewRequiredCampaignCategory(app?.category);
  };

  const isReviewSubmitted = (app) => {
    return Boolean(
      app?.review_submitted_at ||
      app?.review_link ||
      app?.review_screenshot_url ||
      app?.review_screenshot_url_2 ||
      ['review_submitted', 'forwarded_to_seller', 'pending_refund', 'completed'].includes(app?.application_status)
    );
  };

  if (isAccountDisabled) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans pb-10 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-red-100 text-center animate-fade-in mx-4">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Account Restricted</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Your account has been disabled due to a violation of our policies. You can no longer view or request products.
          </p>
          <div className="space-y-4">
            <button className="w-full bg-[#0066ff] text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
               Submit Appeal
            </button>
            <a href="https://t.me/your_support" target="_blank" rel="noreferrer" className="block w-full border border-gray-200 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all text-center">
               Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleTabChange = (tabName) => {
     navigate(`/dashboard?tab=${tabName}`);
     setActiveTab(tabName);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 md:pb-10 flex flex-col">
      <Navbar />

      <div className="bg-white px-4 py-6 border-b border-gray-200 sticky top-14 z-30 shadow-sm">
        <h1 className="text-2xl font-black text-gray-800 mb-4">
          {activeTab === 'wallet' ? 'My Wallet' 
            : activeTab === 'support' ? 'Support Tickets' 
            : activeTab === 'announcements' ? 'Announcements' 
            : 'My Orders'}
        </h1>
        
        {activeTab !== 'wallet' && activeTab !== 'support' && activeTab !== 'announcements' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center flex flex-col items-center justify-center shadow-sm">
                <Clock size={20} className="text-blue-500 mb-1" />
                <p className="text-2xl font-black text-blue-700 leading-none">{activeApps.length}</p>
                <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">Pending</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center flex flex-col items-center justify-center shadow-sm">
                <CheckCircle size={20} className="text-green-500 mb-1" />
                <p className="text-2xl font-black text-green-700 leading-none">{completedApps.length}</p>
                <p className="text-[10px] font-bold text-green-500 uppercase mt-1">Success</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center flex flex-col items-center justify-center shadow-sm">
                <XCircle size={20} className="text-red-500 mb-1" />
                <p className="text-2xl font-black text-red-700 leading-none">{failedApps.length}</p>
                <p className="text-[10px] font-bold text-red-500 uppercase mt-1">Failed</p>
              </div>
            </div>

            <div className="flex w-full bg-gray-100 rounded-lg p-1 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => handleTabChange('active')} 
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                Active Orders
              </button>
              <button 
                onClick={() => handleTabChange('completed')} 
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'completed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
              >
                Completed
              </button>
              <button 
                onClick={() => handleTabChange('failed')} 
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'failed' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
              >
                Failed
              </button>
            </div>
          </>
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 mt-6">
        
        {loading && <div className="text-center py-10 text-gray-400 font-semibold animate-pulse">Loading data...</div>}

        {!loading && activeTab === 'announcements' && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Megaphone className="text-[#0066ff]" /> System Announcements
            </h2>

            {announcements.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                <Megaphone size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No announcements at this time.</p>
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0066ff]"></div>
                  
                  <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-start gap-2">
                    <span className="text-[#0066ff] shrink-0 mt-0.5"><CheckCircle size={16}/></span>
                    {ann.title}
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed ml-6">{ann.message}</p>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center ml-6">
                     <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                       Important
                     </span>
                     <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                       <Clock size={12}/> {new Date(ann.created_at).toLocaleString()}
                     </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'active' && (
          <div className="space-y-4">
            {activeApps.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active orders found.</p>
              </div>
            ) : (
              activeApps.map((app) => (
                <div key={app.application_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative">
                  
                  {app.category && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block shadow-sm">
                      Task: {app.category}
                    </span>
                  )}

                  <div className="flex gap-4">
                    <div className="w-20 h-20 shrink-0 bg-gray-50 rounded-lg p-2 border border-gray-100 flex items-center justify-center">
                      {app.image_url ? <img src={app.image_url} alt="Product" className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No Img</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2">{app.product_name || `Order #${app.application_id}`}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Reward: <span className="font-bold text-green-600">+{formatProduct(app.reward, app.country).formatted}</span></p>
                      
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${app.application_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {(app.application_status || '').replace('_', ' ')}
                      </span>
                      {app.order_submitted_at && (
                        <p className="text-[10px] text-gray-500 font-semibold mt-2">
                          Order submitted: {new Date(app.order_submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                    <button onClick={() => setSelectedItem({ type: 'application', data: app })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-xs transition-colors">Details</button>
                    
                    {['approved', 'pending'].includes(app.application_status) && (
                      <button onClick={() => { setActionAppId(app.application_id); setShowOrderModal(true); }} className="flex-1 bg-[#0066ff] text-white font-bold py-2 rounded-lg text-xs shadow-md shadow-blue-500/30">Submit Order</button>
                    )}

                    {app.application_status === 'order_approved' && isReviewTask(app) && (
                      <button onClick={() => { setActionAppId(app.application_id); setShowReviewModal(true); }} className="flex-1 bg-purple-600 text-white font-bold py-2 rounded-lg text-xs shadow-md shadow-purple-500/30">Submit Review</button>
                    )}

                    {(app.application_status === 'order_submitted' || app.application_status === 'review_submitted' || app.application_status === 'pending_refund' || (app.application_status === 'order_approved' && !isReviewTask(app))) && (
                      <button disabled className="flex-1 bg-gray-100 text-gray-400 font-bold py-2 rounded-lg text-xs cursor-not-allowed flex items-center justify-center gap-1">
                        <Clock size={14}/> Processing
                      </button>
                    )}
                  </div>
                  {['review_submitted', 'forwarded_to_seller', 'pending_refund'].includes(app.application_status) && isReviewTask(app) && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-800 font-semibold leading-relaxed">
                      <p className="font-black text-blue-900 mb-2">Please wait for 24/72 hours for seller verification and refund.</p>
                      <div className="space-y-1 text-[11px]">
                        {app.order_number && <p><span className="font-black">Order No:</span> {app.order_number}</p>}
                        {formatDateTime(app.review_submitted_at) && <p><span className="font-black">Review submitted:</span> {formatDateTime(app.review_submitted_at)}</p>}
                        {formatDateTime(app.seller_paid_at) && <p><span className="font-black">Seller refund paid:</span> {formatDateTime(app.seller_paid_at)}</p>}
                      </div>
                    </div>
                  )}

                  {['order_submitted', 'order_approved'].includes(app.application_status) && isReviewTask(app) && !isReviewSubmitted(app) && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 font-semibold leading-relaxed">
                      Do not submit your review immediately. Reviews can only be submitted after 4-7 days from the order date.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'completed' && (
          <div className="space-y-4">
            {completedApps.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                <CheckCircle size={48} className="mx-auto text-green-200 mb-3" />
                <p className="text-gray-500 font-medium">No successful orders yet.</p>
              </div>
            ) : (
              completedApps.map((app) => (
                <div key={app.application_id} className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedItem({ type: 'application', data: app })}>
                  <div className="w-16 h-16 shrink-0 bg-green-50 rounded-lg p-2 border border-green-100 flex items-center justify-center">
                    <img src={app.image_url} alt="Product" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{app.product_name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Earned: <span className="font-bold text-green-600">{formatProduct(parseFloat(app.price || 0) + parseFloat(app.reward || 0), app.country).formatted}</span></p>
                  </div>
                  <div className="shrink-0 bg-green-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm shadow-green-500/30">
                    <CheckCircle size={14}/> Success
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'failed' && (
          <div className="space-y-4">
            {failedApps.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                <AlertCircle size={48} className="mx-auto text-red-200 mb-3" />
                <p className="text-gray-500 font-medium">No failed orders.</p>
              </div>
            ) : (
              failedApps.map((app) => (
                <div key={app.application_id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setSelectedItem({ type: 'application', data: app })}>
                  <div className="w-16 h-16 shrink-0 bg-red-50 rounded-lg p-2 border border-red-100 flex items-center justify-center">
                    <img src={app.image_url} alt="Product" className="w-full h-full object-contain grayscale" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{app.product_name}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Application was rejected</p>
                  </div>
                  <div className="shrink-0 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <XCircle size={14}/> Failed
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard size={20} className="text-[#0066ff]"/> Loan Credit
                </h3>
                <div className="flex flex-col items-start sm:items-end">
                  <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-blue-200 shadow-sm">
                    Credit: {formatWallet(loanCreditBalance).primary}
                  </span>
                  {formatWallet(loanCreditBalance).secondary && (
                    <span className="text-[10px] font-bold text-gray-500 mt-1 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {formatWallet(loanCreditBalance).secondary}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase text-blue-700 mb-1">Available Loan Credit</p>
                  <p className="text-2xl font-black text-blue-900">{formatWallet(loanCreditBalance).primary}</p>
                  <p className="text-[11px] text-blue-700 font-semibold mt-2">
                    This credit is managed by admin and shown directly on your buyer account.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Wallet Balance</p>
                  <p className="text-2xl font-black text-gray-900">{formatWallet(walletBalance).primary}</p>
                  <p className="text-[11px] text-gray-500 font-semibold mt-2">
                    Buyer withdrawal requests are currently disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'support' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row gap-4">
               <button 
                  onClick={() => setShowCreateTicketModal(true)} 
                  className="flex-1 bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
               >
                 <PlusCircle size={20} /> Create New Ticket
               </button>
               <button 
                  onClick={() => setShowLiveChatModal(true)} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
               >
                 <MessageSquare size={20} /> Live Private Chat
               </button>
             </div>

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

      {/* Submit Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Submit Order Details</h3>
            <form onSubmit={submitOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Amazon Order Number</label>
                <input required type="text" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0066ff] outline-none" value={orderForm.order_number} onChange={e => setOrderForm({...orderForm, order_number: e.target.value})} placeholder="e.g. 114-1234567-8901234" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Order Total Amount</label>
                <input required type="number" min="0.01" step="0.01" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0066ff] outline-none" value={orderForm.order_total_amount} onChange={e => setOrderForm({...orderForm, order_total_amount: e.target.value})} placeholder="e.g. 25.99" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">PayPal Email Address</label>
                <input required type="email" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0066ff] outline-none" value={orderForm.order_paypal_address} onChange={e => setOrderForm({...orderForm, order_paypal_address: e.target.value})} placeholder="buyer@example.com" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Upload Screenshot 1 (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'order')} 
                  className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0066ff] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                />
                {orderForm.screenshot_url && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image 1 attached!</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Upload Screenshot 2 (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'order2')} 
                  className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-[#0066ff] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                />
                {isUploadingImage && <p className="text-xs text-blue-600 mt-1 animate-pulse font-semibold">Uploading image to secure storage...</p>}
                {orderForm.screenshot_url_2 && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image 2 attached!</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploadingImage} className="flex-1 py-3 bg-[#0066ff] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-opacity">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⭐ Submit Review Modal 🔥 UPDATE: Firebase Image Upload */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Submit Live Review</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Review URL/Link</label>
                <input type="url" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-purple-500 outline-none" value={reviewForm.review_link} onChange={e => setReviewForm({...reviewForm, review_link: e.target.value})} placeholder="https://amazon.com/..." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Upload Review Screenshot 1</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'review')} 
                  className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer" 
                />
                {reviewForm.review_screenshot_url && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image 1 attached!</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Upload Review Screenshot 2 (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'review2')} 
                  className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer" 
                />
                {isUploadingImage && <p className="text-xs text-purple-600 mt-1 animate-pulse font-semibold">Uploading image to secure storage...</p>}
                {reviewForm.review_screenshot_url_2 && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image 2 attached!</p>}
              </div>
              
              <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider font-bold pt-2">Please provide at least one proof.</p>
              
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploadingImage} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-opacity">Submit</button>
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
              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#0066ff] text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
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
                    <button type="submit" disabled={isSubmitting} className="bg-[#0066ff] text-white p-3 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center">
                       <Send size={18} className={isSubmitting ? 'animate-pulse' : ''} />
                    </button>
                  </form>
               )}
            </div>

          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-up sm:animate-none">
            
            <button onClick={closeModal} className="absolute top-4 right-4 bg-gray-100 text-gray-600 rounded-full p-1 z-10 hover:bg-gray-200"><X size={20} /></button>
            
            <div className="p-6">
              
              {selectedItem.data.category && (
                <div className="mb-3 bg-yellow-100 border border-yellow-300 p-2 rounded-lg text-center shadow-sm">
                  <span className="text-[10px] text-yellow-700 uppercase font-bold tracking-wider block mb-0.5">Task Condition</span>
                  <span className="text-sm font-black text-yellow-900">{selectedItem.data.category}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2 pr-8">
                {selectedItem.data.application_status === 'completed' ? (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle size={10}/> Success</span>
                ) : selectedItem.data.application_status === 'rejected' ? (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><XCircle size={10}/> Failed</span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><Clock size={10}/> Pending</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{selectedItem.data.product_name}</h2>
              
              <div className="bg-gray-50 p-4 rounded-xl mt-4 border border-gray-100 flex justify-between">
                <div><p className="text-xs text-gray-500">Price</p><p className="text-lg font-bold text-gray-800">{formatProduct(selectedItem.data.price, selectedItem.data.country).formatted}</p></div>
                <div className="text-right"><p className="text-xs text-gray-500">Reward</p><p className="text-lg font-bold text-green-600">+ {formatProduct(selectedItem.data.reward, selectedItem.data.country).formatted}</p></div>
              </div>

              {['pending', 'approved', 'order_submitted', 'order_approved', 'review_submitted', 'pending_refund', 'completed'].includes(selectedItem.data.application_status) && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4 text-sm space-y-2 shadow-sm">
                  <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">Search & Purchase Details</h4>
                  
                  {selectedItem.data.store_name && (
                    <p><span className="font-semibold text-gray-500 w-24 inline-block">Store Name:</span> <span className="font-bold text-gray-800">{selectedItem.data.store_name}</span></p>
                  )}
                  
                  {selectedItem.data.search_keyword && (
                    <p><span className="font-semibold text-gray-500 w-24 inline-block">Keyword:</span> <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">{selectedItem.data.search_keyword}</span></p>
                  )}
                  
                  {selectedItem.data.platform && (
                    <p><span className="font-semibold text-gray-500 w-24 inline-block">Platform:</span> {selectedItem.data.platform} {selectedItem.data.country && `(${selectedItem.data.country})`}</p>
                  )}

                  {selectedItem.data.product_link && canShowProductLink(selectedItem.data) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-500 block mb-1">Product Link:</span>
                      <div className="flex flex-col gap-2">
                        <a
                          href={selectedItem.data.product_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs break-all bg-gray-50 p-2 block rounded border border-gray-100"
                        >
                          {selectedItem.data.product_link}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyProductLink(selectedItem.data.product_link)}
                          className="inline-flex w-fit items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                        >
                          {copiedProductLink === selectedItem.data.product_link ? <CheckCircle size={14} /> : <Copy size={14} />}
                          {copiedProductLink === selectedItem.data.product_link ? 'Copied' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedItem.data.application_status !== 'rejected' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                  <p className="text-blue-800 text-sm leading-relaxed"><strong>Instruction:</strong> {getInstructionText(selectedItem.data)}</p>
                </div>
              )}

              {(selectedItem.data.order_number || selectedItem.data.order_total_amount || selectedItem.data.order_paypal_address || selectedItem.data.screenshot_url || selectedItem.data.screenshot_url_2 || selectedItem.data.review_link || selectedItem.data.review_screenshot_url || selectedItem.data.review_screenshot_url_2) && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h4 className="font-bold text-gray-700 text-sm mb-3">Your Submissions</h4>
                  {selectedItem.data.order_number && (
                    <div className="mb-2"><p className="text-[10px] text-gray-500 uppercase font-bold">Order ID</p><p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block border border-gray-200">{selectedItem.data.order_number}</p></div>
                  )}
                  {selectedItem.data.order_submitted_at && (
                    <div className="mb-2"><p className="text-[10px] text-gray-500 uppercase font-bold">Order Submitted Date</p><p className="text-sm font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block border border-indigo-100">{new Date(selectedItem.data.order_submitted_at).toLocaleString()}</p></div>
                  )}
                  {selectedItem.data.review_submitted_at && (
                    <div className="mb-2"><p className="text-[10px] text-gray-500 uppercase font-bold">Review Submitted Date</p><p className="text-sm font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded inline-block border border-purple-100">{new Date(selectedItem.data.review_submitted_at).toLocaleString()}</p></div>
                  )}
                  {selectedItem.data.order_total_amount && (
                    <div className="mb-2"><p className="text-[10px] text-gray-500 uppercase font-bold">Order Total Amount</p><p className="text-sm font-bold bg-green-50 text-green-700 px-2 py-1 rounded inline-block border border-green-100">${Number(selectedItem.data.order_total_amount).toFixed(2)}</p></div>
                  )}
                  {selectedItem.data.order_paypal_address && (
                    <div className="mb-2"><p className="text-[10px] text-gray-500 uppercase font-bold">PayPal Email</p><p className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block border border-blue-100 break-all">{selectedItem.data.order_paypal_address}</p></div>
                  )}
                  {(selectedItem.data.screenshot_url || selectedItem.data.screenshot_url_2) && (
                    <div className="mt-2 flex flex-col gap-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Order Screenshots</p>
                      {selectedItem.data.screenshot_url && (
                        <a href={selectedItem.data.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-600 font-bold hover:underline text-xs bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100 w-fit">
                          <ImageIcon size={14} /> View Order Screenshot 1
                        </a>
                      )}
                      {selectedItem.data.screenshot_url_2 && (
                        <a href={selectedItem.data.screenshot_url_2} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-600 font-bold hover:underline text-xs bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100 w-fit">
                          <ImageIcon size={14} /> View Order Screenshot 2
                        </a>
                      )}
                    </div>
                  )}
                  {selectedItem.data.review_link && (
                    <div className="mt-3"><p className="text-[10px] text-gray-500 uppercase font-bold">Review Link</p><a href={selectedItem.data.review_link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline truncate block">{selectedItem.data.review_link}</a></div>
                  )}
                  {(selectedItem.data.review_screenshot_url || selectedItem.data.review_screenshot_url_2) && (
                    <div className="mt-2 flex flex-col gap-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Review Screenshots</p>
                      {selectedItem.data.review_screenshot_url && (
                        <a href={selectedItem.data.review_screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-purple-600 font-bold hover:underline text-xs bg-purple-50 px-2 py-1.5 rounded border border-purple-100 w-fit">
                          <ImageIcon size={14} /> View Review Screenshot 1
                        </a>
                      )}
                      {selectedItem.data.review_screenshot_url_2 && (
                        <a href={selectedItem.data.review_screenshot_url_2} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-purple-600 font-bold hover:underline text-xs bg-purple-50 px-2 py-1.5 rounded border border-purple-100 w-fit">
                          <ImageIcon size={14} /> View Review Screenshot 2
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isReviewTask(selectedItem.data) && isReviewSubmitted(selectedItem.data) && selectedItem.data.application_status !== 'completed' && (
                <div className="mt-6 border border-blue-200 bg-blue-50 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1">
                    <Clock size={16} /> Review Submitted
                  </h4>
                  <p className="text-xs text-blue-800 font-semibold leading-relaxed mb-3">
                    Please wait for 24/72 hours for seller verification and refund.
                  </p>
                  <div className="space-y-2 text-xs text-blue-900">
                    {selectedItem.data.order_number && (
                      <p><span className="font-black">Order No:</span> <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-100">{selectedItem.data.order_number}</span></p>
                    )}
                    {formatDateTime(selectedItem.data.review_submitted_at) && (
                      <p><span className="font-black">Review submitted:</span> {formatDateTime(selectedItem.data.review_submitted_at)}</p>
                    )}
                    {formatDateTime(selectedItem.data.seller_paid_at) && (
                      <p><span className="font-black">Seller refund paid:</span> {formatDateTime(selectedItem.data.seller_paid_at)}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.data.application_status === 'rejected' && selectedItem.data.refund_comment && (
                <div className="mt-6 border border-red-200 bg-red-50 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-1">
                    <XCircle size={16} /> Order Rejected
                  </h4>
                  <p className="text-xs text-red-700 font-medium leading-relaxed mb-3">
                    Unfortunately, your order was rejected by the Admin after reviewing the dispute.
                  </p>
                  <div className="mt-2">
                    <p className="text-[10px] text-red-600 uppercase font-bold">Admin Reason / Comment</p>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border border-red-200 italic font-semibold">
                      "{selectedItem.data.refund_comment}"
                    </p>
                  </div>
                </div>
              )}

              {(selectedItem.data.seller_payment_transaction_id || selectedItem.data.seller_payment_screenshot_url) && (
                <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-1">
                    <CheckCircle size={16} /> Seller Payment Proof
                  </h4>
                  {selectedItem.data.seller_payment_transaction_id && (
                    <div className="mb-2">
                      <p className="text-[10px] text-emerald-600 uppercase font-bold">Transaction ID</p>
                      <p className="text-sm font-mono bg-white px-2 py-1 rounded inline-block border border-emerald-200 text-gray-800 font-bold break-all">
                        {selectedItem.data.seller_payment_transaction_id}
                      </p>
                    </div>
                  )}
                  {selectedItem.data.seller_payment_screenshot_url && (
                    <a href={selectedItem.data.seller_payment_screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline text-xs bg-white px-2 py-1.5 rounded border border-emerald-100">
                      <ImageIcon size={14} /> View Payment Screenshot
                    </a>
                  )}
                  {selectedItem.data.seller_paid_at && (
                    <p className="text-[10px] text-emerald-700 font-bold mt-2">
                      Paid at: {new Date(selectedItem.data.seller_paid_at).toLocaleString()}
                    </p>
                  )}
                  {selectedItem.data.seller_payment_note && (
                    <p className="text-sm text-gray-700 bg-white p-2 rounded border border-emerald-200 italic mt-2">
                      "{selectedItem.data.seller_payment_note}"
                    </p>
                  )}
                </div>
              )}

              {selectedItem.data.application_status === 'completed' && (
                <div className="mt-6 border border-green-200 bg-green-50 p-4 rounded-xl shadow-sm">
                  <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-1">
                    <CheckCircle size={16} /> Refund Processed
                  </h4>
                  
                  {selectedItem.data.seller_payment_transaction_id ? (
                     <p className="text-xs text-green-700 font-medium leading-relaxed mb-3">
                       Seller has marked this order complete and submitted payment proof. Check the seller payment proof above.
                     </p>
                  ) : selectedItem.data.category === 'Pre-Pay' ? (
                     <p className="text-xs text-green-700 font-medium leading-relaxed mb-3">
                       Your funds (Product Price + Reward) have been successfully sent to your external payment account by the Admin. <strong className="text-green-800">Note: This amount is NOT added to your system wallet.</strong>
                     </p>
                  ) : (
                     <p className="text-xs text-green-700 font-medium leading-relaxed mb-3">
                       Your refund (Product Price + Reward) has been successfully added to your wallet. You can withdraw it at any time from the <strong className="text-green-800">My Wallet</strong> tab.
                     </p>
                  )}
                  
                  {(selectedItem.data.refund_order_number || selectedItem.data.refund_screenshot_url) && (
                    <div className="mb-2">
                      <p className="text-[10px] text-green-600 uppercase font-bold">Admin Order Number / Screenshot</p>
                      <p className="text-sm font-mono bg-white px-2 py-1 rounded inline-block border border-green-200 text-gray-800 font-bold break-all">
                        {selectedItem.data.refund_order_number || selectedItem.data.refund_screenshot_url}
                      </p>
                    </div>
                  )}

                  {selectedItem.data.refund_comment && (
                    <div className="mt-2">
                      <p className="text-[10px] text-green-600 uppercase font-bold">Admin Comment</p>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border border-green-200 italic">
                        "{selectedItem.data.refund_comment}"
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={closeModal} className="w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
{/* 🔴 LIVE CHAT MODAL */}
      <LiveChatModal isOpen={showLiveChatModal} onClose={() => setShowLiveChatModal(false)} onOpen={() => setShowLiveChatModal(true)} />
      <BottomNavbar />

      <style dangerouslySetInnerHTML={{__html: `
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default BuyerDashboard;

