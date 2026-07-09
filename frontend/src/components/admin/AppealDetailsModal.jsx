import {  useState  } from 'react';
import { Scale, X, AlertTriangle, Eye } from 'lucide-react';

export default function AppealDetailsModal({
  selectedAppeal,
  onClose,
  onViewProfile,
  onActionSuccess,
  approveAppeal,
  rejectAppeal,
  API_BASE,
  handleAction
}) {
  const [disputeComment, setDisputeComment] = useState('');

  if (!selectedAppeal) return null;

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-200">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-200">Rejected</span>;
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-200">Pending</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-[10px] font-bold uppercase">{status.replace('_', ' ')}</span>;
    }
  };

  // Dispute Action Handlers
  const handleDisputeFavorSeller = async (appealId, applicationId) => {
    if (!disputeComment) return alert("Please enter an Admin Comment explaining your decision.");
    if(window.confirm('Favor Seller? This will reject the buyer\'s order and refund the seller.')) { 
      if(await handleAction(`${API_BASE}/api/appeals/dispute/${appealId}/favor-seller`, 'PATCH', { application_id: applicationId, admin_comment: disputeComment })) {
        setDisputeComment('');
        onActionSuccess();
      }
    }
  };

  const handleDisputeFavorBuyer = async (appealId, applicationId) => {
    if (!disputeComment) return alert("Please enter an Admin Comment explaining your decision.");
    if(window.confirm('Favor Buyer? This will move the order to Pending Refund.')) { 
      if(await handleAction(`${API_BASE}/api/appeals/dispute/${appealId}/favor-buyer`, 'PATCH', { application_id: applicationId, admin_comment: disputeComment })) {
        setDisputeComment('');
        onActionSuccess();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Scale size={24} className="text-indigo-500"/> Appeal Details
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
            <button 
              onClick={() => { onClose(); onViewProfile(selectedAppeal.user_id); }} 
              className="mt-2 sm:mt-0 sm:absolute top-4 right-4 text-[#0066ff] text-xs font-bold hover:underline flex items-center justify-center gap-1 bg-blue-50 border border-blue-100 px-2 py-1 rounded w-full sm:w-auto"
            >
              <Eye size={14} /> View Profile
            </button>
            <p className="font-bold text-gray-800 text-lg mt-2 sm:mt-0">{selectedAppeal.name}</p>
            <p className="text-sm text-gray-500 break-all">{selectedAppeal.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-gray-300">{selectedAppeal.role}</span>
              {renderStatusBadge(selectedAppeal.status)}
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <p className="font-bold text-indigo-800 mb-2 text-sm">
              {selectedAppeal.appeal_type === 'order_dispute' ? 'Seller Reason for Rejecting Review:' : 'Appeal Message:'}
            </p>
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto bg-white p-3 rounded-lg border border-indigo-50">
              {selectedAppeal.reason}
            </div>
          </div>

          {selectedAppeal.status === 'pending' && selectedAppeal.appeal_type === 'order_dispute' && (
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <AlertTriangle size={16} className="text-orange-500"/> Admin Decision Comment
              </label>
              <textarea 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 text-sm bg-gray-50" 
                placeholder="Explain why you are favoring the buyer or seller. This will be sent to the user..." 
                value={disputeComment} 
                onChange={(e) => setDisputeComment(e.target.value)}
              />
              <p className="text-[10px] text-gray-500 mt-1">Required to resolve the dispute.</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors mr-auto">
            Close
          </button>
          
          {selectedAppeal.status === 'pending' && selectedAppeal.appeal_type !== 'order_dispute' && (
            <>
              <button onClick={() => { rejectAppeal(selectedAppeal.id); onClose(); }} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors">
                Reject
              </button>
              <button onClick={() => { approveAppeal(selectedAppeal.id); onClose(); }} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors">
                Approve & Unban
              </button>
            </>
          )}
          
          {selectedAppeal.status === 'pending' && selectedAppeal.appeal_type === 'order_dispute' && (
            <>
              <button onClick={() => handleDisputeFavorSeller(selectedAppeal.id, selectedAppeal.application_id)} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm text-xs text-center">
                Favor Seller <span className="block text-[10px] font-normal opacity-80">(Reject Order)</span>
              </button>
              <button onClick={() => handleDisputeFavorBuyer(selectedAppeal.id, selectedAppeal.application_id)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm text-xs text-center">
                Favor Buyer <span className="block text-[10px] font-normal opacity-80">(Go to Refund)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}