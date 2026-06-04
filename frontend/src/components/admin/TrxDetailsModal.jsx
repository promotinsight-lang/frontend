import React from 'react';
import { Wallet, X, ShieldCheck } from 'lucide-react';

export default function TrxDetailsModal({
  selectedTrx,
  trxType,
  onClose,
  onImageClick
}) {
  if (!selectedTrx) return null;

  // Status Badge Helper Function
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-200">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-200">Rejected</span>;
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-200">Pending</span>;
      case 'completed': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-200">Completed</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-[10px] font-bold uppercase">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto animate-fade-in-up">
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 capitalize">
            <Wallet size={20} className={trxType === 'deposit' ? 'text-green-500' : 'text-red-500'}/> 
            {trxType} Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-50 rounded-full p-1 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="flex justify-between items-center">
            <span className="font-bold text-gray-500">User:</span> 
            <span className="font-semibold">{selectedTrx.name || selectedTrx.email}</span>
          </p>
          <div className="w-full h-px bg-gray-200"></div>
          
          <p className="flex justify-between items-center">
            <span className="font-bold text-gray-500">Amount:</span> 
            <span className={`font-black text-lg ${trxType === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
              ${Number(selectedTrx.amount).toFixed(2)}
            </span>
          </p>
          <div className="w-full h-px bg-gray-200"></div>
          
          <p className="flex justify-between items-center">
            <span className="font-bold text-gray-500">Method:</span> 
            <span className="font-bold bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">{selectedTrx.payment_method}</span>
          </p>
          <div className="w-full h-px bg-gray-200"></div>
          
          {/* Account / Wallet Details Section */}
          {(selectedTrx.account_details || selectedTrx.crypto_address) && (
            <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-sm mt-2">
              <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider mb-1.5">
                {trxType === 'deposit' ? 'From Account / Wallet:' : 'To Account:'}
              </span>
              
              {selectedTrx.crypto_address ? (
                <div className="space-y-1 text-xs text-gray-700">
                  <p><span className="font-semibold">Address:</span> <span className="font-mono break-all font-medium text-gray-800">{selectedTrx.crypto_address}</span></p>
                  {selectedTrx.crypto_network && <p><span className="font-semibold">Network:</span> {selectedTrx.crypto_network}</p>}
                  {selectedTrx.crypto_memo && <p><span className="font-semibold">Memo:</span> {selectedTrx.crypto_memo}</p>}
                </div>
              ) : (
                <span className="font-mono text-sm font-medium break-all">{selectedTrx.account_details}</span>
              )}
            </div>
          )}

          {/* Payment Proof Section */}
          {(selectedTrx.transaction_id || selectedTrx.screenshot_url || selectedTrx.image_url || selectedTrx.proof_url) && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-3 shadow-sm">
              <p className="font-black text-blue-800 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1">
                <ShieldCheck size={14}/> Payment Proof
              </p>
              
              {selectedTrx.transaction_id && (
                 <div className="mb-3">
                   <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Trx ID:</p>
                   <p className="font-mono bg-white px-2 py-1.5 border border-blue-200 rounded font-bold text-gray-800 break-all">{selectedTrx.transaction_id}</p>
                 </div>
              )}
              
              {(selectedTrx.screenshot_url || selectedTrx.image_url || selectedTrx.proof_url) && (
                 <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Screenshot:</p>
                   <img 
                     src={selectedTrx.screenshot_url || selectedTrx.image_url || selectedTrx.proof_url} 
                     alt="Proof" 
                     onClick={() => onImageClick(selectedTrx.screenshot_url || selectedTrx.image_url || selectedTrx.proof_url)}
                     className="w-20 h-20 object-cover rounded-lg border border-blue-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
                     title="Click to view full image"
                   />
                 </div>
              )}
            </div>
          )}
          
          <div className="w-full h-px bg-gray-200"></div>
          <p className="flex justify-between items-center">
            <span className="font-bold text-gray-500">Date:</span> 
            <span className="font-medium text-right">{new Date(selectedTrx.created_at).toLocaleString()}</span>
          </p>
          <div className="w-full h-px bg-gray-200"></div>
          
          <p className="flex justify-between items-center">
            <span className="font-bold text-gray-500">Status:</span> 
            {renderStatusBadge(selectedTrx.status)}
          </p>
        </div>
        
        <div className="mt-6">
          <button onClick={onClose} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black shadow-md transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}