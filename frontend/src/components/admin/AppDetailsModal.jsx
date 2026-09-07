import { X, AlertTriangle, Package, Image as ImageIcon, Star, CheckCircle, Receipt, Clock } from 'lucide-react';
import {
  isReviewRequiredCampaignCategory,
  normalizeCampaignCategoryKey,
} from '../../utils/campaignCategories';

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

const isReviewRequiredCategory = (category) => {
  return isReviewRequiredCampaignCategory(category);
};

const isNoReviewCategory = (category) => {
  return normalizeCampaignCategoryKey(category) === 'no_need_review';
};

const hasReviewSubmission = (application) => {
  return Boolean(
    application?.review_submitted_at ||
    application?.review_link ||
    application?.review_screenshot_url ||
    application?.review_screenshot_url_2 ||
    ['review_submitted', 'forwarded_to_seller', 'pending_refund', 'completed'].includes(application?.status)
  );
};

export default function AppDetailsModal({
  selectedAppDetails,
  onClose,
  onViewProfile,
  onImageClick,
  onRefundClick,
  actionApplication
}) {
  if (!selectedAppDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[90vh] flex flex-col animate-fade-in-up">
        
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Application & Order Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-100 rounded-full p-1">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
           <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] tracking-wider border border-purple-200">
             Status: {selectedAppDetails.status.replace('_', ' ')}
           </span>
           {selectedAppDetails.category && (
             <span className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] tracking-wider border border-yellow-300">
               Task: {selectedAppDetails.category}
             </span>
           )}
        </div>

        {selectedAppDetails.status === 'disputed' && (
          <div className="bg-pink-100 text-pink-800 p-4 rounded-xl border border-pink-300 mb-4 font-bold text-center flex flex-col items-center justify-center gap-2 shadow-sm">
            <AlertTriangle size={28} className="text-pink-600"/>
            <p>This order is currently under dispute.</p>
            <p className="text-xs font-medium">Please resolve it from the "User Appeals" tab.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <div className="space-y-4">
             <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
               <h4 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                 <Package size={18}/> Product Info
               </h4>
               <div className="flex gap-4">
                 <img 
                   src={selectedAppDetails.image_url} 
                   alt="Product" 
                   className="w-20 h-20 object-contain bg-white border rounded-lg p-1 cursor-pointer hover:opacity-80" 
                   onClick={() => onImageClick(selectedAppDetails.image_url)}
                   title="Click to view full image"
                 />
                 <div>
                   <p className="text-sm font-bold text-gray-800 line-clamp-2">{selectedAppDetails.product_name}</p>
                 </div>
               </div>

               <div className="space-y-2 text-xs pt-4 mt-4 border-t border-gray-200">
                  {selectedAppDetails.store_name && <p className="flex flex-col sm:flex-row"><span className="font-semibold text-gray-500 sm:w-20 shrink-0">Store:</span> <span className="font-bold text-gray-800">{selectedAppDetails.store_name}</span></p>}
                  {selectedAppDetails.platform && <p className="flex flex-col sm:flex-row"><span className="font-semibold text-gray-500 sm:w-20 shrink-0">Platform:</span> <span className="font-bold text-gray-800">{selectedAppDetails.platform} {selectedAppDetails.country && `(${selectedAppDetails.country})`}</span></p>}
                  {selectedAppDetails.search_keyword && <p className="flex flex-col sm:flex-row sm:items-center"><span className="font-semibold text-gray-500 sm:w-20 shrink-0 mb-1 sm:mb-0">Keyword:</span> <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold w-max">{selectedAppDetails.search_keyword}</span></p>}
                  {selectedAppDetails.product_link && (
                    <p className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 mt-2">
                      <span className="font-semibold text-gray-500 sm:w-20 shrink-0">Link:</span> 
                      <a href={selectedAppDetails.product_link?.startsWith('http') ? selectedAppDetails.product_link : `https://${selectedAppDetails.product_link}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline break-all bg-white px-2 py-1 border rounded block w-full">Open Link ↗</a>
                    </p>
                  )}
               </div>
               
               {selectedAppDetails.instructions && (
                  <div className="mt-4 bg-white p-3 rounded-lg border border-gray-200 text-xs">
                    <span className="font-bold text-gray-500 block mb-1">Seller Instructions:</span>
                    <p className="text-gray-700 italic leading-relaxed">{selectedAppDetails.instructions}</p>
                  </div>
               )}
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm relative">
                 <h4 className="font-bold text-blue-800 mb-2 border-b border-blue-200 pb-1.5 flex items-center justify-between">
                   Buyer
                   <span className="text-[10px] bg-blue-100 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-black tracking-wider">
                     ⭐ {selectedAppDetails.trust_score ? parseFloat(selectedAppDetails.trust_score).toFixed(1) : '5.0'}
                   </span>
                 </h4>
                 <p className="text-sm font-bold text-gray-800 truncate" title={selectedAppDetails.buyer_name}>{selectedAppDetails.buyer_name}</p>
                 <p className="text-xs text-gray-600 truncate mt-0.5" title={selectedAppDetails.buyer_email}>{selectedAppDetails.buyer_email}</p>
                 <div className="mt-2 text-[10px] text-gray-600 space-y-0.5">
                   <p><span className="font-bold">PayPal:</span> {selectedAppDetails.paypal_account || 'N/A'}</p>
                   <p><span className="font-bold">WhatsApp:</span> {selectedAppDetails.whatsapp_account || 'N/A'}</p>
                   <p><span className="font-bold">Telegram:</span> {selectedAppDetails.telegram_account || 'N/A'}</p>
                 </div>
                 <button onClick={() => { onClose(); onViewProfile(selectedAppDetails.user_id); }} className="mt-3 w-full bg-white border border-blue-200 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm">View Buyer Profile</button>
               </div>
               <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm relative">
                 <h4 className="font-bold text-purple-800 mb-2 border-b border-purple-200 pb-1.5">Seller</h4>
                 <p className="text-sm font-bold text-gray-800 truncate" title={selectedAppDetails.seller_name || 'N/A'}>{selectedAppDetails.seller_name || 'N/A'}</p>
                 <p className="text-xs text-gray-600 truncate mt-0.5" title={selectedAppDetails.seller_email || 'N/A'}>{selectedAppDetails.seller_email || 'N/A'}</p>
                 <button onClick={() => { onClose(); onViewProfile(selectedAppDetails.seller_id); }} disabled={!selectedAppDetails.seller_id} className="mt-3 w-full bg-white border border-purple-200 text-purple-600 py-2 rounded-lg text-xs font-bold hover:bg-purple-100 disabled:opacity-50 transition-colors shadow-sm">View Seller Profile</button>
               </div>
             </div>
          </div>

          <div className="space-y-4">
             {(selectedAppDetails.status === 'order_submitted' || selectedAppDetails.status === 'order_approved' || selectedAppDetails.status === 'forwarded_to_seller' || selectedAppDetails.status === 'review_submitted' || selectedAppDetails.status === 'pending_refund' || selectedAppDetails.status === 'completed' || selectedAppDetails.status === 'disputed' || selectedAppDetails.status === 'rejected') && selectedAppDetails.order_number && (
               <div className="bg-indigo-50 p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-sm">
                 <h4 className="font-bold text-indigo-800 mb-3 border-b border-indigo-200 pb-2 flex items-center gap-2"><ImageIcon size={18}/> Order Submission</h4>
                 <p className="text-sm flex flex-col sm:flex-row sm:items-center"><span className="font-semibold text-gray-600 sm:w-24 mb-1 sm:mb-0">Order No:</span> <span className="font-mono font-bold bg-white px-2 py-0.5 border border-indigo-100 rounded w-max">{selectedAppDetails.order_number || 'N/A'}</span></p>
                 {selectedAppDetails.order_submitted_at && (
                   <p className="text-sm flex flex-col sm:flex-row sm:items-center mt-2">
                     <span className="font-semibold text-gray-600 sm:w-24 mb-1 sm:mb-0">Submitted:</span>
                     <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 border border-indigo-100 rounded w-max">
                       {formatDateTime(selectedAppDetails.order_submitted_at)}
                     </span>
                   </p>
                 )}
                 
                 <div className="mt-3 flex flex-wrap gap-2">
                   {selectedAppDetails.screenshot_url && (
                      <a href={selectedAppDetails.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#0066ff] font-bold hover:underline text-xs bg-white px-3 py-2 rounded-lg border border-indigo-100 shadow-sm transition-all hover:shadow-md">
                        <ImageIcon size={14} /> View Proof 1
                      </a>
                   )}
                   {selectedAppDetails.screenshot_url_2 && (
                      <a href={selectedAppDetails.screenshot_url_2} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#0066ff] font-bold hover:underline text-xs bg-white px-3 py-2 rounded-lg border border-indigo-100 shadow-sm transition-all hover:shadow-md">
                        <ImageIcon size={14} /> View Proof 2
                      </a>
                   )}
                 </div>

                 {selectedAppDetails.order_comment && (
                   <div className="mt-4 text-sm bg-white p-3 rounded-lg border border-indigo-100">
                     <span className="font-bold text-indigo-800 text-xs block mb-1">Buyer Comment:</span>
                     <p className="text-gray-700 italic leading-relaxed">{selectedAppDetails.order_comment}</p>
                   </div>
                 )}
               </div>
             )}

             {(selectedAppDetails.status === 'review_submitted' || selectedAppDetails.status === 'forwarded_to_seller' || selectedAppDetails.status === 'pending_refund' || selectedAppDetails.status === 'completed' || selectedAppDetails.status === 'disputed' || selectedAppDetails.status === 'rejected') && (selectedAppDetails.review_link || selectedAppDetails.review_screenshot_url || selectedAppDetails.review_screenshot_url_2) && (
               <div className="bg-pink-50 p-4 sm:p-5 rounded-xl border border-pink-200 shadow-sm">
                 <h4 className="font-bold text-pink-800 mb-3 border-b border-pink-200 pb-2 flex items-center gap-2"><Star size={18}/> Review Submission</h4>
                 {selectedAppDetails.review_link && (
                   <p className="text-sm mb-3 flex flex-col sm:flex-row sm:items-start">
                     <span className="font-semibold text-gray-600 sm:w-24 shrink-0 mb-1 sm:mb-0">Review Link:</span> 
                     <a href={selectedAppDetails.review_link} target="_blank" rel="noreferrer" className="text-[#0066ff] font-bold hover:underline break-all bg-white px-2 py-1 border border-pink-100 rounded inline-block w-full sm:w-auto">Open Review ↗</a>
                   </p>
                 )}
                 {formatDateTime(selectedAppDetails.review_submitted_at) && (
                   <p className="text-sm mb-3 flex flex-col sm:flex-row sm:items-center">
                     <span className="font-semibold text-gray-600 sm:w-24 shrink-0 mb-1 sm:mb-0">Submitted:</span>
                     <span className="font-bold text-pink-700 bg-white px-2 py-0.5 border border-pink-100 rounded w-max">
                       {formatDateTime(selectedAppDetails.review_submitted_at)}
                     </span>
                   </p>
                 )}
                 
                 <div className="mt-2 flex flex-wrap gap-2">
                   {selectedAppDetails.review_screenshot_url && (
                      <a href={selectedAppDetails.review_screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-purple-700 font-bold hover:underline text-xs bg-white px-3 py-2 rounded-lg border border-pink-100 shadow-sm transition-all hover:shadow-md">
                        <ImageIcon size={14} /> View Review Proof 1
                      </a>
                   )}
                   {selectedAppDetails.review_screenshot_url_2 && (
                      <a href={selectedAppDetails.review_screenshot_url_2} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-purple-700 font-bold hover:underline text-xs bg-white px-3 py-2 rounded-lg border border-pink-100 shadow-sm transition-all hover:shadow-md">
                        <ImageIcon size={14} /> View Review Proof 2
                      </a>
                   )}
                 </div>
               </div>
             )}

             {isReviewRequiredCategory(selectedAppDetails.category) && hasReviewSubmission(selectedAppDetails) && (
               <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200 shadow-sm">
                 <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Clock size={18}/> Review Timeline</h4>
                 <p className="text-sm text-blue-900 font-black mb-3">
                   Please wait for 24/72 hours for seller verification and refund.
                 </p>
                 <div className="space-y-2 text-xs text-blue-900 font-semibold">
                   {selectedAppDetails.order_number && (
                     <p><span className="font-black">Order No:</span> <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-100">{selectedAppDetails.order_number}</span></p>
                   )}
                   {formatDateTime(selectedAppDetails.review_submitted_at) && (
                     <p><span className="font-black">Review submitted:</span> {formatDateTime(selectedAppDetails.review_submitted_at)}</p>
                   )}
                   {formatDateTime(selectedAppDetails.seller_paid_at) && (
                     <p><span className="font-black">Seller refund paid:</span> {formatDateTime(selectedAppDetails.seller_paid_at)}</p>
                   )}
                 </div>
               </div>
             )}

             {(selectedAppDetails.seller_payment_transaction_id || selectedAppDetails.seller_payment_screenshot_url) && (
               <div className="bg-green-50 p-4 sm:p-5 rounded-xl border border-green-200 shadow-sm">
                 <h4 className="font-bold text-green-800 mb-3 border-b border-green-200 pb-2 flex items-center gap-2"><Receipt size={18}/> Seller Payment Proof</h4>
                 {selectedAppDetails.seller_payment_transaction_id && (
                   <p className="text-sm mb-2 flex flex-col sm:flex-row sm:items-center">
                     <span className="font-semibold text-gray-600 sm:w-24 mb-1 sm:mb-0">Trx ID:</span>
                     <span className="font-mono font-bold bg-white px-2 py-0.5 border border-green-100 rounded break-all">{selectedAppDetails.seller_payment_transaction_id}</span>
                   </p>
                 )}
                 {selectedAppDetails.seller_paid_at && (
                   <p className="text-xs text-green-700 font-semibold mb-2">Seller refund paid: {formatDateTime(selectedAppDetails.seller_paid_at)}</p>
                 )}
                 {selectedAppDetails.seller_payment_screenshot_url && (
                   <a href={selectedAppDetails.seller_payment_screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-green-700 font-bold hover:underline text-xs bg-white px-3 py-2 rounded-lg border border-green-100 shadow-sm">
                     <ImageIcon size={14} /> View Payment Screenshot
                   </a>
                 )}
                 {selectedAppDetails.seller_payment_note && (
                   <p className="mt-3 text-sm bg-white p-3 rounded-lg border border-green-100 text-gray-700">{selectedAppDetails.seller_payment_note}</p>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-4 sm:p-5 rounded-b-2xl flex-col sm:flex-row flex-wrap">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors mr-auto">
            Close Details
          </button>
          
          {selectedAppDetails.status === 'pending' && (
            <>
              <button onClick={() => actionApplication(selectedAppDetails.id, 'reject')} className="w-full sm:w-auto bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 shadow-md transition-colors">Reject Apply</button>
              {selectedAppDetails.category === 'Pre-Pay' ? (
                <button onClick={onRefundClick} className="w-full sm:w-auto bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 shadow-md transition-colors text-center">Approve & Pay <span className="block text-[9px] opacity-80">(External)</span></button>
              ) : (
                <button onClick={() => actionApplication(selectedAppDetails.id, 'approve')} className="w-full sm:w-auto bg-[#0066ff] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-colors">Approve Apply</button>
              )}
            </>
          )}
          
          {selectedAppDetails.status === 'order_submitted' && (
            <>
              <button onClick={() => actionApplication(selectedAppDetails.id, 'reject-order')} className="w-full sm:w-auto bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 shadow-md transition-colors">Reject Order</button>
              {isNoReviewCategory(selectedAppDetails.category) ? (
                <button onClick={() => actionApplication(selectedAppDetails.id, 'forward')} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-colors">Forward to Seller</button>
              ) : (
                <button onClick={() => actionApplication(selectedAppDetails.id, 'approve-order')} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-colors">Approve Order</button>
              )}
            </>
          )}
          
          {selectedAppDetails.status === 'forwarded_to_seller' && (
            <div className="bg-yellow-100 text-yellow-800 px-6 py-2.5 rounded-xl font-bold w-full md:w-auto text-center border border-yellow-200">Waiting for Seller Verification</div>
          )}
          
          {selectedAppDetails.status === 'review_submitted' && (
            <>
              <button onClick={() => actionApplication(selectedAppDetails.id, 'reject-review')} className="w-full sm:w-auto bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 shadow-md transition-colors">Reject Review</button>
              <button onClick={() => actionApplication(selectedAppDetails.id, 'forward')} className="w-full sm:w-auto bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-600 shadow-md transition-colors">Forward to Seller</button>
              <button onClick={() => actionApplication(selectedAppDetails.id, 'approve-review')} className="w-full sm:w-auto bg-pink-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-pink-700 shadow-md transition-colors text-center">Force Approve <span className="block text-[9px] opacity-80">(Admin bypass)</span></button>
            </>
          )}
          
          {selectedAppDetails.status === 'pending_refund' && (
            <button onClick={onRefundClick} className="w-full sm:w-auto bg-green-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-600 shadow-md transition-colors flex items-center justify-center gap-1">
              <CheckCircle size={16}/> Process Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
