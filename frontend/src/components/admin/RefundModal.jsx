import {  useState  } from 'react';
import { Wallet } from 'lucide-react';

export default function RefundModal({ 
  selectedAppDetails, 
  onClose, 
  onSuccess 
}) {
  const [refundData, setRefundData] = useState({ orderNumber: '', screenshot_url: '', comment: '' });
  const [isUploadingRefundProof, setIsUploadingRefundProof] = useState(false);

  const handleRefundImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingRefundProof(true);
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

      setRefundData(prev => ({ ...prev, screenshot_url: cloudJson.secure_url }));
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      alert("Image upload failed! Please try again.");
    } finally {
      setIsUploadingRefundProof(false);
    }
  };

  const submitRefund = async (e) => {
    e.preventDefault();
    await onSuccess(refundData);
  };

  if (!selectedAppDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Wallet className={selectedAppDetails.category === 'Pre-Pay' ? 'text-orange-500' : 'text-green-500'}/>
          {selectedAppDetails.category === 'Pre-Pay' ? 'Confirm Pre-Pay (External)' : 'Confirm Refund Payment'}
        </h3>
        <div className={`border p-4 rounded-xl mb-6 shadow-sm ${selectedAppDetails.category === 'Pre-Pay' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
            {selectedAppDetails.category === 'Pre-Pay' ? (
              <p className="text-sm text-orange-800 font-semibold leading-relaxed">You are marking this Pre-Pay application as paid. Send the funds directly to the buyer's external account (e.g. PayPal) and submit the proof below. <strong className="font-black text-red-600 block mt-2 bg-red-100 px-2 py-1 rounded">Funds will NOT be added to the system wallet.</strong></p>
            ) : (
              <p className="text-sm text-green-800 font-semibold leading-relaxed">The product amount will be added directly to the buyer's account after admin confirmation.</p>
            )}
        </div>
        <form onSubmit={submitRefund} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{selectedAppDetails.category === 'Pre-Pay' ? 'Transaction ID (Optional)' : 'Admin Order / Ref Number'}</label>
            <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0066ff] outline-none transition-all" value={refundData.orderNumber} onChange={e => setRefundData({...refundData, orderNumber: e.target.value})} placeholder={selectedAppDetails.category === 'Pre-Pay' ? 'Enter Trx ID...' : 'e.g. REF-12345...'} />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Payment Screenshot (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleRefundImageUpload} 
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0066ff] file:text-white hover:file:bg-blue-700 cursor-pointer transition-all" 
            />
            {isUploadingRefundProof && <p className="text-xs text-blue-600 mt-1 animate-pulse font-semibold">Uploading image to secure storage...</p>}
            {refundData.screenshot_url && <p className="text-xs text-green-600 mt-1 font-bold">✓ Image successfully attached!</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Admin Comment (Optional)</label>
            <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0066ff] outline-none h-20 resize-none transition-all" value={refundData.comment} onChange={e => setRefundData({...refundData, comment: e.target.value})} placeholder="Message to the buyer..." />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors">Cancel</button>
            <button type="submit" disabled={isUploadingRefundProof} className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-colors ${selectedAppDetails.category === 'Pre-Pay' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}>{selectedAppDetails.category === 'Pre-Pay' ? 'Confirm External Payment' : 'Send Wallet Refund'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
