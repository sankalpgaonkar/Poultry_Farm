/**
 * PoultrySmart Image Constants
 * Maps all product/category images to local static assets in /assets/images/
 */

export const POULTRY_IMAGES = {
  // Hero & Backgrounds
  HERO: {
    FARM_VIEW: '/images/poultry_farm_hero.webp',
    CHICKS_GROUP: '/assets/images/day_old_chicks.webp'
  },
  SCENERY: [
    '/images/poultry_farm_hero.webp',
    '/assets/images/farm_listing.webp',
    '/assets/images/day_old_chicks.webp',
  ],

  // Dashboard Stat Cards
  STATS: {
    CHICKENS: '/assets/images/white_leghorn.webp',
    EGGS: '/assets/images/organic_eggs.webp',
    FARMS: '/assets/images/farm_listing.webp',
    ALERTS: '/assets/images/medicine_bottles.webp',
  },

  // Marketplace & Store Products
  PRODUCTS: {
    EGGS: [
      '/assets/images/organic_eggs.webp',
      '/assets/images/organic_eggs_carton.webp',
    ],
    LIVE_BIRDS: [
      '/assets/images/white_leghorn.webp',
      '/assets/images/day_old_chicks.webp',
      '/assets/images/whiteleghorn.webp',
    ],
    FEED: [
      '/assets/images/feed_bag.webp',
    ],
    MEDICINE: [
      '/assets/images/medicine_bottles.webp',
    ],
    EQUIPMENT: [
      '/assets/images/equipment_drinker.webp',
      '/assets/images/equipment_drinker.webp',
    ],
    SUPPLIES: [
      '/assets/images/woodshavings.webp',
      '/assets/images/Disinfectant.webp',
    ]
  },

  // Category Placeholders
  PLACEHOLDERS: {
    STORE: '/assets/images/farm_listing.webp',
    AI_BOT: '/assets/images/white_leghorn.webp',
  }
};

/**
 * Returns a deterministic image URL based on a search term to ensure
 * consistency across re-renders.
 */
export const getConsistentImage = (term = '', category = 'GENERAL') => {
  const t = (term || '').toUpperCase();
  const hash = term ? term.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  
  // Specific Terms (Intelligent Mapping)
  if (t.includes('STARTER') || t.includes('MASH')) return '/assets/images/feed_bag.webp';
  if (t.includes('FINISHER') || t.includes('GROWER')) return '/assets/images/feed_bag.webp';
  
  if (t.includes('KADAKNATH')) return '/assets/images/whiteleghorn.webp';
  if (t.includes('COUNTRY') || t.includes('NATURAL') || t.includes('DESI')) return '/assets/images/day_old_chicks.webp';
  
  if (t.includes('LAYER') || t.includes('LEGHORN')) return '/assets/images/white_leghorn.webp';
  if (t.includes('CHICK') || t.includes('COBB') || t.includes('BROILER')) return '/assets/images/day_old_chicks.webp';

  if (t.includes('EGG')) return '/assets/images/organic_eggs.webp';

  if (t.includes('MED') || t.includes('VITAMIN') || t.includes('VACCINE') || t.includes('AMOX')) return '/assets/images/medicine_bottles.webp';
  if (t.includes('DISINFECT') || t.includes('SPRAY')) return '/assets/images/Disinfectant.webp';
  if (t.includes('EQUIP') || t.includes('DRINKER') || t.includes('FEEDER')) return '/assets/images/equipment_drinker.webp';
  if (t.includes('LAMP') || t.includes('BROODER')) return '/assets/images/infrarred.webp';
  if (t.includes('WOOD') || t.includes('SHAVING') || t.includes('BEDDING')) return '/assets/images/woodshavings.webp';

  // Store name mapping
  if (t.includes('AGRO') || t.includes('NATIONAL')) return '/assets/images/feed_bag.webp';
  if (t.includes('PHARMA') || t.includes('POULTRYMED')) return '/assets/images/medicine_bottles.webp';
  if (t.includes('HATCHER') || t.includes('SUNRISE')) return '/assets/images/day_old_chicks.webp';

  // Fallback to Category Logic
  let imageArray = [];
  if (t.includes('EGG') || category === 'EGG') {
    imageArray = POULTRY_IMAGES.PRODUCTS.EGGS;
  } else if (t.includes('CHICK') || t.includes('BIRD') || category === 'BIRD') {
    imageArray = POULTRY_IMAGES.PRODUCTS.LIVE_BIRDS;
  } else if (t.includes('FEED') || category === 'FEED') {
    imageArray = POULTRY_IMAGES.PRODUCTS.FEED;
  } else if (t.includes('MEDICINE') || category === 'MEDICINE') {
    imageArray = POULTRY_IMAGES.PRODUCTS.MEDICINE;
  } else if (category === 'EQUIPMENT') {
    imageArray = POULTRY_IMAGES.PRODUCTS.EQUIPMENT;
  } else if (category === 'STORE') {
    return POULTRY_IMAGES.PLACEHOLDERS.STORE;
  } else {
    imageArray = POULTRY_IMAGES.SCENERY;
  }

  return imageArray[hash % imageArray.length] || POULTRY_IMAGES.SCENERY[0];
};

/**
 * Premium Rupee Formatter
 */
export const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};
