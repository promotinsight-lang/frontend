import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Target, ShieldCheck, Zap, Globe, Heart } from 'lucide-react';

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: <Users className="text-[#0066ff]" size={32} />,
      title: 'Community First',
      description: 'We prioritize our community of buyers and sellers, ensuring a mutually beneficial ecosystem for everyone involved.'
    },
    {
      icon: <Target className="text-emerald-500" size={32} />,
      title: 'Goal Oriented',
      description: 'Our platform is designed to help sellers achieve their ranking goals while buyers get access to premium products.'
    },
    {
      icon: <ShieldCheck className="text-blue-500" size={32} />,
      title: 'Secure & Trusted',
      description: 'Security and trust are at the core of PromotInsight. We ensure safe transactions and verified engagements.'
    },
    {
      icon: <Zap className="text-yellow-500" size={32} />,
      title: 'Fast & Efficient',
      description: 'We continuously optimize our platform to provide the fastest and most efficient campaign management experience.'
    },
    {
      icon: <Globe className="text-purple-500" size={32} />,
      title: 'Global Reach',
      description: 'Connect with a global audience. Our platform supports multiple countries and leading e-commerce platforms.'
    },
    {
      icon: <Heart className="text-pink-500" size={32} />,
      title: 'Customer Satisfaction',
      description: 'We are dedicated to providing excellent support and ensuring the highest level of customer satisfaction.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col selection:bg-blue-200 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0066ff] to-indigo-900 pt-24 pb-32 px-4 overflow-hidden mt-16 md:mt-20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/30 border border-blue-400/30 text-white px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-6 backdrop-blur-md">
            Our Story
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            Empowering E-commerce <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
              Growth & Success
            </span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium opacity-90 leading-relaxed">
            PromotInsight bridges the gap between ambitious sellers and enthusiastic buyers. We provide a secure, efficient, and transparent platform to boost product visibility and drive real growth.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative z-20 -mt-16 max-w-6xl mx-auto px-4 w-full mb-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-10 lg:p-14 bg-white">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Target size={28} className="text-[#0066ff]" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed text-lg font-medium">
              To revolutionize the way e-commerce sellers rank their products by connecting them with a network of trusted buyers, ensuring high-quality engagements and sustainable growth across global marketplaces.
            </p>
          </div>
          <div className="w-full md:w-1/2 p-10 lg:p-14 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed text-lg font-medium">
              To become the world's most trusted and reliable product promotion and engagement ecosystem, fostering a transparent environment where genuine feedback drives market success.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-6xl mx-auto px-4 w-full mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Our Core Values</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium">
            The principles that guide our decisions, our culture, and our commitment to you.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((val, index) => (
            <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
                {val.icon}
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">{val.title}</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                {val.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
