const CATEGORY_KEY_ALIASES = {
  'need review': 'need_review',
  review: 'need_review',
  'no need review': 'no_need_review',
  'no review': 'no_need_review',
  'no need': 'no_need_review',
  rating: 'rating',
  feedback: 'feedback',
  'feedback only': 'feedback',
  'pre-pay': 'pre_pay',
  prepay: 'pre_pay',
};

const CATEGORY_LABELS = {
  need_review: 'Need Review',
  no_need_review: 'No Need Review',
  rating: 'Rating',
  feedback: 'Feedback',
  pre_pay: 'Pre-Pay',
};

export const PLATFORM_CHARGE_CONDITION_KEYS = ['need_review', 'no_need_review', 'rating', 'feedback'];

export const CAMPAIGN_CATEGORY_OPTIONS = [
  { value: 'Need Review', label: 'Need Review' },
  { value: 'No Need Review', label: 'No Need Review' },
  { value: 'Rating', label: 'Rating' },
  { value: 'Feedback', label: 'Feedback' },
];

export const normalizeCampaignCategoryKey = (category) => {
  const normalized = String(category || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
  return CATEGORY_KEY_ALIASES[normalized] || null;
};

export const normalizeCampaignCategory = (category) => {
  const key = normalizeCampaignCategoryKey(category);
  if (key) return CATEGORY_LABELS[key];
  return String(category || '').trim() || 'Need Review';
};

export const isReviewRequiredCampaignCategory = (category) => {
  const key = normalizeCampaignCategoryKey(category);
  return key === 'need_review' || key === 'rating' || key === 'feedback';
};

export const buildDefaultPlatformChargeConditions = () =>
  PLATFORM_CHARGE_CONDITION_KEYS.reduce((acc, key) => {
    acc[key] = [{ min: '', max: '', fee: '' }];
    return acc;
  }, {});

const buildEmptyPlatformChargeConditions = () =>
  PLATFORM_CHARGE_CONDITION_KEYS.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});

export const parsePlatformChargeTiers = (platformCharge) => {
  const normalizeTiers = (tiers) => tiers.filter((tier) =>
    tier &&
    tier.min !== '' &&
    tier.max !== '' &&
    tier.fee !== '' &&
    Number.isFinite(Number(tier.min)) &&
    Number.isFinite(Number(tier.max)) &&
    Number.isFinite(Number(tier.fee))
  );

  if (Array.isArray(platformCharge) && platformCharge.length > 0) return normalizeTiers(platformCharge);
  if (typeof platformCharge === 'string') {
    try {
      const parsed = JSON.parse(platformCharge);
      if (Array.isArray(parsed) && parsed.length > 0) return normalizeTiers(parsed);
    } catch {
      /* ignore */
    }
  }
  return [];
};

export const parsePlatformChargeConditions = (value) => {
  if (!value) return buildEmptyPlatformChargeConditions();
  const parsed = typeof value === 'string' ? (() => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  })() : value;

  const defaults = buildEmptyPlatformChargeConditions();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
  PLATFORM_CHARGE_CONDITION_KEYS.forEach((key) => {
    defaults[key] = parsePlatformChargeTiers(parsed[key]);
  });
  return defaults;
};

export const resolvePlatformChargeTiersForCategory = (config, category) => {
  const categoryKey = normalizeCampaignCategoryKey(category);
  const conditionMap = parsePlatformChargeConditions(config?.platform_charge_conditions);
  const conditionTiers = categoryKey ? conditionMap[categoryKey] : [];
  if (Array.isArray(conditionTiers) && conditionTiers.length > 0) return conditionTiers;
  return parsePlatformChargeTiers(config?.platform_charge);
};

export const getPlatformChargeConditionLabel = (conditionKey) => CATEGORY_LABELS[conditionKey] || conditionKey;
