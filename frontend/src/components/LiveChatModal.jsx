import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const socket = io(BACKEND_URL, { withCredentials: true, autoConnect: false });

const AUTO_REPLY_MESSAGES = [
  'Welcome to PromotInsight! You are in the right place to join trusted campaigns and manage your buyer account clearly.',
  'Buyers can complete verified product campaigns and view admin-managed loan credit from their account profile. Sellers can reach real verified buyers for authentic engagement.',
  'Your trust matters here: verified users, admin-reviewed orders, wallet tracking, and support are all designed to keep the process clear and secure.',
  'Tell us what you need today: buyer account help, loan credit, seller campaigns, wallet help, or order support.'
];

const AutoReplyCard = () => (
  <div className="w-full text-left space-y-3">
    <div className="inline-flex items-center gap-2 bg-blue-50 text-[#0066ff] border border-blue-100 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide">
      <MessageSquare size={14} />
      PromotInsight Assistant
    </div>
    <div className="space-y-2">
      {AUTO_REPLY_MESSAGES.map((message, index) => (
        <div key={index} className="bg-white border border-blue-100 shadow-sm rounded-2xl rounded-tl-none p-3 text-sm text-gray-700 font-semibold leading-relaxed">
          {message}
        </div>
      ))}
    </div>
  </div>
);

