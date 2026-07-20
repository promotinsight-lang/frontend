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

export const buildDefaultBuyerRewardConditions = () =>
  PLATFORM_CHARGE_CONDITION_KEYS.reduce((acc, key) => {
    acc[key] = '';
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

export const parseBuyerRewardConditions = (value) => {
  const parsed = typeof value === 'string' ? (() => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  })() : value;

  const defaults = buildDefaultBuyerRewardConditions();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
  PLATFORM_CHARGE_CONDITION_KEYS.forEach((key) => {
    const rawReward = parsed[key];
    if (rawReward === '' || rawReward === null || rawReward === undefined) return;
    if (typeof rawReward === 'string' && rawReward.trim() === '') return;

    const reward = Number(rawReward);
    defaults[key] = Number.isFinite(reward) && reward >= 0 ? reward : '';
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

export const resolveBuyerRewardForCategory = (config, category) => {
  const categoryKey = normalizeCampaignCategoryKey(category);
  const conditionMap = config?.parsed_buyer_reward_conditions || parseBuyerRewardConditions(config?.buyer_reward_conditions);
  const rawConditionReward = categoryKey ? conditionMap[categoryKey] : '';
  if (rawConditionReward !== '' && rawConditionReward !== null && rawConditionReward !== undefined) {
    const conditionReward = Number(rawConditionReward);
    if (Number.isFinite(conditionReward) && conditionReward >= 0) return conditionReward;
  }

  const fixedReward = Number(config?.buyer_reward);
  return Number.isFinite(fixedReward) ? fixedReward : 0;
};

export const getConfiguredCampaignCategoryOptions = (config) => {
  const conditionMap = parsePlatformChargeConditions(config?.platform_charge_conditions);
  const configuredOptions = CAMPAIGN_CATEGORY_OPTIONS.filter((option) => {
    const key = normalizeCampaignCategoryKey(option.value);
    return key && Array.isArray(conditionMap[key]) && conditionMap[key].length > 0;
  });

  return configuredOptions.length > 0 ? configuredOptions : CAMPAIGN_CATEGORY_OPTIONS;
};

export const getPlatformChargeConditionLabel = (conditionKey) => CATEGORY_LABELS[conditionKey] || conditionKey;

export const getBuyerRewardConditionEntries = (value) => {
  const conditionMap = parseBuyerRewardConditions(value);
  return PLATFORM_CHARGE_CONDITION_KEYS.reduce((entries, key) => {
    const rawReward = conditionMap[key];
    if (rawReward === '' || rawReward === null || rawReward === undefined) return entries;

    const reward = Number(rawReward);
    if (Number.isFinite(reward) && reward >= 0) {
      entries.push({ key, label: getPlatformChargeConditionLabel(key), reward });
    }
    return entries;
  }, []);
};

export const formatBuyerRewardSummary = (config, currencySymbol = '$') => {
  const entries = getBuyerRewardConditionEntries(config?.buyer_reward_conditions);
  if (entries.length > 0) {
    return entries
      .map(({ label, reward }) => `${label}: ${currencySymbol}${reward.toFixed(2)}`)
      .join(', ');
  }

  const rawFixedReward = config?.buyer_reward;
  if (rawFixedReward === '' || rawFixedReward === null || rawFixedReward === undefined) return 'Custom';
  if (typeof rawFixedReward === 'string' && rawFixedReward.trim() === '') return 'Custom';

  const fixedReward = Number(rawFixedReward);
  return Number.isFinite(fixedReward) ? `${currencySymbol}${fixedReward.toFixed(2)}` : 'Custom';
};
