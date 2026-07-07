import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, ChevronDown, ChevronUp, Network, DollarSign, X } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showNewNetwork, setShowNewNetwork] = useState({});
  const [isUploadingQR, setIsUploadingQR] = useState(false);

  const token = localStorage.getItem('token');
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payment-methods/list`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) setMethods(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleUpdate = async (methodId) => {
    try {
      const res = await fetch(`${API_BASE}/api/payment-methods/update/${methodId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(editData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Updated successfully');
        setEditingId(null);
        fetchMethods();
      }
    } catch (err) {
      alert('Error updating payment method');
    }
  };

  const handleAddNetwork = async (methodId, networkName, networkCode) => {
    try {
      const res = await fetch(`${API_BASE}/api/payment-methods/network/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ payment_method_id: methodId, network_name: networkName, network_code: networkCode })
      });
      const data = await res.json();
      if (data.success) {
        fetchMethods();
        setShowNewNetwork({});
      }
    } catch (err) {
      alert('Error adding network');
    }
  };

  const handleDeleteNetwork = async (networkId) => {
    if (window.confirm('Delete this network?')) {
      try {
        const res = await fetch(`${API_BASE}/api/payment-methods/network/${networkId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          fetchMethods();
        }
      } catch (err) {
        alert('Error deleting network');
      }
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingQR(true);
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
      if (cloudJson.secure_url) {
        setEditData(prev => ({ ...prev, qr_code_url: cloudJson.secure_url }));
      }
    } catch (error) {
      alert("QR Code upload failed!");
    } finally {
      setIsUploadingQR(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-bold text-xl text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
        <DollarSign size={24} className="text-[#0066ff]"/> Payment Methods Management
      </h3>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {methods.map(method => (
            <div key={method.id} className="border rounded-lg overflow-hidden">
              <div 
                onClick={() => setExpandedId(expandedId === method.id ? null : method.id)}
                className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{method.name}</h4>
                  <p className="text-xs text-gray-500">{method.type.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${method.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {method.active ? 'Active' : 'Inactive'}
                  </span>
                  {expandedId === method.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedId === method.id && (
                <div className="p-4 border-t bg-white space-y-4">
                  {/* Edit Section */}
                  {editingId === method.id ? (
                    <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                      <input 
                        type="text" 
                        placeholder="Name" 
                        value={editData.name !== undefined ? editData.name : method.name}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="w-full p-2 border rounded text-sm outline-none"
                      />
                      <textarea 
                        placeholder="Description (e.g. PayPal Email, Binance Wallet Address...)"
                        value={editData.description !== undefined ? editData.description : (method.description || '')}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        className="w-full p-2 border rounded text-sm h-20 outline-none"
                      />
                      
                      {/* 🔥 NEW: QR Code Upload Section */}
                      <div className="bg-white p-3 rounded border">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Payment QR Code (Optional)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleQrUpload} 
                          className="w-full text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {isUploadingQR && <p className="text-[10px] text-blue-600 mt-1 animate-pulse font-bold">Uploading QR Code...</p>}
                        {editData.qr_code_url && (
                          <div className="mt-2 relative inline-block">
                            <img src={editData.qr_code_url} alt="QR Code" className="w-20 h-20 object-contain border rounded shadow-sm" />
                            <button 
                              onClick={() => setEditData({...editData, qr_code_url: null})} 
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                              title="Remove QR Code"
                            >
                              <X size={12}/>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => handleUpdate(method.id)}
                          className="flex-1 bg-[#0066ff] text-white py-2 rounded font-bold text-sm"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-bold text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600"><span className="font-bold">Receiving Details:</span> {method.description || 'No description provided'}</p>
                        {method.qr_code_url && (
                          <div className="mt-2">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Attached QR Code:</p>
                            <img src={method.qr_code_url} alt="QR Code" className="w-16 h-16 object-contain border rounded mt-1 shadow-sm" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => { setEditingId(method.id); setEditData(method); }}
                        className="p-2 bg-blue-50 text-[#0066ff] rounded hover:bg-blue-100 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}

                  {/* Fee Configuration */}
                  {method.fees && method.fees.length > 0 && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-xs font-bold text-amber-700 mb-1">Fee Configuration:</p>
                      {method.fees[0].type === 'fixed' ? (
                        <p className="text-sm text-amber-800">Fixed: ${method.fees[0].amount}</p>
                      ) : (
                        <p className="text-sm text-amber-800">Percentage: {method.fees[0].percentage}%</p>
                      )}
                    </div>
                  )}

                  {/* Networks (for crypto) */}
                  {method.requires_network && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-xs font-bold text-purple-700 mb-3 flex items-center gap-1">
                        <Network size={14} /> Supported Networks
                      </p>
                      <div className="space-y-2">
                        {method.networks && method.networks.map(net => (
                          <div key={net.id} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                            <span className="text-sm text-gray-700 font-semibold">{net.name} ({net.code})</span>
                            <button 
                              onClick={() => handleDeleteNetwork(net.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        {showNewNetwork[method.id] ? (
                          <div className="flex gap-2 mt-2">
                            <input 
                              type="text" 
                              placeholder="Network name (e.g. TRC20)"
                              id={`net-name-${method.id}`}
                              className="flex-1 p-2 border rounded text-sm outline-none"
                            />
                            <input 
                              type="text" 
                              placeholder="Code"
                              id={`net-code-${method.id}`}
                              className="w-20 p-2 border rounded text-sm outline-none"
                            />
                            <button 
                              onClick={() => {
                                const name = document.getElementById(`net-name-${method.id}`).value;
                                const code = document.getElementById(`net-code-${method.id}`).value;
                                if (name && code) handleAddNetwork(method.id, name, code);
                              }}
                              className="bg-green-600 text-white px-3 rounded font-bold text-sm"
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowNewNetwork({...showNewNetwork, [method.id]: true})}
                            className="w-full mt-2 p-2 bg-purple-100 text-purple-700 rounded text-sm font-bold flex items-center justify-center gap-1 hover:bg-purple-200 transition-colors"
                          >
                            <Plus size={16} /> Add Network
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Field Requirements */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs font-bold text-gray-700 mb-2">User Form Field Requirements:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {method.requires_address && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold text-center">✓ Address Required</span>}
                      {method.requires_network && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold text-center">✓ Network Required</span>}
                      {method.requires_memo && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded font-semibold text-center">✓ Memo/Tag Required</span>}
                      {method.requires_account_details && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-semibold text-center">✓ Account Details</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}