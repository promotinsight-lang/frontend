import { useEffect, useState } from 'react';
import { CheckCircle, Wallet } from 'lucide-react';

export default function LoanApprovalModal({
  application,
  onClose,
  onSuccess,
}) {
  const [proof, setProof] = useState({
    transaction_id: '',
    total_amount: '',
    screenshot_url: '',
    note: '',
  });
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (application) {
      setProof({
        transaction_id: '',
        total_amount: application.order_total_amount ? Number(application.order_total_amount).toFixed(2) : '',
        screenshot_url: '',
        note: '',
      });
    }
  }, [application]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const cloudData = new FormData();
      cloudData.append('file', file);
      cloudData.append('upload_preset', 'promot_insight_preset');
      cloudData.append('cloud_name', 'dtlkf5smb');

      const res = await fetch('https://api.cloudinary.com/v1_1/dtlkf5smb/image/upload', {
        method: 'POST',
        body: cloudData,
      });
      const cloudJson = await res.json();
      if (!cloudJson.secure_url) throw new Error('Upload failed');
      setProof((prev) => ({ ...prev, screenshot_url: cloudJson.secure_url }));
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      alert('Image upload failed! Please try again.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    if (!proof.transaction_id.trim()) {
      alert('Transaction ID is required.');
      return;
    }
    if (!proof.screenshot_url) {
      alert('Payment screenshot is required.');
      return;
    }
    const amount = Number(proof.total_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Valid total amount is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess({
        ...proof,
        total_amount: amount.toFixed(2),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!application) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Wallet className="text-green-500" /> Approve Loan Credit
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Add loan credit for <b className="text-gray-800">{application.buyer_name || 'Buyer'}</b>.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
          <p className="text-xs font-black text-green-700 uppercase">Requested order total</p>
          <p className="text-2xl font-black text-green-800 mt-1">
            ${Number(application.order_total_amount || 0).toFixed(2)}
          </p>
          {application.order_paypal_address && (
            <p className="text-xs text-green-700 font-semibold break-all mt-2">
              PayPal: {application.order_paypal_address}
            </p>
          )}
        </div>

        <form onSubmit={submitApproval} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Transaction ID</label>
            <input
              required
              type="text"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50"
              value={proof.transaction_id}
              onChange={(e) => setProof({ ...proof, transaction_id: e.target.value })}
              placeholder="e.g. TRX123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Total Amount</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50"
              value={proof.total_amount}
              onChange={(e) => setProof({ ...proof, total_amount: e.target.value })}
              placeholder="50.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Payment Screenshot</label>
            <input
              required={!proof.screenshot_url}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-2 border bg-gray-50 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
            {isUploadingProof && <p className="text-xs text-green-600 mt-1 animate-pulse font-semibold">Uploading image to secure storage...</p>}
            {proof.screenshot_url && (
              <p className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1">
                <CheckCircle size={13} /> Payment screenshot attached.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Note</label>
            <textarea
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50 h-20 resize-none"
              value={proof.note}
              onChange={(e) => setProof({ ...proof, note: e.target.value })}
              placeholder="Optional admin note for buyer"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isUploadingProof || isSubmitting} className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md disabled:opacity-50">
              Add Credit & Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
