import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ChevronDown, ChevronUp, User, Mail, Lock, ShieldAlert, ShieldCheck, Clock, Loader2, Edit2, Check, X, CreditCard } from 'lucide-react';

const Profile = () => {
  const [openSection, setOpenSection] = useState('basic'); 
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Name Edit States 🔥
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Password Reset States
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const fetchProfileData = async () => {
    try {
      const profileRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/profile`, {
        headers: {},
        credentials: 'include' 
      });
      
      if (profileRes.status === 429) {
        console.warn('Rate limit exceeded on profile fetch');
        return;
      }

      const profileData = await profileRes.json();
      if (profileData.success) setUserProfile(profileData.user);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // 🔥 Update Name Logic
  const handleNameUpdate = async () => {
    if (!newName.trim()) return alert("Name cannot be empty");
    
    setUpdateLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/profile/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUserProfile((prev) => ({ ...prev, name: data.user.name }));
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsEditingName(false);
      } else {
        alert(data.message || "Failed to update name");
      }
    } catch {
      alert("Server error");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    setResetLoading(true);
    setResetMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile?.email })
      });

      if (res.status === 429) {
        setResetMessage({ type: 'error', text: 'Too many requests. Please wait 15 minutes.' });
        return;
      }

      const data = await res.json();
      if (res.ok) setResetMessage({ type: 'success', text: '✅ Reset link sent to your email!' });
      else setResetMessage({ type: 'error', text: data.message || 'Failed to send email.' });
    } catch {
      setResetMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-[#0066ff] font-bold">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 flex flex-col">
      <Navbar />

      <div className="bg-[#0066ff] px-4 py-6 shadow-md relative overflow-hidden text-white mt-14 sm:mt-0">
        <div className="max-w-2xl mx-auto relative z-10 text-center">
          <h1 className="text-2xl font-black">My Account</h1>
          <p className="text-blue-100 text-sm mt-1">Manage your profile and security settings</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 mt-6 space-y-5 animate-fade-in-up">

        {/* 1️⃣ BASIC INFO ACCORDION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
          <button onClick={() => toggleSection('basic')} className="w-full flex justify-between items-center p-5 bg-white hover:bg-gray-50 transition-colors focus:outline-none">
            <span className="font-black text-gray-800 text-lg flex items-center gap-2">
              <User className="text-[#0066ff]" size={20}/> Basic Info
            </span>
            {openSection === 'basic' ? <ChevronUp size={20} className="text-[#0066ff]" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          
          {openSection === 'basic' && (
            <div className="p-5 border-t border-gray-100 space-y-4 bg-gray-50/50">
              
              {/* 🔥 EDITABLE NAME SECTION */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="bg-blue-50 p-2 rounded-lg"><User size={18} className="text-[#0066ff]" /></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Full Name</p>
                  {isEditingName ? (
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-blue-50/50 border-b-2 border-[#0066ff] focus:outline-none text-gray-800 font-bold px-1 py-0.5"
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-800 font-bold">{userProfile?.name}</p>
                  )}
                </div>
                <div>
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditingName(false)} disabled={updateLoading} className="p-1.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition">
                        <X size={16} />
                      </button>
                      <button onClick={handleNameUpdate} disabled={updateLoading} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition">
                        {updateLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setIsEditingName(true); setNewName(userProfile?.name || ''); }} 
                      className="flex items-center gap-1 text-xs font-bold text-[#0066ff] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="bg-blue-50 p-2 rounded-lg"><Mail size={18} className="text-[#0066ff]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Email Address</p>
                  <p className="text-gray-800 font-bold truncate">{userProfile?.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg"><Lock size={18} className="text-[#0066ff]" /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Password</p>
                    <p className="text-gray-800 font-black tracking-widest">********</p>
                  </div>
                </div>
                <button 
                  onClick={handlePasswordResetRequest} 
                  disabled={resetLoading} 
                  className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Change'}
                </button>
              </div>
              
              {resetMessage.text && (
                <div className={`p-3 rounded-lg text-xs font-bold flex items-center justify-center border ${resetMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {resetMessage.text}
                </div>
              )}
            </div>
          )}
        </div>

        {userProfile?.role === 'buyer' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
            <button onClick={() => toggleSection('loan-credit')} className="w-full flex justify-between items-center p-5 bg-white hover:bg-gray-50 transition-colors focus:outline-none">
              <span className="font-black text-gray-800 text-lg flex items-center gap-2">
                <CreditCard className="text-[#0066ff]" size={20}/> Loan Credit
              </span>
              {openSection === 'loan-credit' ? <ChevronUp size={20} className="text-[#0066ff]" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>

            {openSection === 'loan-credit' && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                  <p className="text-xs text-blue-700 font-black uppercase mb-1">Available Loan Credit</p>
                  <p className="text-3xl font-black text-blue-900">
                    USD ${Number(userProfile?.loan_credit_balance || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-700 font-semibold mt-3 leading-relaxed">
                    Your loan credit balance is managed by admin and is visible here whenever credit is assigned to your buyer account.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2️⃣ VERIFICATION INFO ACCORDION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
          <button onClick={() => toggleSection('verification')} className="w-full flex justify-between items-center p-5 bg-white hover:bg-gray-50 transition-colors focus:outline-none">
            <span className="font-black text-gray-800 text-lg flex items-center gap-2">
              <ShieldCheck className="text-green-500" size={20}/> Verification Info
            </span>
            {openSection === 'verification' ? <ChevronUp size={20} className="text-green-500" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          
          {openSection === 'verification' && (
            <div className="p-8 border-t border-gray-100 text-center bg-gray-50/50">
              {userProfile?.verification_status === 'approved' ? (
                <div className="flex flex-col items-center animate-fade-in-up">
                  <div className="bg-green-100 p-4 rounded-full mb-4 shadow-sm border border-green-200">
                    <ShieldCheck size={48} className="text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800">Verified Account</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm">Your Amazon and payment accounts are securely linked to our system.</p>
                  
                  <div className="mt-6 inline-flex bg-white text-green-700 px-6 py-2.5 rounded-full text-sm font-bold border-2 border-green-400 shadow-sm">
                    {userProfile?.role === 'seller' ? '🎉 You are now ready to list products!' : '🎉 You are now ready to apply for tasks!'}
                  </div>

                </div>
              ) : userProfile?.verification_status === 'pending' ? (
                <div className="flex flex-col items-center animate-fade-in-up">
                  <div className="bg-yellow-100 p-4 rounded-full mb-4 shadow-sm border border-yellow-200">
                    <Clock size={48} className="text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800">Under Review</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm">Admin is securely reviewing your submitted details. This usually takes 12-24 hours.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-fade-in-up">
                  <div className="bg-red-100 p-4 rounded-full mb-4 shadow-sm border border-red-200">
                    <ShieldAlert size={48} className="text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">Unverified Account</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm">Complete your identity and account verification to unlock all platform features.</p>
                  <Link to="/verification" className="bg-[#10b981] hover:bg-[#059669] text-white px-10 py-3.5 rounded-xl font-black transition-all shadow-lg hover:shadow-emerald-500/30">
                    Start Verification
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default Profile;
