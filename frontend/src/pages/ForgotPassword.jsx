import React, { useState } from 'react';
import { Mail, ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, msg: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, msg: '', type: '' });

    try {
      const res = await fetch('https://backend-6aiq.onrender.com/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      // 🔥 Rate Limiter Check (15 min limit handling)
      if (res.status === 429) {
        setStatus({ 
          loading: false, 
          msg: 'Too many requests. Please try again after 15 minutes to prevent email spam.', 
          type: 'error' 
        });
        return;
      }
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ 
          loading: false, 
          msg: data.message || 'If your email is registered, a reset link has been sent.', 
          type: 'success' 
        });
        setEmail(''); // Clear input on success
      } else {
        setStatus({ loading: false, msg: data.message || 'Failed to process request.', type: 'error' });
      }
    } catch (err) {
      setStatus({ loading: false, msg: 'Server connection error. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in-up border border-gray-100">
        
        <Link to="/login" className="inline-flex items-center gap-1 text-gray-400 hover:text-[#0066ff] mb-6 text-sm transition-colors font-bold">
          <ChevronLeft size={16}/> Back to Login
        </Link>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">Forgot Password?</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Don't worry! It happens. Please enter the email address associated with your account, and we'll send you a secure link to reset your password.
        </p>
        
        {status.msg && (
          <div className={`p-4 rounded-xl text-sm mb-6 font-bold flex items-start gap-3 border transition-all ${
            status.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} /> : <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />}
            <p>{status.msg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required 
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter your registered email..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status.loading}
            className="w-full bg-[#0066ff] text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status.loading ? (
              <><Loader2 className="animate-spin" size={18} /> Sending Secure Link...</>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">🔒 Secure Password Reset Flow</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};