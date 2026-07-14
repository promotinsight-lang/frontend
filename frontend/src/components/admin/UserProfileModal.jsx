import { User, X, Clock, CheckCircle, XCircle, Package, AlertTriangle, MapPin } from 'lucide-react';

const parseMaybeJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default function UserProfileModal({
  selectedUserProfile,
  userAppStats,
  sellerProductsList,
  selectedUserApps,
  profileViewMode,
  setProfileViewMode,
  onClose,
  onViewProduct,
  onViewApp
}) {
  if (!selectedUserProfile) return null;

  const verificationResponses = parseMaybeJson(selectedUserProfile.verification_responses, {});
  const verificationPlatforms = parseMaybeJson(selectedUserProfile.verification_platforms, []);
  const platformStoreNames = (Array.isArray(verificationPlatforms) ? verificationPlatforms : [])
    .map((platform) => ({
      platform,
      storeName:
        verificationResponses?.platforms?.[platform]?.account_name ||
        verificationResponses?.platforms?.[platform]?.amazon_account ||
        '',
    }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User size={24} className="text-blue-500"/> User Profile
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="font-bold text-gray-800 text-lg">{selectedUserProfile.name}</p>
            <p className="text-sm text-gray-500 break-all">{selectedUserProfile.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold uppercase">{selectedUserProfile.role}</span>
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold uppercase">Trust Score: {Number(selectedUserProfile.trust_score || 0).toFixed(1)}</span>
              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-bold uppercase">Rank: {selectedUserProfile.user_rank || 'New User'}</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Completed: {Number(selectedUserProfile.completed_orders || 0)}</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold uppercase">${Number(selectedUserProfile.wallet_balance || 0).toFixed(2)}</span>
            </div>
          </div>

          {selectedUserProfile.role === 'buyer' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-2 text-sm overflow-x-auto">
              <p className="flex flex-col sm:flex-row"><span className="font-bold text-gray-700 w-32 shrink-0">Target Country:</span> <span className="break-all">{selectedUserProfile.verification_country || selectedUserProfile.amazon_location || 'N/A'}</span></p>
              {selectedUserProfile.role === 'seller' && platformStoreNames.length > 0 ? platformStoreNames.map(({ platform, storeName }) => (
                <p key={platform} className="flex flex-col sm:flex-row">
                  <span className="font-bold text-gray-700 w-32 shrink-0">{platform} Store Name:</span>
                  <span className="break-all">{storeName || 'N/A'}</span>
                </p>
              )) : (
                <p className="flex flex-col sm:flex-row"><span className="font-bold text-gray-700 w-32 shrink-0">{selectedUserProfile.role === 'seller' ? 'Store Name:' : 'Profile Name:'}</span> <span className="break-all">{selectedUserProfile.amazon_account || 'N/A'}</span></p>
              )}
              <p className="flex flex-col sm:flex-row"><span className="font-bold text-gray-700 w-32 shrink-0">{selectedUserProfile.role === 'seller' ? 'Email Address:' : 'PayPal Email:'}</span> <span className="break-all">{selectedUserProfile.paypal_account || 'N/A'}</span></p>
              <p className="flex flex-col sm:flex-row"><span className="font-bold text-gray-700 w-32 shrink-0">WhatsApp:</span> <span className="break-all">{selectedUserProfile.whatsapp_account || 'N/A'}</span></p>
              <p className="flex flex-col sm:flex-row"><span className="font-bold text-gray-700 w-32 shrink-0">{selectedUserProfile.role === 'seller' ? 'WeChat ID:' : 'Facebook ID:'}</span> <span className="break-all">{selectedUserProfile.facebook_account || 'N/A'}</span></p>
              <p className="flex flex-col sm:flex-row"><span className="font-bold text-gray-700 w-32 shrink-0">Telegram:</span> <span className="break-all">{selectedUserProfile.telegram_account || 'N/A'}</span></p>
              <p className="flex flex-col sm:flex-row"><span className="font-bold text-gray-700 w-32 shrink-0">Verification:</span> <span className="uppercase font-bold text-indigo-600">{selectedUserProfile.verification_status}</span></p>
              
              {selectedUserProfile.last_ip && (
                <div className="mt-2 border-t border-indigo-100 pt-2 space-y-2">
                  <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0"><span className="font-bold text-gray-700 w-32 shrink-0">Login Location:</span><span className="font-bold text-gray-800 bg-white px-2 py-0.5 border border-indigo-200 rounded text-xs w-max">🌍 {selectedUserProfile.ip_location || 'Unknown Location'}</span></p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                    <span className="font-bold text-gray-700 w-32 shrink-0">Last Login IP:</span>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-gray-800 bg-white px-2 py-0.5 border border-indigo-200 rounded text-xs">{selectedUserProfile.last_ip}</span>
                      {selectedUserProfile.last_ip !== 'Unknown' && (
                        <a href={`https://ipinfo.io/${selectedUserProfile.last_ip}`} target="_blank" rel="noreferrer" className="text-[#0066ff] text-[10px] font-bold hover:underline flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-1 rounded w-max"><MapPin size={12} /> Track Map</a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selectedUserProfile.amazon_profile_url && (
                <div className="mt-4">
                  <a href={selectedUserProfile.amazon_profile_url} target="_blank" rel="noreferrer" className="block w-full text-center bg-white border border-indigo-200 text-indigo-600 py-2.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors">
                    Open Amazon Profile ↗
                  </a>
                </div>
              )}
            </div>
          ) : profileViewMode === 'listed' ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
               <div className="flex justify-between items-center mb-3 sticky top-0 bg-gray-50 pb-2 border-b">
                 <h4 className="font-bold text-gray-700 capitalize flex items-center gap-1"><Package size={16} className="text-purple-500"/> Listed Products</h4>
                 <button onClick={() => setProfileViewMode('details')} className="text-xs text-blue-600 hover:underline font-bold">Back to Details</button>
               </div>
               <div className="space-y-2">
                 {sellerProductsList.map(p => (
                    <div key={p.id} onClick={() => onViewProduct(p)} className="flex gap-3 bg-white p-2.5 rounded-lg border border-gray-200 items-center shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                       {p.image_url ? (<img src={p.image_url} alt="Product" className="w-10 h-10 object-contain border rounded bg-gray-50 p-0.5 shrink-0" />) : (<div className="w-10 h-10 bg-gray-100 border rounded flex items-center justify-center text-[8px] text-gray-400 shrink-0">No Img</div>)}
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{p.product_name || p.store_name}</p>
                         <p className="text-[10px] text-gray-500 font-semibold mt-0.5 truncate">Price: ${p.price} | Target: {p.required_orders}</p>
                       </div>
                       <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded shrink-0 hidden sm:block ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : p.status === 'stopped' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
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
                    <div key={app.id} onClick={() => onViewApp(app)} className="flex gap-3 bg-white p-2.5 rounded-lg border border-gray-200 items-center shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                       {app.image_url ? (<img src={app.image_url} alt="Product" className="w-10 h-10 object-contain border rounded bg-gray-50 p-0.5 shrink-0" />) : (<div className="w-10 h-10 bg-gray-100 border rounded flex items-center justify-center text-[8px] text-gray-400 shrink-0">No Img</div>)}
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{app.product_name}</p>
                         {selectedUserProfile.role === 'seller' ? (<p className="text-[10px] text-gray-500 font-semibold mt-0.5 truncate">Buyer: {app.buyer_email}</p>) : (<p className="text-[10px] text-gray-500 font-semibold mt-0.5 truncate">Reward: <span className="text-green-600 font-bold">${app.reward}</span></p>)}
                       </div>
                       <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded shrink-0 hidden sm:block ${app.status === 'completed' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{app.status.replace('_', ' ')}</span>
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
        <div className="mt-6 flex justify-end pt-4 border-t">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
