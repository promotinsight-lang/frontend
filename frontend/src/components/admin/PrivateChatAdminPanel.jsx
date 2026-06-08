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
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [activeSessions, setActiveSessions] = useState([]); // 🟢 Active sob session list rarakhar jonno
  const messagesEndRef = useRef(null);

  const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

  const getHeaders = () => ({
    withCredentials: true,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    socket.connect();
    fetchPendingRequests();
    fetchActiveSessions(); // 🟢 Prothomei active list-ti load hobe

    socket.on('online_users_update', (users) => setOnlineUsers(users));
    socket.emit('request_online_users'); 

    // ✅ Auto-Refresh: Pending o Active session er data 5s por por fetch korbe
    const pollInterval = setInterval(async () => {
      try {
        const resReq = await axios.get(`${BACKEND_URL}/api/private-chat/admin/requests`, getHeaders());
        if (resReq.data.success) setPendingRequests(resReq.data.data);

        const resAct = await axios.get(`${BACKEND_URL}/api/private-chat/admin/sessions`, getHeaders());
        if (resAct.data.success) setActiveSessions(resAct.data.data || resAct.data.sessions || resAct.data.activeSessions || []);
      } catch (err) {} 
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      socket.off('online_users_update');
      socket.disconnect();
    };
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

  // 🟢 Active list load korar function
  const fetchActiveSessions = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/admin/sessions`, getHeaders());
      if (res.data.success) {
        // 🟢 Shob dhoroner backend key fallback check
        setActiveSessions(res.data.data || res.data.sessions || res.data.activeSessions || []);
      }
    } catch (err) { console.error(err); }
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
        fetchActiveSessions(); // 🟢 Sathe sathe active list refresh korbe
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
          fetchActiveSessions(); // 🟢 চ্যাট শুরু হওয়ার সাথে সাথে লিস্ট রিফ্রেশ হবে
       }
     } catch (err) { alert('Failed to start chat'); }
  };
// 🟢 100% Fail-safe: Admin active chat-e thakle ota jodi api list-e na-o ashe, client-side auto merge hobe
  const displaySessions = [...activeSessions];
  if (activeSession && !displaySessions.some(s => s.id === activeSession.id)) {
    displaySessions.push(activeSession);
  }
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
          <div className="h-full flex flex-col md:flex-row gap-4">
            
            {/* 🟢 Left Side: Active Session Sidebar List */}
            <div className="w-full md:w-60 bg-white border border-gray-200 rounded-xl p-3 flex flex-col h-[180px] md:h-full overflow-y-auto shrink-0">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5 px-1">Active Sessions ({displaySessions.length})</h4>
              {displaySessions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No active chats</p>
              ) : (
                <div className="space-y-1">
                  {displaySessions.map((session) => {
                    const isSelected = activeSession?.id === session.id;
                    const isUserOnline = onlineUsers.includes(String(session.user_id));
                    return (
                      <div 
                        key={session.id}
                        onClick={() => { setActiveSession(session); fetchMessages(session.id); }}
                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all border ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700'}`}
                      >
                        <div className="truncate flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isUserOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                          <span className="text-xs truncate">{session.name || `User #${session.user_id}`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 🟢 Right Side: Real-time Selected Chat Box */}
            <div className="flex-1 flex flex-col h-full min-h-[350px]">
              {!activeSession ? (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-xl flex-1 flex flex-col justify-center items-center">
                  <MessageSquare size={44} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 font-bold text-sm">Select an active user from list</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Manage multiple client live conversations at the same time.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-1">
                  <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-green-900 text-sm flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${onlineUsers.includes(String(activeSession.user_id)) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span> 
                        {activeSession.name || `User #${activeSession.user_id}`}
                      </h4>
                      <p className="text-[10px] text-green-700 font-medium">Email: {activeSession.email || 'N/A'}</p>
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
                    <form onSubmit={sendMessage} className="flex gap-2 items-center">
                      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0066ff] transition-all text-sm" />
                      <button type="submit" disabled={!newMessage.trim()} className="bg-[#0066ff] text-white w-12 h-12 flex items-center justify-center shrink-0 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
                        <Send size={20} className="ml-0.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

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
                    <div className="truncate pr-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-800 truncate">{u.name}</h4>
                        
                        {/* 🟢 Online/Offline Badge */}
                        {onlineUsers.includes(String(u.id)) ? (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium border border-gray-100 px-2 py-0.5 rounded-full bg-gray-50">Offline</span>
                        )}
                      </div>
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