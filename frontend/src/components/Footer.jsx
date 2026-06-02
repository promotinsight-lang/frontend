import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, X } from 'lucide-react';

const LANGUAGE_STORAGE_KEY = 'language';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
];

function getStoredLanguage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return LANGUAGES.find((l) => l.code === stored) ?? LANGUAGES[0];
}

export default function Footer() {
  const [languageOpen, setLanguageOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(getStoredLanguage);
  const languageMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target)
      ) {
        setLanguageOpen(false);
      }
    };

    if (languageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [languageOpen]);

  useEffect(() => {
    if (!securityOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setSecurityOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [securityOpen]);

  const handleLanguageSelect = (lang) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang.code);
    setSelectedLanguage(lang);
    setLanguageOpen(false);
  };

  return (
    <>
      <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-gray-800 pb-8 mb-8">
          <div>
            <div className="text-white font-black text-2xl tracking-tight mb-2">
              PromotInsight.
            </div>
            <p className="text-sm">
              Connecting global sellers with real buyers for authentic e-commerce
              growth.
            </p>
          </div>
          <div className="flex justify-center gap-6 text-sm font-bold">
            <Link
              to="/terms"
              className="hover:text-white transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              to="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/support"
              className="hover:text-white transition-colors"
            >
              Support Center
            </Link>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="bg-gray-800 p-3 rounded-xl inline-flex gap-4 relative">
              {/* Language selector */}
              <div className="relative" ref={languageMenuRef}>
                <button
                  type="button"
                  onClick={() => setLanguageOpen((open) => !open)}
                  aria-label="Select language or region"
                  aria-expanded={languageOpen}
                  aria-haspopup="listbox"
                  className="text-gray-400 hover:text-white transition-colors p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Globe size={20} aria-hidden="true" />
                </button>

                {languageOpen && (
                  <ul
                    role="listbox"
                    aria-label="Language options"
                    className="absolute bottom-full right-0 mb-2 w-44 py-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {LANGUAGES.map((lang) => (
                      <li key={lang.code} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedLanguage.code === lang.code}
                          onClick={() => handleLanguageSelect(lang)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-700 focus:outline-none focus-visible:bg-gray-700 ${
                            selectedLanguage.code === lang.code
                              ? 'text-white bg-gray-700/50'
                              : 'text-gray-300'
                          }`}
                        >
                          <span className="text-base leading-none" aria-hidden="true">
                            {lang.flag}
                          </span>
                          <span>{lang.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Security & trust */}
              <button
                type="button"
                onClick={() => setSecurityOpen(true)}
                aria-label="Security and trust information"
                className="text-gray-400 hover:text-white transition-colors p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ShieldCheck size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div className="text-center text-xs font-medium">
          © 2025 PromotInsight. Built by WitchBella. All Rights Reserved.
        </div>
      </footer>

      {/* Security modal */}
      {securityOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="security-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close security dialog"
            onClick={() => setSecurityOpen(false)}
          />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 text-gray-300">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-900/40 rounded-xl">
                  <ShieldCheck
                    size={24}
                    className="text-green-400"
                    aria-hidden="true"
                  />
                </div>
                <h2
                  id="security-modal-title"
                  className="text-lg font-bold text-white"
                >
                  Security &amp; Trust
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSecurityOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Your data is 100% secure. SSL Certified. We use industry-standard
              encryption, secure escrow handling, and strict access controls to
              protect your account and transactions.
            </p>
            <Link
              to="/privacy"
              onClick={() => setSecurityOpen(false)}
              className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus-visible:underline"
            >
              Read our Privacy Policy →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
