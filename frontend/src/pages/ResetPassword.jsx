import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';

export default function ResetPassword() {
  const { id, token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: false, error: '', success: '' });

    if (newPassword.length < 8) {
      return setStatus({ loading: false, error: 'Password must be at least 8 characters long for security.', success: '' });
    }

    if (newPassword !== confirmPassword) {
      return setStatus({ loading: false, error: 'Passwords do not match!', success: '' });
    }

    setStatus({ loading: true, error: '', success: '' });

    try {
      // 🔥 Note: Updated to PATCH to match the secure backend route
      const res = await fetch(`http://localhost:5000/api/users/reset-password/${id}/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      // 🔥 Rate Limiter Check
      if (res.status === 429) {
        setStatus({ loading: false, error: 'Too many attempts. Please try again after 15 minutes.', success: '' });
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setStatus({ loading: false, error: '', success: 'Password successfully updated! Redirecting to login...' });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus({ loading: false, error: data.message || 'Invalid or expired token.', success: '' });
      }
    } catch (err) {
      setStatus({ loading: false, error: 'Server connection error. Please try again.', success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in-up border border-gray-100">
        
        <Link to="/login" className="inline-flex items-center gap-1 text-gray-400 hover:text-[#0066ff] mb-6 text-sm transition-colors font-bold">
          <ChevronLeft size={16}/> Back to Login
        </Link>

        <h2 className="text-2xl font-black text-gray-800 mb-2">Create New Password</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Your new password must be at least 8 characters long and different from your previous passwords.
        </p>

        {status.error && (
          <div className="p-4 rounded-xl text-sm mb-6 font-bold flex items-start gap-3 border bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
            <p>{status.error}</p>
          </div>
        )}

        {status.success && (
          <div className="p-4 rounded-xl text-sm mb-6 font-bold flex items-start gap-3 border bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
            <p>{status.success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                required 
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" 
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!!status.success}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                required 
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" 
                placeholder="Retype password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!!status.success}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status.loading || !!status.success}
            className="w-full bg-[#0066ff] text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {status.loading ? (
              <><Loader2 className="animate-spin" size={18} /> Saving...</>
            ) : status.success ? (
              <><CheckCircle size={18} /> Redirecting...</>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
           <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">🔐 Enterprise-Grade Encryption</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}