import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Mail, MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// আপনার ব্যাকএন্ড URL
const BACKEND_URL = 'https://backend-6aiq.onrender.com';
const socket = io(BACKEND_URL, { withCredentials: true, autoConnect: false });

export default function Support() {
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'chat'
  
  // ইউজার ডেটা লোকাল স্টোরেজ থেকে নেওয়া হচ্ছে
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ==========================================
  // TAB 1: Email Support State & Logic
  // ==========================================
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/contact-support`, formData);
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (err) {
      console.error("Submit Error:", err);
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ==========================================
  // TAB 2: Live Private Chat State & Logic
  // ==========================================
  const [chatStatus, setChatStatus] = useState(null); // 'pending', 'active', 'ended', null
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // সকেট কানেকশন ও চ্যাট স্ট্যাটাস ফেচ করা
  useEffect(() => {
    if (activeTab === 'chat' && user) {
      socket.connect();
      // ✅ সঠিক কন্ডিশন
      if (user.verification_status === 'approved' || user.verification_status === 'verified') {
        fetchChatStatus();
      }
    }
    return () => {
      if (activeTab === 'chat') socket.disconnect();
    };
  }, [activeTab, user]);

  // সকেট ইভেন্ট লিসেনার
  useEffect(() => {
    if (sessionId) {
      socket.emit('join_chat_room', sessionId);

      const handleReceiveMessage = (message) => {
        setMessages((prev) => [...prev, message]);
      };
      const handleChatClosed = () => {
        setChatStatus('ended');
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('chat_closed_event', handleChatClosed);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('chat_closed_event', handleChatClosed);
      };
    }
  }, [sessionId]);

  // অটো-স্ক্রল
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const fetchChatStatus = async () => {
    setChatLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/me/status`, { withCredentials: true });
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
      console.error("Error fetching status:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchMessages = async (sid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/sessions/${sid}/messages`, { withCredentials: true });
      setMessages(res.data.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const requestLiveChat = async () => {
    setChatLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/private-chat/request`, {}, { withCredentials: true });
      setChatStatus('pending');
    } catch (error) {
      console.error("Error requesting chat:", error);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-5 text-center font-bold text-sm md:text-base transition-colors ${activeTab === 'email' ? 'text-[#0066ff] border-b-2 border-[#0066ff] bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Mail className="inline-block mr-2 w-5 h-5 mb-1" />
              Email Support
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-5 text-center font-bold text-sm md:text-base transition-colors ${activeTab === 'chat' ? 'text-[#0066ff] border-b-2 border-[#0066ff] bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <MessageSquare className="inline-block mr-2 w-5 h-5 mb-1" />
              Live Private Chat
            </button>
          </div>

          <div className="flex-grow p-8 md:p-12">
            
            {/* =========================================
                TAB 1: EMAIL SUPPORT
               ========================================= */}
            {activeTab === 'email' && (
              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1">
                  <h1 className="text-4xl font-black text-gray-900 mb-4">Contact Support</h1>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    Facing issues with an order dispute, wallet withdrawal, or account access? Send us a message and our admin team will resolve it manually.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl text-blue-900">
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                        <Mail size={24} className="text-[#0066ff]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900/60">Email Us</p>
                        <p className="font-bold">support@promotinsight.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  {submitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-green-50 rounded-2xl border border-green-100">
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-4">
                        <Send size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent!</h3>
                      <p className="text-green-800/80">Our support team will get back to you within 24 hours.</p>
                      <button 
                        onClick={() => setSubmitted(false)}
                        className="mt-6 text-sm font-bold text-green-700 hover:text-green-800 underline"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-semibold">{error}</div>}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                        <input 
                          type="text" required value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                        <input 
                          type="email" required value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">How can we help?</label>
                        <textarea 
                          required rows="4" value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all resize-none"
                          placeholder="Describe your issue..."
                        ></textarea>
                      </div>
                      <button 
                        type="submit" disabled={emailLoading}
                        className="w-full bg-[#0066ff] hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex justify-center items-center"
                      >
                        {emailLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Send Message'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* =========================================
                TAB 2: LIVE PRIVATE CHAT
               ========================================= */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                
                {/* Not Logged In */}
                {!user && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 rounded-2xl border border-gray-200 py-20">
                    <AlertCircle className="text-gray-400 mb-4 w-16 h-16" />
                    <h3 className="text-2xl font-bold text-gray-800">Login Required</h3>
                    <p className="text-gray-500 mt-2">Please login to your account to use the live chat feature.</p>
                  </div>
                )}

                {/* ✅ সঠিক কন্ডিশন: Not Verified */}
                {user && user.verification_status !== 'approved' && user.verification_status !== 'verified' && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-red-50 rounded-2xl border border-red-100 py-20">
                    <AlertCircle className="text-red-500 mb-4 w-16 h-16" />
                    <h3 className="text-2xl font-bold text-red-800">Verification Required</h3>
                    <p className="text-red-600 mt-2">Please verify your profile from the dashboard to enable private chat.</p>
                  </div>
                )}

                {/* ✅ সঠিক কন্ডিশন: Verified but No Request */}
                {user && (user.verification_status === 'approved' || user.verification_status === 'verified') && chatStatus === null && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="bg-blue-50 p-6 rounded-full mb-6">
                      <MessageSquare className="text-[#0066ff] w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-4">Instant Live Support</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Connect directly with an admin for immediate assistance regarding your account or orders.</p>
                    <button 
                      onClick={requestLiveChat}
                      disabled={chatLoading}
                      className="bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl transition-all flex items-center gap-3 text-lg"
                    >
                      {chatLoading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Request Live Chat Now'}
                    </button>
                  </div>
                )}

                {/* ✅ সঠিক কন্ডিশন: Pending Approval */}
                {user && (user.verification_status === 'approved' || user.verification_status === 'verified') && chatStatus === 'pending' && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <Loader2 className="animate-spin text-[#0066ff] w-16 h-16 mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Sent Successfully!</h3>
                    <p className="text-gray-500">Waiting for an admin to accept your request. Your chat interface will open here automatically.</p>
                  </div>
                )}

                {/* ✅ সঠিক কন্ডিশন: Active Chat Interface */}
                {user && (user.verification_status === 'approved' || user.verification_status === 'verified') && (chatStatus === 'active' || chatStatus === 'ended') && (
                  <div className="flex flex-col h-[500px] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
                    
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-center text-gray-400 font-medium bg-white px-6 py-2 rounded-full shadow-sm">Chat started! Say hello to the Admin.</p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.sender_user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${msg.sender_user_id === user.id ? 'bg-[#0066ff] text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                              <p className="leading-relaxed">{msg.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                      {chatStatus === 'ended' ? (
                        <div className="text-center p-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100">
                          Chat session has been closed by the Admin.
                        </div>
                      ) : (
                        <form onSubmit={sendChatMessage} className="flex gap-3 relative">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 px-6 py-4 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:bg-white rounded-2xl transition-all"
                          />
                          <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-[#0066ff] disabled:bg-gray-300 text-white px-6 rounded-2xl transition-all flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
                          >
                            <Send className="w-6 h-6" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}