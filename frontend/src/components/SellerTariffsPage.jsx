import React, { useState, useEffect } from 'react';
import { Settings, Globe, Layers } from 'lucide-react';
import { buildCountriesFromFeeConfigs, parsePlatformChargeTiers } from '../utils/feeConfigHelpers';

const API = 'https://backend-6aiq.onrender.com';

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Settings size={22} className="text-[#0066ff]" />
              Dynamic Tariffs &amp; Fee Configuration
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Admin-configured countries, platforms, and fees. Use the same country and platform when listing products.
            </p>
          </div>
          <div className="min-w-[200px]">
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
          <p className="text-center text-gray-500 py-12 animate-pulse">Loading tariff configuration...</p>
        ) : configs.length === 0 ? (
          <p className="text-center text-amber-600 py-12 font-medium">
            No tariffs configured yet. Please contact admin.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3">Country</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3 text-center">Platform charge tiers</th>
                  <th className="p-3 text-center">Ex. rate</th>
                  <th className="p-3 text-center">Buyer reward</th>
                  <th className="p-3 text-center">Refund fee</th>
                  <th className="p-3 text-center">Deposit fee</th>
                  <th className="p-3 text-center">Withdraw fee</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((conf) => {
                  const tiers = parsePlatformChargeTiers(conf.platform_charge);
                  return (
                    <tr key={`${conf.country}-${conf.platform}`} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-800">{conf.country}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0066ff] px-2 py-1 rounded-lg text-xs font-bold">
                          <Layers size={12} /> {conf.platform}
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs">
                        {tiers.length > 0 ? (
                          <ul className="space-y-1">
                            {tiers.map((t, i) => (
                              <li key={i} className="text-gray-600">
                                ${t.min}–${t.max}: <b className="text-gray-800">${t.fee}</b>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>{conf.platform_charge}%</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-[#0066ff]">{conf.exchange_rate || 1}</td>
                      <td className="p-3 text-center">${conf.buyer_reward}</td>
                      <td className="p-3 text-center">{conf.buyer_refund_fee}%</td>
                      <td className="p-3 text-center">{conf.seller_deposit_fee}%</td>
                      <td className="p-3 text-center">{conf.seller_withdrawal_fee}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && countries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries
            .filter((c) => !filterCountry || c.country === filterCountry)
            .map((c) => (
              <div key={c.country} className="bg-white rounded-xl border shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Globe size={16} className="text-[#0066ff]" />
                  {c.country}
                </h3>
                <p className="text-xs text-gray-500 mb-2">Available platforms:</p>
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
