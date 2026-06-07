import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const BACKEND_URL = 'https://backend-6aiq.onrender.com';
const socket = io(BACKEND_URL, { withCredentials: true, autoConnect: false });

export default function LiveChatModal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [chatStatus, setChatStatus] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, [isOpen]);

  // ✅ স্মার্ট ভেরিফিকেশন চেক (Case Insensitive)
  const isVerified = user && (user.verification_status?.toLowerCase() === 'approved' || user.verification_status?.toLowerCase() === 'verified');

  useEffect(() => {
    if (isOpen && user) {
      socket.connect();
      if (isVerified) {
        fetchChatStatus();
      }
    }
    return () => {
      socket.disconnect();
    };
  }, [isOpen, user, isVerified]);

  useEffect(() => {
    if (sessionId) {
      socket.emit('join_chat_room', sessionId);

      const handleReceive = (msg) => setMessages((prev) => [...prev, msg]);
      const handleClose = () => setChatStatus('ended');

      socket.on('receive_message', handleReceive);
      socket.on('chat_closed_event', handleClose);

      return () => {
        socket.off('receive_message', handleReceive);
        socket.off('chat_closed_event', handleClose);
      };
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatStatus]);

  // ✅ 401 Unauthorized Error Fix
  const getHeaders = () => ({
    withCredentials: true,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchChatStatus = async () => {
    setChatLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/me/status`, getHeaders());
      if (res.data.activeSession) {
        setSessionId(res.data.activeSession.id);
        setChatStatus('active');
        fetchMessages(res.data.activeSession.id);
      } else if (res.data.pendingRequest) {
        setChatStatus('pending');
      } else {
        setChatStatus(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchMessages = async (sid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/sessions/${sid}/messages`, getHeaders());
      setMessages(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const requestLiveChat = async () => {
    setChatLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/private-chat/request`, {}, getHeaders());
      if (res.data && res.data.success) {
        setChatStatus('pending');
        alert("✅ Chat request sent successfully!");
      } else {
        alert("⚠️ Request sent, but no success response: " + JSON.stringify(res.data));
        setChatStatus('pending');
      }
    } catch (error) {
      console.error("Chat Request Error:", error);
      // স্ক্রিনে এরর মেসেজ দেখানোর জন্য Alert
      alert("❌ Error: " + (error.response?.data?.message || error.message));
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId || !user) return;

    socket.emit('send_message', {
      sessionId,
      senderId: user.id,
      message: newMessage
    });
    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
            <MessageSquare className="text-[#0066ff]"/> Live Private Chat
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white shadow-sm border border-gray-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 flex flex-col p-4 sm:p-6">
          
          {/* Unverified User */}
          {user && !isVerified && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <AlertCircle className="text-red-500 w-16 h-16 mb-4" />
              <h3 className="text-2xl font-bold text-red-800">Verification Required</h3>
              <p className="text-red-600 mt-2 text-sm">Please verify your profile from the dashboard to enable private chat.</p>
            </div>
          )}

          {/* Request Button */}
          {user && isVerified && chatStatus === null && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="bg-blue-50 p-6 rounded-full mb-6">
                <MessageSquare className="text-[#0066ff] w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Instant Live Support</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">Connect directly with an admin for immediate assistance.</p>
              <button onClick={requestLiveChat} disabled={chatLoading} className="bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center gap-3">
                {chatLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Request Live Chat Now'}
              </button>
            </div>
          )}

          {/* Pending Approval */}
          {user && isVerified && chatStatus === 'pending' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <Loader2 className="animate-spin text-[#0066ff] w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent Successfully!</h3>
              <p className="text-gray-500 text-sm">Waiting for an admin to accept your request...</p>
            </div>
          )}

          {/* Active Chat */}
          {user && isVerified && (chatStatus === 'active' || chatStatus === 'ended') && (
            <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm mt-10">Chat started! Say hello.</p>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender_user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender_user_id === user.id ? 'bg-[#0066ff] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                {chatStatus === 'ended' ? (
                  <div className="text-center p-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100">
                    Chat closed by Admin.
                  </div>
                ) : (
                  <form onSubmit={sendChatMessage} className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#0066ff] transition-all text-sm" />
                    <button type="submit" disabled={!newMessage.trim()} className="bg-[#0066ff] text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}