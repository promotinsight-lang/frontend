import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Lock, Eye, Plus, MessageCircle, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import { formatProductMoney } from '../utils/currency';
import { openFacebookGroupContact } from '../utils/facebookGroupContact';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let parsedUser = null;
    if (storedUser) {
      parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.is_active === false || parsedUser.is_active === "false" || parsedUser.is_active === 0) {
        setIsAccountDisabled(true);
      }
    } else {
      navigate('/login');
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/products/${id}`, {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          setProduct(data.data);
        } else {
          setError(data.message || "Product not found");
        }
      } catch {
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    
    // If buyer, fetch applications to see if they already applied
    const fetchMyApplications = async () => {
      if (parsedUser?.role !== 'buyer') return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/my`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const existingApp = (data.data || []).find(app => String(app.product_id) === String(id));
          if (existingApp) {
            setApplicationStatus(existingApp.status);
            setCurrentApplication(existingApp);
          }
        }
      } catch (error) {
        console.error("Error fetching buyer applications:", error);
      }
    };
    fetchMyApplications();
  }, [id, navigate]);

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      alert("Only buyers can order products.");
      return;
    }
    if (isAccountDisabled) {
      alert("Your account is restricted.");
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: product.id })
      });

      if (res.status === 429) {
        alert("Too many requests. Please wait 15 minutes.");
        return;
      }

      const result = await res.json();
      if (res.ok) {
        const nextApplication = result.application || {};
        setApplicationStatus(nextApplication.status || 'approved');
        setCurrentApplication(nextApplication);
        alert("Order request saved. Use the Facebook group button to contact directly.");
      } else {
        alert(result.message || "Failed to apply");
      }
    } catch {
      alert("Error applying for product. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleFacebookContact = async () => {
    try {
      const copied = await openFacebookGroupContact({ product, application: currentApplication });
      alert(copied
        ? 'Order request text copied. Paste it in the Facebook group.'
        : 'Facebook group opened. Please copy your order request details manually.'
      );
    } catch {
      alert('Could not copy the request text, but the Facebook group will open.');
      window.open(import.meta.env.VITE_FACEBOOK_GROUP_URL || 'https://www.facebook.com/promotinsight', '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] font-sans text-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center font-bold text-gray-400 animate-pulse text-lg">Loading Details...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f9fafb] font-sans text-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm text-center max-w-md w-full">
            <ShieldAlert size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link to="/marketplace" className="inline-flex items-center gap-2 bg-[#10b981] text-white px-6 py-2 rounded-full font-bold hover:bg-[#059669] transition-colors">
              <ArrowLeft size={18} /> Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const targetQty = parseInt(product.required_orders) || 0;
  const appliedQty = parseInt(product.application_count) || 0;
  const availableQty = Math.max(0, targetQty - appliedQty);
  const isSoldOut = (targetQty > 0 && availableQty === 0) || product.status === 'stopped';
  const priceDisplay = formatProductMoney(product.price, product.country);
  const statusLabel = isSoldOut ? 'Closed' : `${availableQty} left`;
  const isVerified = user && user.verification_status === 'approved';

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans text-gray-900 flex flex-col">
      <Navbar />

      <main className="max-w-[1000px] mx-auto px-4 py-8 md:py-12 flex-1 w-full animate-fade-in-up">
        {/* Back and Share Bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-500 hover:text-[#10b981] font-semibold transition-colors">
            <ArrowLeft size={20} /> Back
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          
          {/* Image Section */}
          <div className="w-full md:w-1/2 relative bg-[#f7f7f7] min-h-[300px] md:min-h-[400px] flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt="Product"
                className={`absolute inset-0 w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-80' : ''}`}
              />
            ) : (
              <span className="text-gray-400 font-bold">No Image Available</span>
            )}
            <div className="absolute top-4 left-4 z-10">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md ${isSoldOut ? 'bg-gray-400' : 'bg-[#10b981]'}`}>
                {statusLabel}
              </span>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex rounded-full bg-black/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                {product.category || 'General'}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                Platform: {product.platform}
              </span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                Country: {product.country}
              </span>
            </div>

            <h1 className={`text-2xl md:text-3xl font-black leading-tight mb-4 ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>
              {product.product_name}
            </h1>

            <div className="mb-8 pb-6 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Price</p>
                <p className={`text-3xl font-black ${isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>
                  {priceDisplay.formatted}
                </p>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Instructions</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                {product.instructions || "No specific instructions provided for this product."}
              </p>
            </div>

            <div className="mt-auto pt-6">
              {isAccountDisabled ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 text-sm font-bold">
                  <ShieldAlert size={20} /> Your account is disabled.
                </div>
              ) : !user ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm">
                    <strong>Want this offer?</strong> Log in or sign up to claim it.
                  </div>
                  <button onClick={() => navigate('/login')} className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-4 rounded-full font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2">
                    Log in to Order
                  </button>
                </div>
              ) : !isVerified ? (
                <div className="bg-gray-50 text-gray-500 p-4 rounded-xl border border-gray-200 flex items-center gap-3 text-sm font-bold">
                  <Lock size={20} /> Verify your account to claim products.
                </div>
              ) : user.role === 'seller' ? (
                <div className="bg-gray-50 text-gray-500 p-4 rounded-xl border border-gray-200 text-sm font-bold text-center">
                  You are logged in as a Seller. Only Buyers can order products.
                </div>
              ) : isSoldOut ? (
                <button disabled className="w-full bg-gray-200 text-gray-500 py-4 rounded-full font-bold text-lg cursor-not-allowed">
                  Campaign Closed
                </button>
              ) : applicationStatus ? (
                <div className="space-y-3">
                  <button onClick={handleFacebookContact} className="w-full bg-[#1877f2] text-white hover:bg-[#0f5fc9] py-4 rounded-full font-bold text-lg transition-all flex justify-center items-center gap-2">
                    <MessageCircle size={20} /> Contact in Facebook Group <ExternalLink size={18} />
                  </button>
                  <button onClick={() => navigate('/dashboard?tab=active')} className="w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 py-4 rounded-full font-bold text-lg transition-all flex justify-center items-center gap-2">
                    <Eye size={20} /> View Your Order
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleApply} 
                  disabled={isApplying}
                  className={`w-full ${isApplying ? 'bg-emerald-400' : 'bg-[#10b981] hover:bg-[#059669]'} text-white py-4 rounded-full font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2`}
                >
                  <Plus size={20} /> {isApplying ? 'Applying...' : 'Order Now'}
                </button>
              )}
            </div>

          </div>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
