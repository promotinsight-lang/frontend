import { X, Eye } from 'lucide-react';
import { getCurrencyForCountry } from '../../utils/currency';

export default function ProductDetailsModal({
  selectedProductDetails,
  onClose,
  getConvertedPrice,
  onViewProfile,
  onImageClick,
  approveProduct,
  rejectProduct,
  stopProductAction,
  resumeProductAction
}) {
  if (!selectedProductDetails) return null;

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-200">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-200">Rejected</span>;
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-200">Pending</span>;
      case 'stopped': return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-orange-200">Stopped</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-[10px] font-bold uppercase">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[90vh] animate-fade-in-up">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Review Product Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 rounded-full p-1"><X size={24} /></button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
             <img 
               src={selectedProductDetails.image_url} 
               alt="Product" 
               className="w-full h-48 md:h-56 object-contain bg-white rounded-xl border border-gray-200 shadow-sm p-2 cursor-pointer hover:opacity-90 transition-opacity" 
               onClick={() => onImageClick(selectedProductDetails.image_url)}
               title="Click to view full image"
             />
             
             <div className="mt-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold mb-2 tracking-wider">Total Deposit Deducted</p>
                
                {/* USD & Local Currency Display */}
                <div className="flex flex-col gap-1 mb-4">
                   <p className="text-xl sm:text-2xl font-black text-yellow-700">
                      ${parseFloat(selectedProductDetails.total_deposit || 0).toFixed(2)} <span className="text-xs sm:text-sm font-bold text-gray-500">USD</span>
                   </p>
                   <p className="text-[10px] sm:text-sm font-bold text-gray-600 bg-yellow-100/50 w-max px-2 py-0.5 rounded border border-yellow-200">
                      ~ {getConvertedPrice(selectedProductDetails.total_deposit, selectedProductDetails.country, selectedProductDetails.platform)} <span className="text-[10px] uppercase">{getCurrencyForCountry(selectedProductDetails.country).code}</span>
                   </p>
                </div>

                {/* Seller Balance Deduction Math */}
                <div className="space-y-2 text-[10px] sm:text-xs font-semibold bg-white p-3 rounded-lg border border-yellow-100">
                   <div className="flex justify-between text-gray-600">
                      <span>Previous Balance:</span>
                      <span>USD ${(parseFloat(selectedProductDetails.seller_wallet_balance || 0) + parseFloat(selectedProductDetails.total_deposit || 0)).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-red-500 border-b border-gray-100 pb-2">
                      <span>Deducted (This Product):</span>
                      <span>- USD ${parseFloat(selectedProductDetails.total_deposit || 0).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-green-700 pt-1 font-bold">
                      <span>Remaining Balance:</span>
                      <span>USD ${parseFloat(selectedProductDetails.seller_wallet_balance || 0).toFixed(2)}</span>
                   </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 text-center italic">Safely held by system</p>
             </div>
          </div>
          
          <div className="md:col-span-2 space-y-3 sm:space-y-4 text-sm">
            <div className="bg-gray-100 p-3 rounded-xl border border-gray-200 mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">
              <span className="text-2xl hidden sm:block">👤</span>
              <div className="w-full sm:w-auto">
                <p className="font-bold text-gray-800 text-base">{selectedProductDetails.seller_name || 'N/A'}</p>
                <p className="text-xs text-gray-500 truncate">{selectedProductDetails.seller_email || 'N/A'} (ID: #{selectedProductDetails.seller_id})</p>
              </div>
              <button onClick={() => onViewProfile(selectedProductDetails.seller_id)} className="sm:ml-auto w-full sm:w-auto bg-blue-50 border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 shadow-sm">
                <Eye size={14} /> View Profile
              </button>
            </div>

            <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-2">
              <p className="flex flex-col sm:flex-row sm:items-start"><span className="font-semibold text-gray-500 w-24 shrink-0 inline-block mb-1 sm:mb-0">Product:</span> <span className="font-bold text-gray-800 leading-tight">{selectedProductDetails.product_name}</span></p>
              <p className="flex flex-col sm:flex-row"><span className="font-semibold text-gray-500 w-24 shrink-0 inline-block">Store Name:</span> <span className="text-gray-700">{selectedProductDetails.store_name}</span></p>
              <p className="flex flex-col sm:flex-row items-start sm:items-center"><span className="font-semibold text-gray-500 w-24 shrink-0 inline-block">Keyword:</span> <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold w-max">{selectedProductDetails.search_keyword}</span></p>
              <p className="flex flex-col sm:flex-row items-start sm:items-center"><span className="font-semibold text-gray-500 w-24 shrink-0 inline-block">Category:</span> <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-max">{selectedProductDetails.category || 'General'}</span></p>
              <p className="flex flex-col sm:flex-row"><span className="font-semibold text-gray-500 w-24 shrink-0 inline-block">Platform:</span> <span className="text-gray-800 font-semibold">{selectedProductDetails.platform} ({selectedProductDetails.country})</span></p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
              <span className="font-semibold text-gray-500 w-24 shrink-0 hidden sm:inline-block">Financials:</span> 
              <div className="flex gap-2">
                <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:gap-1">
                   <span className="text-xs text-gray-500">Price:</span> <b>USD ${selectedProductDetails.price}</b> <span className="text-[10px] text-gray-400 font-bold">({getConvertedPrice(selectedProductDetails.price, selectedProductDetails.country, selectedProductDetails.platform)} {getCurrencyForCountry(selectedProductDetails.country).code})</span>
                </span>
              </div>
            </div>
            <p className="flex items-center gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0 inline-block">Status:</span> {renderStatusBadge(selectedProductDetails.status)}</p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-blue-50/50 p-3 sm:p-4 rounded-xl border border-blue-100 mt-2">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <span className="font-semibold text-gray-500 mr-2">Target Qty:</span> <b className="text-gray-800 text-lg bg-white px-3 py-0.5 border rounded">{selectedProductDetails.required_orders}</b>
              </div>
              <div className="w-full h-px sm:w-px sm:h-6 bg-blue-200"></div>
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <span className="font-semibold text-gray-500 mr-2">Available Qty:</span> <b className="text-[#0066ff] text-lg bg-blue-100 px-3 py-0.5 border border-blue-200 rounded">{Math.max(0, selectedProductDetails.required_orders - (selectedProductDetails.application_count || 0))}</b>
              </div>
            </div>
            
            <div className="mt-4"><span className="font-semibold text-gray-500 block mb-1">Product Link:</span><a href={selectedProductDetails.product_link?.startsWith('http') ? selectedProductDetails.product_link : `https://${selectedProductDetails.product_link}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all bg-gray-50 p-3 block rounded-xl border border-gray-200">{selectedProductDetails.product_link}</a></div>
            <div className="mt-4"><span className="font-semibold text-gray-500 block mb-1">Seller Instructions:</span><p className="bg-indigo-50/50 p-4 rounded-xl text-gray-800 whitespace-pre-wrap border border-indigo-100 leading-relaxed text-sm">{selectedProductDetails.instructions}</p></div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 pt-5 border-t border-gray-200">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors mr-auto">Close Details</button>
          {selectedProductDetails.status === 'pending' && (
            <>
              <button onClick={() => rejectProduct(selectedProductDetails.id)} className="w-full sm:w-auto px-6 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 shadow-md transition-colors">Reject & Refund</button>
              <button onClick={() => approveProduct(selectedProductDetails.id)} className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-colors">Approve Product</button>
            </>
          )}
          {selectedProductDetails.status === 'approved' && (
            <button onClick={() => stopProductAction(selectedProductDetails.id)} className="w-full sm:w-auto px-6 py-2.5 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 shadow-md transition-colors">Stop Product</button>
          )}
          {selectedProductDetails.status === 'stopped' && (
            <>
              <button onClick={() => rejectProduct(selectedProductDetails.id)} className="w-full sm:w-auto px-6 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 shadow-md transition-colors">Delete & Refund</button>
              <button onClick={() => resumeProductAction(selectedProductDetails.id)} className="w-full sm:w-auto px-6 py-2.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 shadow-md transition-colors">Resume Product</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
