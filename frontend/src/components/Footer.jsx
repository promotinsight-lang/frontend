import {  useState, useEffect, useRef  } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Footer() {
  const { language, setLanguage, t, languages } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
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

  const handleLanguageSelect = (code) => {
    setLanguage(code);
    setLanguageOpen(false);
  };

  const socialLinks = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/promotinsight',
      shortLabel: 'f',
      className: 'bg-[#1877f2] text-white shadow-blue-500/25 hover:bg-[#0f6ee9]',
    },
    {
      label: 'Instagram',
      href: 'https://instagram.com/promotinsight',
      shortLabel: 'ig',
      className: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-pink-500/25 hover:brightness-110',
    },
  ];

  return (
    <>
      <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-gray-800 pb-8 mb-8">
          <div>
            <div className="text-white font-black text-2xl tracking-tight mb-2">
              PromotInsight.
            </div>
            <p className="text-sm">{t('footer_tagline')}</p>
          </div>
          <div className="flex justify-center gap-6 text-sm font-bold">
            <Link
              to="/terms"
              className="hover:text-white transition-colors"
            >
              {t('terms')}
            </Link>
            <Link
              to="/privacy"
              className="hover:text-white transition-colors"
            >
              {t('privacy')}
            </Link>
            <Link
              to="/about"
              className="hover:text-white transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="hover:text-white transition-colors"
            >
              Contact Us
            </Link>
            <Link
              to="/support"
              className="hover:text-white transition-colors"
            >
              {t('support')}
            </Link>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="bg-gray-800/80 p-2.5 rounded-xl inline-flex gap-2.5 relative border border-gray-700/60 shadow-lg">
              {socialLinks.map(({ label, href, shortLabel, className }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={`w-8 h-8 inline-flex items-center justify-center text-[11px] font-black uppercase rounded-lg shadow-md transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${className}`}
                >
                  {shortLabel}
                </a>
              ))}

              <div className="relative" ref={languageMenuRef}>
                <button
                  type="button"
                  onClick={() => setLanguageOpen((open) => !open)}
                  aria-label={t('select_language')}
                  aria-expanded={languageOpen}
                  aria-haspopup="listbox"
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-sky-500 text-white shadow-md shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Globe size={18} aria-hidden="true" />
                </button>

                {languageOpen && (
                  <ul
                    role="listbox"
                    aria-label={t('language_options')}
                    className="absolute bottom-full right-0 mb-2 w-44 py-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <li key={lang.code} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={language === lang.code}
                          onClick={() => handleLanguageSelect(lang.code)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-700 focus:outline-none focus-visible:bg-gray-700 ${
                            language === lang.code
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

              <button
                type="button"
                onClick={() => setSecurityOpen(true)}
                aria-label={t('security_trust')}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ShieldCheck size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div className="text-center text-xs font-medium">{t('copyright')}</div>
      </footer>

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
            aria-label={t('close_security')}
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
                  {t('security_title')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSecurityOpen(false)}
                aria-label={t('close')}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm leading-relaxed mb-4">{t('security_body')}</p>
            <Link
              to="/privacy"
              onClick={() => setSecurityOpen(false)}
              className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus-visible:underline"
            >
              {t('read_privacy')}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
