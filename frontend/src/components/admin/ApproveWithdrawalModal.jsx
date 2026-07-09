import {  useState  } from 'react';
import { Wallet } from 'lucide-react';

export default function ApproveWithdrawalModal({
  withdrawalToApprove,
  onClose,
  onSuccess,
  onImageClick,
  API_BASE,
  handleAction
}) {
  const [withdrawalProof, setWithdrawalProof] = useState({ transaction_id: '', screenshot_url: '' });
  const [isUploadingWithdrawalProof, setIsUploadingWithdrawalProof] = useState(false);

  // Image Upload Handler
  const handleWithdrawalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingWithdrawalProof(true);
    try {
      const cloudData = new FormData();
      cloudData.append("file", file);
      cloudData.append("upload_preset", "promot_insight_preset");
      cloudData.append("cloud_name", "dtlkf5smb");

      const res = await fetch("https://api.cloudinary.com/v1_1/dtlkf5smb/image/upload", {
        method: "POST",
        body: cloudData,
      });
      const cloudJson = await res.json();
      if (!cloudJson.secure_url) throw new Error("Upload failed");

      setWithdrawalProof(prev => ({ ...prev, screenshot_url: cloudJson.secure_url }));
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      alert("Image upload failed! Please try again.");
    } finally {
      setIsUploadingWithdrawalProof(false);
    }
  };

  // Submit Handler
  const submitWithdrawalApproval = async (e) => {
    e.preventDefault();
    if (await handleAction(`${API_BASE}/api/withdrawals/${withdrawalToApprove.id}/approve`, 'PATCH', withdrawalProof)) {
      setWithdrawalProof({ transaction_id: '', screenshot_url: '' });
      onSuccess();
    }
  };

  if (!withdrawalToApprove) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Wallet className="text-green-500" /> Confirm Payment Sent
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          You are marking a withdrawal of <b className="text-red-600">${withdrawalToApprove.amount}</b> to <b className="text-gray-800">{withdrawalToApprove.name}</b> as Paid.
        </p>
        
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Transfer To:</p>
          <p className="font-semibold text-sm">{withdrawalToApprove.payment_method}</p>
          {withdrawalToApprove.is_crypto || withdrawalToApprove.crypto_address ? (
            <div className="mt-2 space-y-1 bg-white p-2 border rounded">
              <p className="text-xs"><span className="font-bold text-gray-500">Address:</span> <span className="font-mono break-all">{withdrawalToApprove.crypto_address}</span></p>
              {withdrawalToApprove.crypto_network && <p className="text-xs"><span className="font-bold text-gray-500">Network:</span> {withdrawalToApprove.crypto_network}</p>}
              {withdrawalToApprove.crypto_memo && <p className="text-xs"><span className="font-bold text-gray-500">Memo/Tag:</span> {withdrawalToApprove.crypto_memo}</p>}
            </div>
          ) : (
            <p className="font-mono text-sm break-all bg-white p-1 mt-1 border rounded">{withdrawalToApprove.account_details}</p>
          )}
          
          {/* Show User's Uploaded QR Code */}
          {withdrawalToApprove.qr_code_url && (
            <div className="mt-3 bg-white p-2 border rounded">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">User's Receiving QR Code:</p>
              <img 
                src={withdrawalToApprove.qr_code_url} 
                alt="User QR Code" 
                className="w-20 h-20 object-contain border p-1 rounded cursor-pointer hover:opacity-80 transition-opacity shadow-sm" 
                onClick={() => onImageClick(withdrawalToApprove.qr_code_url)}
                title="Click to view full screen"
              />
            </div>
          )}
        </div>

        <form onSubmit={submitWithdrawalApproval} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Transaction ID (Required)</label>
            <input required type="text" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50" value={withdrawalProof.transaction_id} onChange={e => setWithdrawalProof({...withdrawalProof, transaction_id: e.target.value})} placeholder="e.g., TRX123456789" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Payment Screenshot (Optional / Required)</label>
            <input type="file" accept="image/*" onChange={handleWithdrawalImageUpload} className="w-full p-2 border bg-gray-50 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" />
            {isUploadingWithdrawalProof && <p className="text-xs text-green-600 mt-1 animate-pulse font-semibold">Uploading image to secure storage...</p>}
            {withdrawalProof.screenshot_url && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image successfully attached!</p>}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isUploadingWithdrawalProof} className="w-full sm:w-auto px-4 py-2.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 shadow-md disabled:opacity-50">Mark Paid & Notify User</button>
          </div>
        </form>
      </div>
    </div>
  );
}