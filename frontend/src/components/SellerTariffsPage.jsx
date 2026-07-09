import {  useState, useEffect  } from 'react';
import { Settings, Globe, Layers } from 'lucide-react';
import { buildCountriesFromFeeConfigs, parsePlatformChargeTiers } from '../utils/feeConfigHelpers';
import { ResponsiveTableShell, AdminMobileCard, AdminField } from './admin/AdminMobileUi';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

export default function SellerTariffsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/config/fees/all`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setConfigs(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const countries = buildCountriesFromFeeConfigs(configs);
  const filtered = filterCountry
    ? configs.filter((c) => c.country === filterCountry)
    : configs;

  const renderTiers = (conf) => {
    const tiers = parsePlatformChargeTiers(conf.platform_charge);
    if (tiers.length > 0) {
      return (
        <ul className="space-y-1 text-xs">
          {tiers.map((t, i) => (
            <li key={i} className="text-gray-600">
              ${t.min}–${t.max}: <b className="text-gray-800">${t.fee}</b>
            </li>
          ))}
        </ul>
      );
    }
    return <span>{conf.platform_charge}%</span>;
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in px-0">
      <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-6">
        <div className="flex flex-col gap-4 mb-4 border-b pb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              <Settings size={22} className="text-[#0066ff] shrink-0" />
              Dynamic Tariffs &amp; Fees
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Admin-configured countries, platforms, and fees. Match these when listing products.
            </p>
          </div>
          <div className="w-full">
            <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
              <Globe size={14} /> Filter by country
            </label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm font-medium bg-gray-50 focus:border-[#0066ff] outline-none"
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12 animate-pulse text-sm">Loading...</p>
        ) : configs.length === 0 ? (
          <p className="text-center text-amber-600 py-12 font-medium text-sm">
            No tariffs configured yet. Please contact admin.
          </p>
        ) : (
          <ResponsiveTableShell
            empty={filtered.length === 0}
            emptyMessage="No configurations for this country."
            mobile={filtered.map((conf) => {
              const tiers = parsePlatformChargeTiers(conf.platform_charge);
              return (
                <AdminMobileCard
                  key={`${conf.country}-${conf.platform}`}
                  title={`${conf.country} — ${conf.platform}`}
                  subtitle={
                    <span className="inline-flex items-center gap-1 text-[#0066ff]">
                      <Layers size={12} /> {conf.platform}
                    </span>
                  }
                >
                  <AdminField label="Platform charge">
                    {tiers.length > 0
                      ? tiers.map((t, i) => (
                          <div key={i} className="text-xs">
                            ${t.min}–${t.max}: ${t.fee}
                          </div>
                        ))
                      : `${conf.platform_charge}%`}
                  </AdminField>
                  <AdminField label="Ex. rate">
                    <span className="text-[#0066ff] font-bold">{conf.exchange_rate || 1}</span>
                  </AdminField>
                  <AdminField label="Buyer reward">${conf.buyer_reward}</AdminField>
                  <AdminField label="Refund fee">{conf.buyer_refund_fee}%</AdminField>
                  <AdminField label="Deposit fee">{conf.seller_deposit_fee}%</AdminField>
                  <AdminField label="Withdraw fee">{conf.seller_withdrawal_fee}%</AdminField>
                </AdminMobileCard>
              );
            })}
          >
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3">Country</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3 text-center">Platform charge</th>
                  <th className="p-3 text-center">Ex. rate</th>
                  <th className="p-3 text-center">Reward</th>
                  <th className="p-3 text-center">Refund</th>
                  <th className="p-3 text-center">Deposit</th>
                  <th className="p-3 text-center">Withdraw</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((conf) => (
                  <tr key={`${conf.country}-${conf.platform}`} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-800">{conf.country}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0066ff] px-2 py-1 rounded-lg text-xs font-bold">
                        <Layers size={12} /> {conf.platform}
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs">{renderTiers(conf)}</td>
                    <td className="p-3 text-center font-bold text-[#0066ff]">{conf.exchange_rate || 1}</td>
                    <td className="p-3 text-center">${conf.buyer_reward}</td>
                    <td className="p-3 text-center">{conf.buyer_refund_fee}%</td>
                    <td className="p-3 text-center">{conf.seller_deposit_fee}%</td>
                    <td className="p-3 text-center">{conf.seller_withdrawal_fee}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableShell>
        )}
      </div>

      {!loading && countries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {countries
            .filter((c) => !filterCountry || c.country === filterCountry)
            .map((c) => (
              <div key={c.country} className="bg-white rounded-xl border shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Globe size={16} className="text-[#0066ff] shrink-0" />
                  {c.country}
                </h3>
                <p className="text-xs text-gray-500 mb-2">Platforms:</p>
                <div className="flex flex-wrap gap-2">
                  {c.platforms.map((p) => (
                    <span
                      key={p.platform}
                      className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                    >
                      {p.platform}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
