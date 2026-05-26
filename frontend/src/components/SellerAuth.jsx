import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, FileText, X, RefreshCcw } from 'lucide-react'; 

// 🔥 Firebase Imports (আপনার firebase.js ফাইলের লোকেশন অনুযায়ী পাথ ঠিক করে নিবেন, যদি একই ফোল্ডারে না থাকে)
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, yahooProvider } from '../firebase'; 

export default function SellerAuth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [role, setRole] = useState('buyer'); 
  const [isLogin, setIsLogin] = useState(true); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('');
  const [profileLink, setProfileLink] = useState(''); 
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // STATES FOR CAPTCHA AND OTP
  const [captchaData, setCaptchaData] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const navigate = useNavigate();

  // FETCH CAPTCHA
  const fetchCaptcha = async () => {
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/users/captcha');
      const data = await res.json();
      if (data.success) {
        setCaptchaData(data);
      }
    } catch (err) {
      console.error("Failed to load captcha", err);
    }
  };

  useEffect(() => {
    if (isLogin) fetchCaptcha();
  }, [isLogin]);

  // OTP COUNTDOWN TIMER
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // BASIC EMAIL VALIDATION HELPER
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // SEND OTP
  const handleSendOtp = async () => {
    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email first.");
      return;
    }
    setError('');
    setOtpLoading(true);
    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setOtpSent(true);
        setOtpCountdown(60); 
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

  // 🔥 ASOL SOCIAL LOGIN HANDLER (Firebase Integrated)
  const handleSocialLogin = async (providerName) => {
    setSocialLoading(true);
    setError('');
    try {
      // 1. সিলেক্ট করুন কোন প্রোভাইডার দিয়ে লগিন হবে
      const provider = providerName === 'google' ? googleProvider : yahooProvider;
      
      // 2. ফায়ারবেস পপআপ ওপেন করা
      const result = await signInWithPopup(auth, provider);
      
      // 3. ফায়ারবেস থেকে ইউজারের তথ্য নেওয়া
      const userEmail = result.user.email;
      const userName = result.user.displayName || `${providerName} User`;

      if (!userEmail) {
        throw new Error("Email not found from social account.");
      }

      // 4. ব্যাকএন্ডে API কল করে ইউজারকে সিস্টেমে লগিন/রেজিস্টার করানো
      const res = await fetch('https://backend-6aiq.onrender.com/api/users/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: userName, auth_provider: providerName })
      });
      
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onAuthSuccess(data.user);
        navigate('/dashboard'); 
      } else {
        setError(data.message || `${providerName} login failed`);
      }
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      // ইউজার যদি নিজেই পপআপ কেটে দেয়, তাহলে এরর দেখানোর দরকার নেই
      if (err.code !== 'auth/popup-closed-by-user') {
        setError("Social login connection error. Please try again.");
      }
    } finally {
      setSocialLoading(false);
    }
  };

  // STANDARD EMAIL SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && role === 'buyer' && !termsAccepted) {
      return setError('You must accept the Terms and Conditions to register.');
    }

    if (!isLogin && !otpCode) {
      return setError('Please enter the verification code sent to your email.');
    }

    if (isLogin && !captchaInput) {
      return setError('Please enter the captcha code.');
    }

    setLoading(true);

    const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
    
    const payload = isLogin 
      ? { email, password, captchaId: captchaData?.captchaId, captchaInput } 
      : { fullName, email, password, role, whatsapp, country, profileLink, otp: otpCode };

    try {
      const res = await fetch(`https://backend-6aiq.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onAuthSuccess(data.user);
        navigate('/dashboard'); 
      } else {
        setError(data.message || 'Authentication failed');
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans animate-fade-in py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-[#0066ff] p-8 text-center text-white relative">
           <h2 className="text-3xl font-black mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
           <p className="text-blue-100 text-sm">PromotInsight Global Platform</p>
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

        {/* SOCIAL LOGIN BUTTONS */}
        <div className="px-6 mb-5 space-y-3">
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              <span className="text-sm font-bold text-gray-700">{socialLoading ? 'Wait...' : 'Google'}</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => handleSocialLogin('yahoo')}
              disabled={socialLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#720e9e] bg-[#720e9e] hover:bg-[#5a0b7c] transition-colors text-white rounded-xl disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M410.3 35.8L270.6 244.6V476h-59.5V244.6L71.4 35.8h72.2l87.5 142.2 87-142.2h92.2z"/>
              </svg>
              <span className="text-sm font-bold">{socialLoading ? 'Wait...' : 'Yahoo'}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">OR CONTINUE WITH EMAIL</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          
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

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
            <input required type="email" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0066ff] outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

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
                    <img 
                      src={`data:image/svg+xml;base64,${btoa(captchaData.image)}`} 
                      alt="Captcha" 
                      className="scale-110"
                    />
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
    </div>
  );
}