export default function LiveChatModal({ isOpen, onClose, onOpen }) {
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [chatStatus, setChatStatus] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // 🔴 Unread count state
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setUnreadCount(0); // মডাল ওপেন করলে আনরিড মেসেজ জিরো হয়ে যাবে
  }, [isOpen]);

  const isVerified = user && (user.verification_status?.toLowerCase() === 'approved' || user.verification_status?.toLowerCase() === 'verified');

  const getHeaders = () => ({
    withCredentials: true,
  });

  const triggerAlert = useCallback(() => {
    setUnreadCount(prev => prev + 1); // ðŸ”´ à¦®à§‡à¦¸à§‡à¦œ à¦†à¦¸à¦²à§‡à¦‡ à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à§§ à¦•à¦°à§‡ à¦¬à¦¾à§œà¦¬à§‡
    try {
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play();
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (sid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/private-chat/sessions/${sid}/messages`, getHeaders());
      const fetchedMsgs = res.data.data;
      setMessages(fetchedMsgs);
      
      if (fetchedMsgs.length > 0 && !isOpenRef.current) {
        const lastMsg = fetchedMsgs[fetchedMsgs.length - 1];
        if (String(lastMsg.sender_user_id) !== String(user?.id)) {
          triggerAlert();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [triggerAlert, user?.id]);

  const fetchChatStatus = useCallback(async () => {
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
  }, [fetchMessages]);

  const handlePrivateChatApproved = useCallback((payload) => {
    if (payload?.userId && String(payload.userId) !== String(user?.id)) return;

    if (payload?.session?.id) {
      setSessionId(payload.session.id);
      setChatStatus(payload.session.status || 'active');
      fetchMessages(payload.session.id);
      return;
    }

    fetchChatStatus();
  }, [fetchChatStatus, fetchMessages, user?.id]);

  useEffect(() => {
    if (user && isVerified) {
            socket.connect();
      fetchChatStatus();
      
      // 🟢 সকেট পুরোপুরি কানেক্ট হওয়ার পর অনলাইন সিগন্যাল পাঠাবে
      socket.on('connect', () => {
        socket.emit('user_online', user.id);
      });
      
      // যদি আগে থেকেই কানেক্টেড থাকে, তবে সাথে সাথে পাঠাবে
      if (socket.connected) {
        socket.emit('user_online', user.id);
      }
    }
    
    return () => {
      socket.off('connect');
      socket.disconnect();
    };
  }, [user, isVerified, fetchChatStatus]);

  useEffect(() => {
    if (!user || !isVerified) return;

    socket.on('private_chat_approved', handlePrivateChatApproved);

    return () => {
      socket.off('private_chat_approved', handlePrivateChatApproved);
    };
  }, [user, isVerified, handlePrivateChatApproved]);

  useEffect(() => {
    let poll;
    if (chatStatus === 'pending') {
      poll = setInterval(async () => {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/private-chat/me/status`, getHeaders());
          if (res.data.activeSession) {
            setSessionId(res.data.activeSession.id);
            setChatStatus('active');
            fetchMessages(res.data.activeSession.id);
          }
        } catch {}
      }, 3000);
    }
    return () => clearInterval(poll);
  }, [chatStatus, fetchMessages]);

  useEffect(() => {
    if (sessionId) {
      socket.emit('join_chat_room', sessionId);

      const handleReceive = (msg) => {
        setMessages((prev) => [...prev, msg]);
        // যদি মেসেজটি এডমিনের হয় এবং চ্যাট মডাল বন্ধ থাকে
        if (String(msg.sender_user_id) !== String(user?.id) && !isOpenRef.current) {
          triggerAlert();
        }
      };

      const handleClose = () => setChatStatus('ended');

      socket.on('receive_message', handleReceive);
      socket.on('chat_closed_event', handleClose);

      return () => {
        socket.off('receive_message', handleReceive);
        socket.off('chat_closed_event', handleClose);
      };
    }
  }, [sessionId, user, triggerAlert]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatStatus, isOpen]);

  const requestLiveChat = async () => {
    setChatLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/private-chat/request`, {}, getHeaders());
      if (res.data && res.data.success) setChatStatus('pending');
    } catch (error) {
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId || !user) return;

    socket.emit('send_message', {
      sessionId,
      message: newMessage
    });
    setNewMessage('');
  };

  return (
    <>
      {/* 🔵 Facebook Messenger Style ফ্লোটিং নোটিফিকেশন */}
      {unreadCount > 0 && !isOpen && (
        <div 
          onClick={onOpen || (() => window.location.href='/support')} 
          className="fixed bottom-20 right-6 z-[90000] bg-white hover:bg-blue-50 border-2 border-[#0066ff] shadow-2xl rounded-2xl p-4 flex items-center gap-4 animate-bounce cursor-pointer transition-colors"
        >
          <div className="bg-blue-100 p-2 rounded-full relative">
            <MessageSquare className="text-[#0066ff] w-6 h-6" />
            {/* 🔴 লাল ব্যাজ (Unread Count) */}
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {unreadCount}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">New Admin Message!</p>
            <p className="text-xs text-gray-500 font-medium">You have {unreadCount} unread message(s).</p>
          </div>
        </div>
      )}

      {/* রেগুলার চ্যাট মডাল */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden relative">
            
            <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                <MessageSquare className="text-[#0066ff]"/> Live Private Chat
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white shadow-sm border border-gray-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 flex flex-col p-4 sm:p-6">
              
              {user && !isVerified && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <AlertCircle className="text-red-500 w-16 h-16 mb-4" />
                  <h3 className="text-2xl font-bold text-red-800">Verification Required</h3>
                  <p className="text-red-600 mt-2 text-sm">Please verify your profile to enable private chat.</p>
                </div>
              )}

              {user && isVerified && chatStatus === null && (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  <div className="bg-blue-50 p-6 rounded-full mb-6">
                    <MessageSquare className="text-[#0066ff] w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4">Instant Live Support</h3>
                  <div className="max-w-md mx-auto mb-6">
                    <AutoReplyCard />
                  </div>
                  <button onClick={requestLiveChat} disabled={chatLoading} className="bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center gap-3">
                    {chatLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Request Live Chat Now'}
                  </button>
                </div>
              )}

              {user && isVerified && (chatStatus === 'pending' || chatStatus === 'active' || chatStatus === 'ended') && (
                <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="space-y-4">
                        <AutoReplyCard />
                        <p className="text-center text-gray-400 text-sm">
                          {chatStatus === 'pending' ? 'Your live chat request is waiting for admin approval.' : 'Chat started! Say hello.'}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${String(msg.sender_user_id) === String(user.id) ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${String(msg.sender_user_id) === String(user.id) ? 'bg-[#0066ff] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
                            {msg.message}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    {chatStatus === 'ended' ? (
                      <div className="text-center p-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100">
                        Chat closed by Admin.
                      </div>
                    ) : chatStatus === 'pending' ? (
                      <div className="text-center p-3 bg-blue-50 text-[#0066ff] text-sm font-bold rounded-xl border border-blue-100 flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />
                        Admin approval pending. You can start typing after an admin accepts.
                      </div>
                    ) : (
                      <form onSubmit={sendChatMessage} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={newMessage} 
                          onChange={(e) => setNewMessage(e.target.value)} 
                          placeholder="Type a message..." 
                          className="flex-1 p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#0066ff] transition-all text-sm" 
                        />
                        <button 
                          type="submit" 
                          disabled={!newMessage.trim()} 
                          className="bg-[#0066ff] text-white w-12 h-12 flex items-center justify-center shrink-0 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                        >
                          <Send size={20} className="ml-0.5" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
