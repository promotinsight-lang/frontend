import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CheckCircle, Clock, Globe, Layers } from 'lucide-react';
import {
  buildCountriesFromFeeConfigs,
  mergeVerificationFields,
} from '../utils/feeConfigHelpers';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

const Verification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [userStatus, setUserStatus] = useState('unverified');
  const [formConfig, setFormConfig] = useState({ global_fields: [], countries: [] });

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [globalValues, setGlobalValues] = useState({});
  const [platformValues, setPlatformValues] = useState({});

  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (res.status === 429) return;
        const data = await res.json();
        if (data.success && data.user) {
          setUserStatus(data.user.verification_status || 'unverified');
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [feesRes, verRes] = await Promise.all([
          fetch(`${API}/api/config/fees/all`),
          fetch(`${API}/api/config/verification`),
        ]);
        const feesData = await feesRes.json();
        const verData = await verRes.json();

        const fromFees = feesData.success
          ? buildCountriesFromFeeConfigs(feesData.data)
          : [];

        const mergedCountries =
          verData.success && verData.data?.countries
            ? mergeVerificationFields(fromFees, verData.data.countries)
            : fromFees;

        setFormConfig({
          global_fields: verData.success ? verData.data.global_fields || [] : [],
          countries: mergedCountries,
        });

        if (mergedCountries.length === 1) {
          setSelectedCountry(mergedCountries[0].country);
        }
      } catch (err) {
        console.error('Config fetch error:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const countryEntry = useMemo(
    () => formConfig.countries.find((c) => c.country === selectedCountry),
    [formConfig.countries, selectedCountry]
  );

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedPlatforms([]);
    setPlatformValues({});
  };

  const handlePlatformSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSelectedPlatforms(selected);
    setPlatformValues((prev) => {
      const next = {};
      for (const p of selected) {
        if (prev[p]) next[p] = prev[p];
      }
      return next;
    });
  };

  const availablePlatforms = countryEntry?.platforms || [];

  const setGlobalField = (key, value) => {
    setGlobalValues((prev) => ({ ...prev, [key]: value }));
  };

  const setPlatformField = (platform, key, value) => {
    setPlatformValues((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] || {}), [key]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!selectedCountry) {
      setMessage({ type: 'error', text: 'Please select your country.' });
      return;
    }
    if (selectedPlatforms.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one shopping platform.' });
      return;
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/users/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          country: selectedCountry,
          platforms: selectedPlatforms,
          global: globalValues,
          platform_responses: platformValues,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUserStatus('pending');
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem(
          'user',
          JSON.stringify({ ...storedUser, verification_status: 'pending' })
        );
        setMessage({
          type: 'success',
          text: 'Verification submitted successfully! Waiting for admin approval.',
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Submission failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderFieldInput = (field, value, onChange) => {
    const inputType =
      field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'tel' ? 'tel' : 'text';
    return (
      <input
        required={!!field.required}
        name={field.key}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        type={inputType}
        placeholder={field.placeholder || field.label}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all"
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 flex flex-col">
      <Navbar />

      <div className="bg-[#0066ff] px-4 py-4 sticky top-14 z-30 shadow-md">
        <h1 className="text-xl font-bold text-white text-center">Account Verification</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${userStatus === 'unverified' ? 'bg-[#0066ff] border-[#0066ff] text-white shadow-lg' : 'bg-green-500 border-green-500 text-white'}`}
              >
                1
              </div>
              <span className="text-xs font-bold text-gray-600">To Submit</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${userStatus === 'pending' ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg' : userStatus === 'approved' ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
              >
                2
              </div>
              <span className="text-xs font-bold text-gray-600">Under Review</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${userStatus === 'approved' ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
              >
                3
              </div>
              <span className="text-xs font-bold text-gray-600">Approved</span>
            </div>
          </div>
        </div>

        {userStatus === 'pending' ? (
          <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-50">
              <Clock size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Pending</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your details have been submitted. Please wait while our admin reviews your application.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-full transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : userStatus === 'approved' ? (
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Account Verified</h2>
            <p className="text-gray-500 text-sm mb-6">
              Congratulations! You are now a verified user and can apply for premium products.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#0066ff] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in-up">
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Submit Your Details</h2>
              <p className="text-xs text-gray-500">
                Countries and platforms are loaded from admin Dynamic Tariffs setup. Select yours, then complete verification.
              </p>
            </div>

            {message.text && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-100 text-green-600 border border-green-200'}`}
              >
                {message.text}
              </div>
            )}

            {configLoading ? (
              <p className="text-sm text-gray-500 text-center py-8">Loading form configuration...</p>
            ) : formConfig.countries.length === 0 ? (
              <p className="text-sm text-amber-600 text-center py-8 font-medium">
                Verification is not configured yet. Please ask admin to set up countries and platforms in Settings.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Globe size={16} className="text-[#0066ff]" /> Select your country
                  </label>
                  <select
                    required
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-sm font-medium focus:border-[#0066ff] focus:bg-white outline-none"
                  >
                    <option value="">— Choose country —</option>
                    {formConfig.countries.map((c) => (
                      <option key={c.country} value={c.country}>
                        {c.country}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCountry && countryEntry && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      <Layers size={16} className="text-[#0066ff]" /> Select your shopping platform(s)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Hold Ctrl (Windows) or Cmd (Mac) to select multiple platforms.
                    </p>
                    <select
                      multiple
                      required={selectedPlatforms.length === 0}
                      value={selectedPlatforms}
                      onChange={handlePlatformSelect}
                      size={Math.min(Math.max(availablePlatforms.length, 2), 6)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-medium focus:border-[#0066ff] focus:bg-white outline-none"
                    >
                      {availablePlatforms.map((p) => (
                        <option key={p.platform} value={p.platform}>
                          {p.platform}
                        </option>
                      ))}
                    </select>
                    {selectedPlatforms.length > 0 && (
                      <p className="text-xs text-[#0066ff] font-bold mt-2">
                        Selected: {selectedPlatforms.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {formConfig.global_fields.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#0066ff] uppercase tracking-wider border-b border-blue-100 pb-1">
                      Account &amp; contact details
                    </h3>
                    {formConfig.global_fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500"> *</span>}
                        </label>
                        {renderFieldInput(field, globalValues[field.key], (v) =>
                          setGlobalField(field.key, v)
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedPlatforms.map((platformName) => {
                  const platDef = countryEntry?.platforms.find((p) => p.platform === platformName);
                  if (!platDef?.fields?.length) return null;
                  return (
                    <div key={platformName} className="space-y-3 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-bold text-gray-800">{platformName} details</h3>
                      {platDef.fields.map((field) => (
                        <div key={`${platformName}-${field.key}`}>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500"> *</span>}
                          </label>
                          {renderFieldInput(
                            field,
                            platformValues[platformName]?.[field.key],
                            (v) => setPlatformField(platformName, field.key, v)
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={submitLoading || selectedPlatforms.length === 0}
                  className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#0066ff] to-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50"
                >
                  {submitLoading ? 'Submitting...' : 'Submit Verification'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `,
        }}
      />
    </div>
  );
};

export default Verification;
