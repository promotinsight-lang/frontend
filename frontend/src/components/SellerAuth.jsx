import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, FileText, X, RefreshCcw } from 'lucide-react'; 

export default function SellerAuth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [role, setRole] = useState('buyer'); 
  const [isLogin, setIsLogin] = useState(true); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('');
  const [profileLink, setProfileLink] = useState(''); 
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // 🔥 NEW STATES FOR CAPTCHA AND OTP
  const [captchaData, setCaptchaData] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const navigate = useNavigate();

  // 🔥 FETCH CAPTCHA ON LOAD & WHEN SWITCHING TO LOGIN
  const fetchCaptcha = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/captcha');
      const data = await res.json();
      if (data.success) {
        setCaptchaData(data);
      }
    } catch (err) {
      console.error("Failed to load captcha", err);
    }
  };

  useEffect(() => {
    if (isLogin) {
      fetchCaptcha();
    }
  }, [isLogin]);

  // 🔥 OTP COUNTDOWN TIMER
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // 🔥 SEND OTP FUNCTION
  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    setError('');
    setOtpLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setOtpSent(true);
        setOtpCountdown(60); // 60 seconds cooldown before resend
        alert(data.message || "OTP sent to your email!");
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && role === 'buyer' && !termsAccepted) {
      setError('You must accept the Terms and Conditions to register.');
      return;
    }

    if (!isLogin && !otpCode) {
      setError('Please enter the verification code sent to your email.');
      return;
    }

    if (isLogin && !captchaInput) {
      setError('Please enter the captcha code.');
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
    
    // Include captcha for login, and OTP for register
    const payload = isLogin 
      ? { email, password, captchaId: captchaData?.captchaId, captchaInput } 
      : { fullName, name: fullName, email, password, role, whatsapp, country, profileLink, otp: otpCode };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onAuthSuccess(data.user);
        
        if (data.user.role === 'admin') navigate('/dashboard');
        else if (data.user.role === 'seller') navigate('/dashboard');
        else navigate('/dashboard');

      } else {
        setError(data.message || 'Authentication failed');
        // Refresh captcha on login failure
        if (isLogin) fetchCaptcha();
      }
    } catch (err) {
      setError('Server Error. Please try again.');
      if (isLogin) fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-[#0066ff] p-8 text-center text-white relative">
           <h2 className="text-3xl font-black mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
           <p className="text-blue-100 text-sm">MarketInsight Global Platform</p>
        </div>

        {/* TOGGLE */}
        <div className="flex bg-gray-100 p-1 m-6 rounded-xl">
           <button 
             onClick={() => setIsLogin(true)} 
             className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-[#0066ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Log In
           </button>
           <button 
             onClick={() => setIsLogin(false)} 
             className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-[#0066ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Register
           </button>
        </div>

        {error && (
          <div className="mx-6 mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100 flex items-center justify-center text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          
          {/* REGISTRATION ONLY FIELDS */}
          {!isLogin && (
            <>
              <div className="flex gap-4 mb-2">
                 <button type="button" onClick={() => setRole('buyer')} className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all ${role === 'buyer' ? 'border-[#0066ff] bg-blue-50 text-[#0066ff]' : 'border-gray-100 hover:border-blue-200'}`}>
                   <ShoppingBag size={24} className="mb-1" />
                   <span className="text-xs font-bold">Buyer</span>
                 </button>
                 <button type="button" onClick={() => setRole('seller')} className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all ${role === 'seller' ? 'border-[#0066ff] bg-blue-50 text-[#0066ff]' : 'border-gray-100 hover:border-blue-200'}`}>
                   <User size={24} className="mb-1" />
                   <span className="text-xs font-bold">Seller</span>
                 </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
              </div>
            </>
          )}

          {/* COMMON EMAIL & PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
            <input required type="email" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          {/* 🔥 REGISTRATION ONLY: EMAIL OTP VERIFICATION */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Verification Code</label>
              <div className="flex gap-2">
                <input 
                  required 
                  type="text" 
                  maxLength="6"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm tracking-widest font-mono" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  placeholder="6-digit code" 
                />
                <button 
                  type="button" 
                  onClick={handleSendOtp}
                  disabled={otpLoading || otpCountdown > 0 || !email}
                  className="bg-[#0066ff] text-white px-4 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 min-w-[100px]"
                >
                  {otpLoading ? 'Sending...' : otpCountdown > 0 ? `Wait ${otpCountdown}s` : otpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Click "Send Code" to receive an OTP via email.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
            <input required type="password" minLength="8" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {/* 🔥 LOGIN ONLY: CAPTCHA */}
          {isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Security Code</label>
              <div className="flex gap-2 items-stretch">
                <input 
                  required 
                  type="text" 
                  maxLength="4"
                  className="w-1/2 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm font-mono tracking-widest uppercase" 
                  value={captchaInput} 
                  onChange={(e) => setCaptchaInput(e.target.value)} 
                  placeholder="Code" 
                />
                <div className="w-1/2 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-[#f4f7f6] relative group">
                  {captchaData ? (
                    <div dangerouslySetInnerHTML={{ __html: captchaData.image }} className="scale-110" />
                  ) : (
                    <span className="text-xs text-gray-400">Loading...</span>
                  )}
                  <button 
                    type="button" 
                    onClick={fetchCaptcha}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    title="Refresh Captcha"
                  >
                    <RefreshCcw size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EXTRA REGISTRATION FIELDS (Seller) */}
          {!isLogin && role === 'seller' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">WhatsApp</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+123456789" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Country</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. USA" />
              </div>
            </div>
          )}

          {/* TERMS AND CONDITIONS (Buyer) */}
          {!isLogin && role === 'buyer' && (
            <div className="flex items-center gap-2 mt-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input 
                type="checkbox" 
                id="terms" 
                checked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 text-[#0066ff] rounded border-gray-300 focus:ring-[#0066ff]"
              />
              <label htmlFor="terms" className="text-xs text-gray-600 font-medium">
                I accept the <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#0066ff] font-bold hover:underline">Terms & Rules</button>
              </label>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button type="submit" disabled={loading} className="w-full py-3.5 mt-6 bg-[#0066ff] text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Secure Login' : 'Create Account')}
          </button>

        </form>
      </div>

      {/* TERMS AND CONDITIONS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><FileText size={20} className="text-[#0066ff]"/> Rules & Terms</h3>
              <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm p-1 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-gray-600 space-y-4">
              <p className="font-bold text-gray-800">Please read carefully before registering:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-gray-800">Profile Requirement:</strong> You must provide a valid profile link during verification.</li>
                <li><strong className="text-gray-800">Honest Reviews:</strong> You are required to submit an order number first, wait for the product delivery, and then submit a genuine review.</li>
                <li><strong className="text-gray-800">Review Deletion:</strong> If you delete your review from the platform after receiving the cashback, your account will be permanently banned and legal action may be taken.</li>
                <li><strong className="text-gray-800">Account Limits:</strong> You can only apply for a product once unless stated otherwise.</li>
                <li><strong className="text-gray-800">Payment:</strong> Cashback and rewards will only be credited to your wallet after the seller confirms your published review link.</li>
                <li><strong className="text-gray-800">No Fake Accounts:</strong> Using multiple accounts, fake IP addresses, or fraudulent details will result in an immediate permanent ban and forfeiture of wallet funds.</li>
                <li><strong className="text-gray-800">Confidentiality:</strong> Do not mention this platform on the seller's store or product review page.</li>
              </ul>
              <p className="pt-4 font-bold text-[#0066ff]">By checking the box in the registration form, you digitally sign this agreement.</p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setShowTermsModal(false)} className="px-6 py-2.5 bg-[#0066ff] hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors">I Understand</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}} />
    </div>
  );
}