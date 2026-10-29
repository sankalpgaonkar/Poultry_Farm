import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudSun, Droplets, Wind, Thermometer } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';

const CODES = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' };
const day = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });

/** Local weather for the farmer's farm, with heat/rain advice for the flock. Data: Open-Meteo (free, no key). */
export default function WeatherCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/market/weather', { silent: true }).then(({ data: d }) => setData(d)).catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <section aria-labelledby="weather-title" className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-3xl p-5 sm:p-6 space-y-4">
      <h2 id="weather-title" className="text-lg font-bold text-slate-900 flex items-center gap-2"><CloudSun size={20} aria-hidden="true" className="text-sky-700" />Farm weather</h2>
      {!data && !error && <div className="skeleton h-28" aria-hidden="true" />}
      {error && (
        <p className="text-sm text-slate-700">{error} {/farm/i.test(error) && <Link className="font-semibold text-emerald-800 underline" to="/farmer/manage">Add a farm</Link>}</p>
      )}
      {data && (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">{data.place}</p>
              <p className="text-4xl font-extrabold text-slate-900 tabular-nums">{Math.round(data.current.temperature)}°C</p>
              <p className="text-sm text-slate-700">{CODES[data.current.weatherCode] || '—'}</p>
            </div>
            <ul className="text-sm text-slate-700 space-y-1 text-right">
              <li className="flex items-center gap-1.5 justify-end"><Droplets size={14} aria-hidden="true" />{data.current.humidity}% humidity</li>
              <li className="flex items-center gap-1.5 justify-end"><Wind size={14} aria-hidden="true" />{Math.round(data.current.windSpeed)} km/h</li>
            </ul>
          </div>
          <ul className="grid grid-cols-3 gap-2 text-center text-sm">
            {data.daily.map((d) => (
              <li key={d.date} className="bg-white/80 border border-sky-100 rounded-xl p-2">
                <span className="block font-semibold text-slate-900">{day(d.date)}</span>
                <span className="block text-slate-700 tabular-nums">{Math.round(d.max)}° / {Math.round(d.min)}°</span>
                <span className="block text-xs text-slate-500">{d.rainChance}% rain</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5">
            {data.advice.map((a) => (
              <li key={a} className="text-sm text-slate-800 flex gap-2"><Thermometer size={16} aria-hidden="true" className="shrink-0 mt-0.5 text-amber-700" />{a}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
