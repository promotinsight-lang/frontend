import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, CheckCircle, XCircle, Users, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const BACKEND_URL = 'https://backend-6aiq.onrender.com';
const socket = io(BACKEND_URL, { autoConnect: false });

export default function PrivateChatAdminPanel() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'users'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

  const getHeaders = () => ({
    withCredentials: true,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    socket.connect();
    fetchPendingRequests();
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (activeSession) {
      socket.emit('join_chat_room', activeSession.id);
      const handleReceive = (msg) => setMessages((prev) => [...prev, msg]);
      socket.on('receive_message', handleReceive);
      return () => socket.off('receive_message', handleReceive);
    }
  }, [activeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/admin/requests`, getHeaders());
      if (res.data.success) setPendingRequests(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchVerifiedUsers = async () => {
     setLoading(true);
     try {
       // Buyer এবং Seller উভয়ের ডেটা একসাথে ফেচ করা হচ্ছে
       const [buyersRes, sellersRes] = await Promise.all([
         axios.get(`${BACKEND_URL}/api/users/admin/role/buyer`, getHeaders()),
         axios.get(`${BACKEND_URL}/api/users/admin/role/seller`, getHeaders())
       ]);
       
       let allUsers = [];
       if (buyersRes.data && buyersRes.data.success) allUsers = [...allUsers, ...buyersRes.data.data];
       if (sellersRes.data && sellersRes.data.success) allUsers = [...allUsers, ...sellersRes.data.data];

       // শুধুমাত্র ভেরিফাইড ইউজারদের ফিল্টার করা
       setVerifiedUsers(allUsers.filter(u => u.verification_status === 'approved' || u.verification_status === 'verified'));
     } catch(err) { 
       console.error("Error fetching users:", err); 
     }
     setLoading(false);
  };

  const approveRequest = async (id) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/private-chat/admin/requests/${id}/approve`, {}, getHeaders());
      if (res.data.success) {
        setActiveSession(res.data.session);
        setActiveTab('active');
        fetchMessages(res.data.session.id);
        fetchPendingRequests();
      }
    } catch (err) { alert('Failed to approve'); }
  };

  const rejectRequest = async (id) => {
    if(!window.confirm('Reject this chat request?')) return;
    try {
      await axios.post(`${BACKEND_URL}/api/private-chat/admin/requests/${id}/reject`, {}, getHeaders());
      fetchPendingRequests();
    } catch (err) { alert('Failed to reject'); }
  };

  const fetchMessages = async (sid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/sessions/${sid}/messages`, getHeaders());
      setMessages(res.data.data);
    } catch (err) { console.error(err); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession) return;
    socket.emit('send_message', { sessionId: activeSession.id, senderId: adminUser.id, message: newMessage });
    setNewMessage('');
  };

  const endChat = async () => {
    if(!window.confirm("Are you sure you want to end this chat session?")) return;
    try {
      await axios.post(`${BACKEND_URL}/api/private-chat/admin/sessions/${activeSession.id}/end`, {}, getHeaders());
      socket.emit('admin_ends_chat_session', activeSession.id);
      setActiveSession(null);
      setActiveTab('pending');
    } catch (err) { alert('Failed to end chat'); }
  };

  const startDirectChat = async (userId) => {
     try {
       const res = await axios.post(`${BACKEND_URL}/api/private-chat/admin/start`, { userId }, getHeaders());
       if(res.data.success) {
          setActiveSession(res.data.session);
          setActiveTab('active');
          fetchMessages(res.data.session.id);
       }
     } catch (err) { alert('Failed to start chat'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[700px] w-full">
      {/* Header Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
        <button onClick={() => { setActiveTab('pending'); fetchPendingRequests(); }} className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 ${activeTab === 'pending' ? 'text-[#0066ff] bg-blue-50 border-b-2 border-[#0066ff]' : 'text-gray-500 hover:bg-gray-100'}`}>
          <AlertCircle size={18} /> Pending {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 ${activeTab === 'active' ? 'text-green-600 bg-green-50 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-100'}`}>
          <MessageSquare size={18} /> Active Chat {activeSession && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
        </button>
        <button onClick={() => { setActiveTab('users'); fetchVerifiedUsers(); }} className={`flex-1 py-4 font-bold text-sm flex justify-center items-center gap-2 ${activeTab === 'users' ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}>
          <Users size={18} /> Start New
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
        
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {loading ? <p className="text-center text-gray-400 py-10 animate-pulse">Loading requests...</p> : pendingRequests.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No pending chat requests right now.</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-gray-800">{req.name}</h4>
                    <p className="text-xs text-gray-500">{req.email}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Requested: {new Date(req.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => rejectRequest(req.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex-1 sm:flex-none flex justify-center"><XCircle size={20}/></button>
                    <button onClick={() => approveRequest(req.id)} className="px-4 py-2 bg-[#0066ff] text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-none"><CheckCircle size={16}/> Accept Chat</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="h-full flex flex-col">
            {!activeSession ? (
              <div className="text-center py-20 flex-1">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No active chat session. Please accept a request or start a new chat.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-green-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Session</h4>
                    <p className="text-xs text-green-700">Chatting with User ID: {activeSession.user_id}</p>
                  </div>
                  <button onClick={endChat} className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"><X size={14}/> End Session</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  {messages.length === 0 ? <p className="text-center text-gray-400 text-sm mt-10">Chat started! Send a message.</p> : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender_user_id === adminUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender_user_id === adminUser.id ? 'bg-[#0066ff] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 bg-white border-t border-gray-200">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0066ff] transition-all text-sm" />
                    <button type="submit" disabled={!newMessage.trim()} className="bg-[#0066ff] text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"><Send size={18} /></button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
              <h4 className="font-bold text-purple-900 mb-1">Start Direct Chat</h4>
              <p className="text-xs text-purple-700">Select any verified user below to instantly start a private live chat session.</p>
            </div>
            {loading ? <p className="text-center text-gray-400 py-10 animate-pulse">Loading users...</p> : verifiedUsers.length === 0 ? (
              <p className="text-center text-gray-500">No verified users found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifiedUsers.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:border-purple-300 transition-colors">
                    <div className="truncate pr-4">
                      <h4 className="font-bold text-gray-800 truncate">{u.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <button onClick={() => startDirectChat(u.id)} className="p-2.5 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg transition-colors shrink-0" title="Start Chat">
                      <MessageSquare size={18}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}