const Farm = require('../models/Farm');
const MarketRateHistory = require('../models/MarketRateHistory');
const { getRates } = require('../utils/marketRates');
const { httpError } = require('../middleware/errorMiddleware');

// GET /api/market/rates
const getMarketRates = (req, res) => {
  const { asOf, isSample, note, rates } = getRates();
  res.json({ asOf, isSample, note, rates: rates.map(({ keywords: _keywords, ...r }) => r) });
};

// GET /api/market/rates/history?days=90  - daily price points per rate id (empty when none are stored)
const getRateHistory = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 90, 7), 365);
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await MarketRateHistory.find({ date: { $gte: since } }).sort({ date: 1 }).select('rateId date price isSample -_id').lean();
    const series = {};
    for (const r of rows) (series[r.rateId] ||= []).push({ date: r.date, price: r.price });
    res.json({ days, isSample: rows.some((r) => r.isSample), series });
  } catch (error) {
    next(error);
  }
};

// ---- Weather (Open-Meteo: free, no API key) ----
const cache = new Map(); // key -> { at, data }
const TTL_MS = 30 * 60 * 1000;

const fetchJson = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'PoultrySmart/2.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
};

const advice = (maxTemp, rainChance, humidity) => {
  const tips = [];
  if (maxTemp >= 35) tips.push('Severe heat expected: run foggers or sprinklers at midday, add electrolytes and vitamin C to water, and avoid handling birds in the afternoon.');
  else if (maxTemp >= 32) tips.push('Hot day ahead: make sure drinkers are full and cool, and improve shed ventilation.');
  if (maxTemp <= 15) tips.push('Cold weather: close side curtains at night and check brooder heating for chicks.');
  if (rainChance >= 60) tips.push('Rain likely: keep litter dry and protect feed bags from moisture.');
  if (humidity >= 85) tips.push('Very humid: watch for wet litter and respiratory problems.');
  if (!tips.length) tips.push('Weather looks comfortable for birds today.');
  return tips;
};

// GET /api/market/weather?location=Udupi   (defaults to the farmer's first farm location)
const getWeather = async (req, res, next) => {
  try {
    let place = (req.query.location || '').toString().trim().slice(0, 100);
    if (!place) {
      const farm = await Farm.findOne({ farmer: req.user._id }).sort({ createdAt: 1 });
      place = farm?.location || '';
    }
    if (!place) throw httpError(400, 'Add a farm with a location to see local weather.');

    const key = place.toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return res.json(hit.data);

    // Try the town first, then the district/state parts ("Karkala, Udupi, Karnataka" -> Karkala, Udupi, ...).
    const parts = place.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
    const town = parts[0];
    let loc;
    for (const name of parts) {
      let geo;
      try {
        geo = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json&countryCode=IN`);
      } catch {
        throw httpError(503, 'Weather service is not reachable right now. Please try again later.');
      }
      loc = geo.results?.[0];
      if (loc) break;
    }
    if (!loc) throw httpError(404, `Couldn't find the place "${town}". Check the farm location spelling.`);

    let wx;
    try {
      wx = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=3');
    } catch {
      throw httpError(503, 'Weather service is not reachable right now. Please try again later.');
    }

    const today = {
      max: wx.daily?.temperature_2m_max?.[0],
      min: wx.daily?.temperature_2m_min?.[0],
      rainChance: wx.daily?.precipitation_probability_max?.[0] ?? 0,
    };
    const data = {
      place: [loc.name, loc.admin1].filter(Boolean).join(', '),
      current: {
        temperature: wx.current?.temperature_2m,
        humidity: wx.current?.relative_humidity_2m,
        windSpeed: wx.current?.wind_speed_10m,
        weatherCode: wx.current?.weather_code,
      },
      daily: (wx.daily?.time || []).map((date, i) => ({
        date,
        max: wx.daily.temperature_2m_max[i],
        min: wx.daily.temperature_2m_min[i],
        rainChance: wx.daily.precipitation_probability_max?.[i] ?? 0,
        weatherCode: wx.daily.weather_code?.[i],
      })),
      advice: advice(today.max, today.rainChance, wx.current?.relative_humidity_2m ?? 0),
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
    };
    cache.set(key, { at: Date.now(), data });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRateHistory, getMarketRates, getWeather };
