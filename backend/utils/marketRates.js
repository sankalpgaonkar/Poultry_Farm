/**
 * Market reference rates (backend/data/marketRates.json) and the Fair Price Guard.
 * The JSON file is the single place to update prices; no code change is needed.
 */
const data = require('../data/marketRates.json');

const FAIR_PRICE_RATIO = 0.7; // warn when a listing is more than 30% below the reference rate

const getRates = () => data;

/** Finds the reference rate that matches a listing (same category and a matching keyword such as "TRAY"). */
const findReference = ({ productName = '', category }) => {
  const name = productName.toUpperCase();
  const candidates = data.rates.filter((r) => r.category === category && r.keywords.length);
  return candidates.find((r) => r.keywords.some((k) => name.includes(k))) || null;
};

/** Returns a non-blocking warning when the price looks unfairly low. */
const checkFairPrice = ({ productName, category, pricePerUnit }) => {
  const ref = findReference({ productName, category });
  if (!ref) return { checked: false };
  const floor = Math.round(ref.price * FAIR_PRICE_RATIO * 100) / 100;
  const low = pricePerUnit < floor;
  return {
    checked: true,
    low,
    reference: { product: ref.product, unit: ref.unit, price: ref.price, region: ref.region, asOf: data.asOf, isSample: data.isSample },
    message: low
      ? `Your price (\u20b9${pricePerUnit}) is well below the reference rate of \u20b9${ref.price} ${ref.unit}. Check it before buyers see it.`
      : undefined,
  };
};

module.exports = { getRates, checkFairPrice, findReference };
