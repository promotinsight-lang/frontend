/** Build unique country → platforms list from admin Dynamic Tariffs (fees/all) */
export function buildCountriesFromFeeConfigs(feeConfigs = []) {
  const map = {};
  for (const row of feeConfigs) {
    if (!row?.country || !row?.platform) continue;
    if (!map[row.country]) {
      map[row.country] = { country: row.country, platforms: [] };
    }
    if (!map[row.country].platforms.some((p) => p.platform === row.platform)) {
      map[row.country].platforms.push({
        platform: row.platform,
        verification_fields: [],
        feeRow: row,
      });
    }
  }
  return Object.values(map).sort((a, b) => a.country.localeCompare(b.country));
}

export function parsePlatformChargeTiers(platformCharge) {
  if (Array.isArray(platformCharge) && platformCharge.length > 0) return platformCharge;
  if (typeof platformCharge === 'string') {
    try {
      const parsed = JSON.parse(platformCharge);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* ignore */
    }
  }
  return [];
}

/** Merge verification field defs from /api/config/verification into fee-based countries */
export function mergeVerificationFields(countries, verificationCountries = []) {
  const verMap = {};
  for (const c of verificationCountries) {
    verMap[c.country] = {};
    for (const p of c.platforms || []) {
      verMap[c.country][p.platform] = p.fields || [];
    }
  }

  return countries.map((c) => ({
    ...c,
    platforms: c.platforms.map((p) => ({
      ...p,
      fields:
        verMap[c.country]?.[p.platform]?.length > 0
          ? verMap[c.country][p.platform]
          : p.verification_fields,
    })),
  }));
}
