import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Mail, MessageSquare, Send } from 'lucide-react';

export default function Support() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ekhane backend a form submit er logic hobe (e.g. Nodemailer endpoint)
    console.log('Support Request:', formData);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-12">
          
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
                  <p className="font-bold">support@PromotInsight.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl text-purple-900">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <MessageSquare size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-900/60">Live Dispute Resolution</p>
                  <p className="font-bold">Available in Dashboard</p>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all"
                    placeholder="John Doe"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all"
                    placeholder="john@example.com"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">How can we help?</label>
                  <textarea 
                    required
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all resize-none"
                    placeholder="Describe your issue..."
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}