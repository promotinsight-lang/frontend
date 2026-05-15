import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CheckCircle, Clock, ShieldAlert, MapPin, User, Link as LinkIcon, DollarSign, Send, MessageCircle, Phone } from 'lucide-react';

const Verification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState('unverified');
  
  // Form States
  const [formData, setFormData] = useState({
    amazon_location: '',
    amazon_account: '',
    amazon_profile_url: '',
    paypal_account: '',
    facebook_account: '',
    whatsapp_account: '',
    telegram_account: ''
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ইউজারের বর্তমান স্ট্যাটাস চেক করা
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include'
        });
        if (res.status === 429) { console.warn('Rate limit on profile'); return; }
        const data = await res.json();
        if (data.success && data.user) {
          setUserStatus(data.user.verification_status || 'unverified');
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSubmitLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUserStatus('pending'); // UI আপডেট করার জন্য
        
        // লোকাল স্টোরেজ আপডেট করে দেওয়া যাতে ড্যাশবোর্ড বা হোমপেজ রিফ্রেশ না করলেও আপডেট পায়
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...storedUser, verification_status: 'pending' }));
        
        setMessage({ type: 'success', text: 'Verification submitted successfully! Waiting for admin approval.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Submission failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 flex flex-col">
      <Navbar />

      <div className="bg-[#0066ff] px-4 py-4 sticky top-14 z-30 shadow-md">
        <h1 className="text-xl font-bold text-white text-center">Account Verification</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 mt-6">
        
        {/* 🟢 STEPPER UI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
            
            {/* Step 1: Submit */}
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${userStatus === 'unverified' ? 'bg-[#0066ff] border-[#0066ff] text-white shadow-lg' : 'bg-green-500 border-green-500 text-white'}`}>
                1
              </div>
              <span className="text-xs font-bold text-gray-600">To Submit</span>
            </div>

            {/* Step 2: Under Review */}
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${userStatus === 'pending' ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg' : userStatus === 'approved' ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                2
              </div>
              <span className="text-xs font-bold text-gray-600">Under Review</span>
            </div>

            {/* Step 3: Approved */}
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${userStatus === 'approved' ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                3
              </div>
              <span className="text-xs font-bold text-gray-600">Approved</span>
            </div>
          </div>
        </div>

        {/* 📝 CONDITION-BASED UI */}
        {userStatus === 'pending' ? (
          <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-50">
              <Clock size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Pending</h2>
            <p className="text-gray-500 text-sm mb-6">Your details have been submitted successfully. Please wait while our admin reviews your application.</p>
            <button onClick={() => navigate('/dashboard')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-full transition-colors">
              Go to Dashboard
            </button>
          </div>
        ) : userStatus === 'approved' ? (
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Account Verified</h2>
            <p className="text-gray-500 text-sm mb-6">Congratulations! You are now a verified user and can apply for all premium products.</p>
            <button onClick={() => navigate('/')} className="bg-[#0066ff] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in-up">
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Submit Your Details</h2>
              <p className="text-xs text-gray-500">Please provide accurate information. This is required to process your cashbacks.</p>
            </div>

            {message.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-100 text-green-600 border border-green-200'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Mandatory Fields */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#0066ff] uppercase tracking-wider mb-2 border-b border-blue-100 pb-1">Mandatory Fields</h3>
                
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required name="amazon_location" value={formData.amazon_location} onChange={handleChange} type="text" placeholder="Amazon Account Location (e.g., USA, UK)" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all" />
                </div>
                
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required name="amazon_account" value={formData.amazon_account} onChange={handleChange} type="text" placeholder="Amazon Account Name" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all" />
                </div>

                <div className="relative">
                  <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required name="amazon_profile_url" value={formData.amazon_profile_url} onChange={handleChange} type="url" placeholder="Amazon Profile URL" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all" />
                </div>

                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required name="paypal_account" value={formData.paypal_account} onChange={handleChange} type="email" placeholder="PayPal Email Address" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all" />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Social Accounts (Optional)</h3>
                
                <div className="relative">
                  <MessageCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="facebook_account" value={formData.facebook_account} onChange={handleChange} type="text" placeholder="Facebook Profile URL" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all" />
                </div>

                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="whatsapp_account" value={formData.whatsapp_account} onChange={handleChange} type="text" placeholder="WhatsApp Number (with country code)" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all" />
                </div>

                <div className="relative">
                  <Send size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="telegram_account" value={formData.telegram_account} onChange={handleChange} type="text" placeholder="Telegram Username (@username)" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all" />
                </div>
              </div>

              <button type="submit" disabled={submitLoading} className="w-full mt-6 py-3.5 bg-gradient-to-r from-[#0066ff] to-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50">
                {submitLoading ? 'Submitting...' : 'Submit Verification'}
              </button>
            </form>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default Verification;