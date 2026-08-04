import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, MapPin, Phone, Send, CheckCircle, Clock } from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col selection:bg-blue-200 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 to-slate-800 pt-24 pb-32 px-4 overflow-hidden mt-16 md:mt-20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-6 backdrop-blur-md">
            Get in Touch
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            We're Here to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Help</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-medium opacity-90 leading-relaxed">
            Have questions about PromotInsight? Whether you're a buyer, seller, or just curious, our team is ready to answer all your questions.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="relative z-20 -mt-16 max-w-6xl mx-auto px-4 w-full mb-24">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Contact Info Sidebar */}
          <div className="w-full lg:w-2/5 p-10 lg:p-14 bg-gradient-to-b from-[#0066ff] to-blue-800 text-white">
            <h2 className="text-3xl font-black mb-2 tracking-tight">Contact Information</h2>
            <p className="text-blue-100 font-medium mb-12 opacity-90">Fill up the form and our team will get back to you within 24 hours.</p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                  <Phone size={24} className="text-blue-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-bold text-lg">+1 (555) 123-4567</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                  <Mail size={24} className="text-blue-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-bold text-lg">support@promotinsight.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                  <MapPin size={24} className="text-blue-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Office Location</p>
                  <p className="font-bold text-lg leading-snug">123 E-commerce Blvd,<br/>Tech District, NY 10001<br/>United States</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                  <Clock size={24} className="text-blue-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Working Hours</p>
                  <p className="font-bold text-lg leading-snug">Mon - Fri: 9:00 AM - 6:00 PM<br/>Sat - Sun: Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full lg:w-3/5 p-10 lg:p-14 bg-white relative">
            {isSuccess && (
              <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white p-4 font-bold flex justify-center items-center gap-2 animate-fade-in-down z-10 shadow-md">
                <CheckCircle size={20} /> Message sent successfully! We'll get back to you soon.
              </div>
            )}
            
            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help you?"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Tell us more about your inquiry..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all resize-none" 
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#0066ff] text-white py-4 px-8 rounded-xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>Send Message <Send size={20} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
