import {  useState, useEffect, useMemo  } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CheckCircle, Clock, Globe, Layers, Image as ImageIcon, X } from 'lucide-react';
import {
  buildCountriesFromFeeConfigs,
  mergeVerificationFields,
} from '../utils/feeConfigHelpers';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

const DEFAULT_SHOPPING_PLATFORMS = [
  'Amazon',
  'Walmart',
  'Mercado Libre',
  'Etsy',
  'TikTok',
  'Noon',
  'Shine',
  'Temu',
];

const DEFAULT_PLATFORM_FIELDS = [
  { key: 'account_name', label: 'Store Name', type: 'text', required: true, placeholder: 'Store name on this platform' },
  { key: 'profile_url', label: 'Profile URL', type: 'url', required: false, placeholder: 'Profile URL on this platform' },
  { key: 'verification_image_url', label: 'Profile Screenshot', type: 'image', required: false, placeholder: '' },
];

const Verification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [userStatus, setUserStatus] = useState('unverified');
  const [userRole, setUserRole] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?.role || 'buyer';
    } catch {
      return 'buyer';
    }
  });
  const [formConfig, setFormConfig] = useState({ global_fields: [], countries: [] });

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [customPlatformEnabled, setCustomPlatformEnabled] = useState(false);
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [globalValues, setGlobalValues] = useState({});
  const [platformValues, setPlatformValues] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});

  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/api/users/profile`, {
          credentials: 'include',
        });
        if (res.status === 429) return;
        const data = await res.json();
        if (data.success && data.user) {
          setUserStatus(data.user.verification_status || 'unverified');
          setUserRole(data.user.role || 'buyer');
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
    setCustomPlatformEnabled(false);
    setCustomPlatformName('');
    setPlatformValues({});
  };

  const availablePlatforms = useMemo(() => {
    const configuredPlatforms = countryEntry?.platforms || [];
    const platformMap = new Map();

    for (const platform of configuredPlatforms) {
      if (platform?.platform) platformMap.set(platform.platform, platform);
    }

    for (const platformName of DEFAULT_SHOPPING_PLATFORMS) {
      if (!platformMap.has(platformName)) {
        platformMap.set(platformName, {
          platform: platformName,
          fields: DEFAULT_PLATFORM_FIELDS,
        });
      }
    }

    return Array.from(platformMap.values());
  }, [countryEntry]);

  const syncSelectedPlatforms = (selected) => {
    const uniqueSelected = Array.from(new Set(selected.filter(Boolean)));
    setSelectedPlatforms(uniqueSelected);
    setPlatformValues((prev) => {
      const next = {};
      for (const p of uniqueSelected) {
        if (prev[p]) next[p] = prev[p];
      }
      return next;
    });
  };

  const handlePlatformToggle = (platformName) => {
    syncSelectedPlatforms(
      selectedPlatforms.includes(platformName)
        ? selectedPlatforms.filter((p) => p !== platformName)
        : [...selectedPlatforms, platformName]
    );
  };

  const handleCustomToggle = () => {
    const currentCustom = customPlatformName.trim();
    if (customPlatformEnabled) {
      syncSelectedPlatforms(selectedPlatforms.filter((p) => p !== currentCustom));
      setCustomPlatformEnabled(false);
      return;
    }

    setCustomPlatformEnabled(true);
    if (currentCustom) {
      syncSelectedPlatforms([...selectedPlatforms, currentCustom]);
    }
  };

  const handleCustomPlatformNameChange = (value) => {
    const previousCustom = customPlatformName.trim();
    const nextCustom = value.trim();
    setCustomPlatformName(value);

    if (!customPlatformEnabled) return;

    const withoutPrevious = previousCustom
      ? selectedPlatforms.filter((p) => p !== previousCustom)
      : selectedPlatforms;
    syncSelectedPlatforms(nextCustom ? [...withoutPrevious, nextCustom] : withoutPrevious);
  };

  const getPlatformDefinition = (platformName) =>
    (() => {
      const definition = availablePlatforms.find((p) => p.platform === platformName) || {
        platform: platformName,
        fields: DEFAULT_PLATFORM_FIELDS,
      };
      const fields = definition.fields?.length ? definition.fields : DEFAULT_PLATFORM_FIELDS;
      const hasImageField = fields.some((field) => field.key === 'verification_image_url');
      return {
        ...definition,
        fields: (hasImageField ? fields : [...fields, DEFAULT_PLATFORM_FIELDS[2]]).map((field) => (
          ['profile_url', 'amazon_profile_url', 'verification_image_url'].includes(field.key)
            ? { ...field, required: false }
            : field
        )),
      };
    })();

  const uploadVerificationImage = async (platformName, file) => {
    if (!file) return;
    setUploadingImages((prev) => ({ ...prev, [platformName]: true }));
    try {
      const cloudData = new FormData();
      cloudData.append('file', file);
      cloudData.append('upload_preset', 'promot_insight_preset');

      const res = await fetch('https://api.cloudinary.com/v1_1/dtlkf5smb/image/upload', {
        method: 'POST',
        body: cloudData,
      });
      const data = await res.json();
      if (!res.ok || !data.secure_url) throw new Error('Upload failed');
      setPlatformField(platformName, 'verification_image_url', data.secure_url);
    } catch (error) {
      console.error('Profile screenshot upload error:', error);
      setMessage({ type: 'error', text: 'Profile screenshot upload failed. Please try again.' });
    } finally {
      setUploadingImages((prev) => ({ ...prev, [platformName]: false }));
    }
  };

  const isBuyer = userRole === 'buyer';
  const countryLabel = isBuyer ? 'Select your country' : 'Select your target country';
  const platformLabel = isBuyer ? 'Select your platform(s)' : 'Select your target platform(s)';

  const normalizePlatformField = (field) => {
    if (field.key === 'account_name') {
      return isBuyer
        ? { ...field, label: 'Profile Name', placeholder: 'Profile name on this platform' }
        : { ...field, label: 'Store Name', placeholder: 'Store name on this platform' };
    }
    return field;
  };

  const normalizeGlobalField = (field) => {
    if (field.key === 'whatsapp_account') return { ...field, required: false };
    if (field.key === 'paypal_account') {
      return isBuyer
        ? { ...field, label: 'PayPal Email Address', placeholder: 'yourname@email.com' }
        : { ...field, label: 'Email Address', placeholder: 'yourname@email.com' };
    }
    if (field.key === 'facebook_account') {
      return isBuyer
        ? { ...field, label: 'Facebook ID', type: 'text', placeholder: 'Enter your Facebook ID' }
        : { ...field, label: 'WeChat ID', type: 'text', placeholder: 'Enter your WeChat ID' };
    }
    return field;
  };

  const renderPlatformFieldInput = (platformName, field) => {
    const normalizedField = normalizePlatformField(field);
    const fieldDef = ['profile_url', 'amazon_profile_url', 'verification_image_url'].includes(normalizedField.key)
      ? { ...normalizedField, required: false }
      : normalizedField;
    const displayField = fieldDef.key === 'verification_image_url'
      ? { ...fieldDef, label: 'Profile Screenshot' }
      : fieldDef;
    const value = platformValues[platformName]?.[displayField.key] || '';

    if (displayField.type === 'image' || displayField.key === 'verification_image_url') {
      return (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => uploadVerificationImage(platformName, e.target.files?.[0])}
            className="w-full p-2 border bg-gray-50 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {uploadingImages[platformName] && (
            <p className="text-xs text-blue-600 font-semibold animate-pulse">Uploading profile screenshot...</p>
          )}
          {value && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg p-2">
              <img src={value} alt={`${platformName} verification`} className="w-14 h-14 object-cover rounded border bg-white" />
              <a href={value} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                <ImageIcon size={14} /> View image
              </a>
              <button
                type="button"
                onClick={() => setPlatformField(platformName, displayField.key, '')}
                className="ml-auto text-red-500 hover:text-red-700"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      );
    }

    return renderFieldInput(displayField, value, (v) => setPlatformField(platformName, displayField.key, v));
  };

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
    if (customPlatformEnabled && !customPlatformName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your custom platform name.' });
      return;
    }
    if (selectedPlatforms.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one shopping platform.' });
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(`${API}/api/users/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
                    <Globe size={16} className="text-[#0066ff]" /> {countryLabel}
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
                      <Layers size={16} className="text-[#0066ff]" /> {platformLabel}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availablePlatforms.map((p) => (
                        <label
                          key={p.platform}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold cursor-pointer transition-all ${
                            selectedPlatforms.includes(p.platform)
                              ? 'border-[#0066ff] bg-blue-50 text-[#0066ff]'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(p.platform)}
                            onChange={() => handlePlatformToggle(p.platform)}
                            className="h-4 w-4 accent-[#0066ff]"
                          />
                          <span>{p.platform}</span>
                        </label>
                      ))}
                      <label
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold cursor-pointer transition-all ${
                          customPlatformEnabled
                            ? 'border-[#0066ff] bg-blue-50 text-[#0066ff]'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={customPlatformEnabled}
                          onChange={handleCustomToggle}
                          className="h-4 w-4 accent-[#0066ff]"
                        />
                        <span>Custom Platform</span>
                      </label>
                    </div>
                    {customPlatformEnabled && (
                      <input
                        value={customPlatformName}
                        onChange={(e) => handleCustomPlatformNameChange(e.target.value)}
                        placeholder="Enter platform name"
                        className="mt-3 w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-sm focus:border-[#0066ff] focus:bg-white outline-none transition-all"
                      />
                    )}
                    {selectedPlatforms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedPlatforms.map((platformName) => (
                          <span
                            key={platformName}
                            className="text-xs bg-blue-100 text-[#0066ff] font-bold px-2.5 py-1 rounded-full"
                          >
                            {platformName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formConfig.global_fields.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#0066ff] uppercase tracking-wider border-b border-blue-100 pb-1">
                      Account &amp; contact details
                    </h3>
                    {formConfig.global_fields.map((field) => {
                      const fieldDef = normalizeGlobalField(field);
                      return (
                        <div key={fieldDef.key}>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            {fieldDef.label}
                            {fieldDef.required
                              ? <span className="text-red-500"> *</span>
                              : <span className="ml-1 text-[10px] font-medium text-gray-400">(Optional)</span>}
                          </label>
                          {renderFieldInput(fieldDef, globalValues[fieldDef.key], (v) =>
                            setGlobalField(fieldDef.key, v)
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedPlatforms.map((platformName) => {
                  const platDef = getPlatformDefinition(platformName);
                  if (!platDef?.fields?.length) return null;
                  return (
                    <div key={platformName} className="space-y-3 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-bold text-gray-800">{platformName} details</h3>
                      {platDef.fields.map((field) => (
                        (() => {
                          const isOptional = !field.required || ['profile_url', 'amazon_profile_url', 'verification_image_url'].includes(field.key);
                          const label = field.key === 'verification_image_url'
                            ? 'Profile Screenshot'
                            : normalizePlatformField(field).label;
                          return (
                            <div key={`${platformName}-${field.key}`}>
                              <label className="block text-xs font-bold text-gray-600 mb-1">
                                {label}
                                {isOptional
                                  ? <span className="ml-1 text-[10px] font-medium text-gray-400">(Optional)</span>
                                  : <span className="text-red-500"> *</span>}
                              </label>
                              {renderPlatformFieldInput(platformName, field)}
                            </div>
                          );
                        })()
                      ))}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={submitLoading || (selectedPlatforms.length === 0 && !customPlatformEnabled)}
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
