import { useState, useEffect, useCallback } from 'react';
import {
  buildCountryRateMap,
  formatProductMoney,
  formatWalletMoney,
  getCurrencyForCountry,
  getRateForCountry,
} from '../utils/currency';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`;
let cachedRates = null;
let cachePromise = null;

async function fetchCountryRates(token) {
  if (cachedRates) return cachedRates;
  if (cachePromise) return cachePromise;

  cachePromise = fetch(`${API_BASE}/config/fees/all`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((res) => res.json())
    .then((data) => {
      cachedRates = data.success && data.data ? buildCountryRateMap(data.data) : {};
      return cachedRates;
    })
    .catch(() => {
      cachedRates = {};
      return cachedRates;
    })
    .finally(() => {
      cachePromise = null;
    });

  return cachePromise;
}

export function useBuyerCurrency() {
  const [buyerCountry, setBuyerCountry] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [rateByCountry, setRateByCountry] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;

      if (!user || user.role !== 'buyer') {
        if (!cancelled) setReady(true);
        return;
      }

      let country =
        user.amazon_location || user.country || user.amazon_country || '';

      try {
        const token = localStorage.getItem('token');
        const [rates, profileRes] = await Promise.all([
          fetchCountryRates(token),
          token
            ? fetch(`${API_BASE}/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
              }).then((r) => r.json())
            : Promise.resolve(null),
        ]);

        if (profileRes?.success && profileRes.user) {
          country =
            profileRes.user.amazon_location ||
            profileRes.user.country ||
            country;
        }

        if (cancelled) return;

        setRateByCountry(rates);
        setBuyerCountry(country);
        setExchangeRate(getRateForCountry(rates, country));
      } catch {
        if (!cancelled) {
          setBuyerCountry(country);
          setExchangeRate(1);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatWallet = useCallback(
    (usdAmount) => formatWalletMoney(usdAmount, buyerCountry, exchangeRate),
    [buyerCountry, exchangeRate]
  );

  const formatProduct = useCallback((amount, productCountry) => {
    const targetCountry = productCountry || buyerCountry;
    const rate = getRateForCountry(rateByCountry, targetCountry);
    return formatProductMoney(amount, targetCountry, rate);
  }, [buyerCountry, rateByCountry]);

  const currency = getCurrencyForCountry(buyerCountry);

  return {
    ready,
    buyerCountry,
    exchangeRate,
    rateByCountry,
    currency,
    formatWallet,
    formatProduct,
  };
}
