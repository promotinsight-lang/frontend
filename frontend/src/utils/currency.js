/** Country name (as stored in DB/config) → display currency */
export const COUNTRY_CURRENCIES = {
  USA: { symbol: '$', code: 'USD' },
  UK: { symbol: '£', code: 'GBP' },
  Canada: { symbol: 'C$', code: 'CAD' },
  Mexico: { symbol: 'MX$', code: 'MXN' },
  Germany: { symbol: '€', code: 'EUR' },
  France: { symbol: '€', code: 'EUR' },
  Italy: { symbol: '€', code: 'EUR' },
  Spain: { symbol: '€', code: 'EUR' },
  Netherlands: { symbol: '€', code: 'EUR' },
  Brazil: { symbol: 'R$', code: 'BRL' },
  Russia: { symbol: '₽', code: 'RUB' },
  UAE: { symbol: 'AED', code: 'AED' },
  'Saudi Arabia': { symbol: 'SAR', code: 'SAR' },
  Poland: { symbol: 'zł', code: 'PLN' },
  Bangladesh: { symbol: '৳', code: 'BDT' },
  India: { symbol: '₹', code: 'INR' },
  Japan: { symbol: '¥', code: 'JPY' },
  Australia: { symbol: 'A$', code: 'AUD' },
  Pakistan: { symbol: 'Rs', code: 'PKR' },
  Singapore: { symbol: 'د.إ', code: 'SGD' } 
};

export function normalizeCountry(country) {
  return (country || '').trim();
}

export function findCountryKey(country) {
  const normalized = normalizeCountry(country).toLowerCase();
  if (!normalized) return null;
  return (
    Object.keys(COUNTRY_CURRENCIES).find(
      (key) => key.toLowerCase() === normalized
    ) || null
  );
}

export function getCurrencyForCountry(country) {
  const key = findCountryKey(country);
  return key ? COUNTRY_CURRENCIES[key] : { symbol: '$', code: 'USD' };
}

/** Product price/reward are stored in USD; exchange_rate = local units per 1 USD */
export function formatProductMoney(usdAmount, country, exchangeRate) {
  const usd = Number(usdAmount) || 0;
  const { symbol, code } = getCurrencyForCountry(country);
  const rate = Number(exchangeRate) || 1;
  const localValue = usd * rate;
  const isUsdCountry = code === 'USD' || rate === 1;

  let formatted = `USD $${usd.toFixed(2)}`;
  if (!isUsdCountry) {
    formatted += ` (~ ${localValue.toFixed(2)} ${code})`;
  }

  return {
    formatted,
    primary: `USD $${usd.toFixed(2)}`,
    secondary: isUsdCountry ? null : `~ ${localValue.toFixed(2)} ${code}`,
    symbol,
    code,
    usdValue: usd,
    localValue: localValue,
  };
}

/** Wallet is stored in USD; exchange_rate = local units per 1 USD */
export function usdToLocal(usd, exchangeRate) {
  const rate = Number(exchangeRate) || 1;
  return (Number(usd) || 0) * rate;
}

export function formatWalletMoney(usdAmount, buyerCountry, exchangeRate) {
  const usd = Number(usdAmount) || 0;
  const { symbol, code } = getCurrencyForCountry(buyerCountry);
  const rate = Number(exchangeRate) || 1;
  const localValue = usdToLocal(usd, rate);
  const isUsdCountry = code === 'USD' || rate === 1;

  const primary = isUsdCountry
    ? `$${usd.toFixed(2)}`
    : `${symbol}${localValue.toFixed(2)}`;

  const secondary = isUsdCountry
    ? null
    : `≈ $${usd.toFixed(2)} USD`;

  return { primary, secondary, code, localValue, usd, symbol };
}

export function buildCountryRateMap(feeConfigs = []) {
  const map = {};
  for (const row of feeConfigs) {
    const country = normalizeCountry(row.country);
    const rate = parseFloat(row.exchange_rate);
    if (!country || !rate || Number.isNaN(rate)) continue;
    const key = country.toLowerCase();
    if (!map[key]) map[key] = rate;
  }
  return map;
}

export function getRateForCountry(rateByCountry, country) {
  const key = normalizeCountry(country).toLowerCase();
  return rateByCountry[key] ?? 1;
}
