import React from 'react';
import Navbar from '../components/Navbar';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-black text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <p>At MarketInsight, your privacy and data security are our top priorities. This Privacy Policy explains how we collect, use, and protect your information when you interact with our platform.</p>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">1. Information We Collect</h2>
              <p>When you register as a buyer or seller, we collect essential data such as your name, email address, and financial routing details for wallet withdrawals. To maintain the integrity of our review ecosystem, we verify platform identities strictly through authentic profile links rather than uploaded screenshots.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">2. How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To authenticate your identity via secure session validation (JWT).</li>
                <li>To process wallet deposits, hold escrow funds, and execute withdrawals.</li>
                <li>To mediate disputes between buyers and sellers securely using our admin tools.</li>
                <li>To send important email notifications, such as password resets and order updates.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">3. Data Security Measures</h2>
              <p>We employ enterprise-grade security protocols. Passwords are cryptographically hashed, and sensitive backend routes are secured with strict role-based access control. Our environment incorporates defenses against artificial network manipulation and latency-based vulnerabilities.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">4. Information Sharing</h2>
              <p>We do not sell your personal data. Limited information, such as masked emails or basic profile links, may be shared between a matched buyer and seller solely for the purpose of verifying a transaction.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}