import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Headset, Wallet, ShoppingBag } from 'lucide-react';

const BottomNavbar = () => {
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  if (!user || user.role !== 'buyer') return null;

  const params = new URLSearchParams(location.search);
  const tab = params.get('tab');
  const onDashboard = location.pathname === '/dashboard';
  const utilityTabs = ['wallet', 'support', 'announcements'];
  const isOrders =
    onDashboard && (!tab || !utilityTabs.includes(tab));
  const isWallet = onDashboard && tab === 'wallet';
  const isSupport = onDashboard && tab === 'support';

  const linkClass = (active) =>
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
      active ? 'text-[#0066ff]' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        <Link to="/" className={linkClass(location.pathname === '/')}>
          <Home size={location.pathname === '/' ? 24 : 22} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        <Link to="/dashboard?tab=active" className={linkClass(isOrders)}>
          <ClipboardList size={isOrders ? 24 : 22} />
          <span className="text-[10px] font-bold">Orders</span>
        </Link>

        <Link to="/marketplace" className={linkClass(location.pathname === '/marketplace')}>
          <ShoppingBag size={location.pathname === '/marketplace' ? 24 : 22} />
          <span className="text-[10px] font-bold">Shop</span>
        </Link>

        <Link to="/dashboard?tab=wallet" className={linkClass(isWallet)}>
          <Wallet size={isWallet ? 24 : 22} />
          <span className="text-[10px] font-bold">Wallet</span>
        </Link>

        <Link to="/dashboard?tab=support" className={linkClass(isSupport)}>
          <Headset size={isSupport ? 24 : 22} />
          <span className="text-[10px] font-bold">Support</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavbar;
