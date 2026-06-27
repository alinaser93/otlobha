import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Clock, Navigation, MapPin, Loader2 } from 'lucide-react';
import ShareButton from './ShareButton.jsx';
import { fadeUp, viewportOnce } from '../lib/motion.js';
import { storeStatus, distanceKm, distanceLabel } from '../lib/storeHours.js';

const CAT_EMOJI = {
  بقالة: '🛒', مخبز: '🥖', مطعم: '🍽️', خضار: '🥬',
  فواكه: '🍎', حلويات: '🍰', لحوم: '🥩', مشروبات: '🥤', ألبان: '🧀',
};
const CAT_GRAD = {
  بقالة: 'from-emerald-500 to-teal-700', مخبز: 'from-amber-500 to-orange-700',
  مطعم: 'from-rose-500 to-red-700', خضار: 'from-lime-500 to-green-700',
  فواكه: 'from-pink-500 to-rose-700', حلويات: 'from-fuchsia-500 to-purple-700',
  لحوم: 'from-red-500 to-rose-800', مشروبات: 'from-sky-500 to-blue-700', ألبان: 'from-cyan-400 to-sky-600',
};
const emojiFor = (c) => CAT_EMOJI[c] || '🏪';
const gradFor = (c) => CAT_GRAD[c] || 'from-brand-600 to-brand-900';

export function useFollows() {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('otlobha-follows') || '[]'); } catch { return []; }
  });
  const toggle = (id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem('otlobha-follows', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return [ids, toggle];
}

export function Stars({ value = 0, className = 'h-3.5 w-3.5' }) {
  const full = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= full ? 'fill-amber-400 text-amber-400' : 'text-white/30'}`} />
      ))}
    </span>
  );
}

function StoreCard({ s, active, onSelect, followed, onFollow, index, dist }) {
  const st = storeStatus(s);
  const closed = !st.open;

  return (
    <motion.button
      variants={fadeUp}
      custom={index % 3}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => onSelect?.(active ? null : s.id)}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-cream text-right shadow-soft ring-1 transition dark:bg-night-800 ${
        active ? 'ring-2 ring-copper' : 'ring-brand-900/5 hover:shadow-card dark:ring-white/10'
      }`}
    >
      {/* cover */}
      <div className="relative h-28 w-full overflow-hidden">
        {s.cover ? (
          <img src={s.cover} alt="" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${closed ? 'grayscale' : ''}`} />
        ) : (
          <div className={`relative h-full w-full bg-gradient-to-br ${gradFor(s.category)} ${closed ? 'grayscale' : ''}`}>
            <span className="absolute inset-0 grid place-items-center text-5xl opacity-30">{emojiFor(s.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          {emojiFor(s.category)} {s.category}
        </span>
        {s.featured && (
          <span className="absolute right-3 top-11 rounded-full bg-copper px-2 py-0.5 text-[10px] font-bold text-cream shadow-seal">مميّز ⭐</span>
        )}

        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onFollow?.(s.id); }}
          className={`absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${
            followed ? 'bg-red-500 text-white' : 'bg-black/35 text-white hover:bg-black/50'
          }`}
          title={followed ? 'إلغاء المتابعة' : 'متابعة'}
        >
          <Heart className={`h-4 w-4 ${followed ? 'fill-white' : ''}`} />
        </span>

        <span className="absolute left-3 top-14" onClick={(e) => e.stopPropagation()}>
          <ShareButton variant="icon" path={`/s/${s.name}`} title={s.name}
            text={`${s.name} — ${s.tagline || 'متجر في اطلبها'} 🛒`}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50" />
        </span>

        {/* rating — bottom-left */}
        <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black text-ink shadow">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {(s.rating || 0).toFixed(1)}
          {s.ratingCount > 0 && <span className="font-bold text-ink/40">({s.ratingCount})</span>}
        </span>

        {/* open / closed — bottom-right */}
        <span className={`absolute bottom-2 right-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black shadow ${st.open ? 'bg-green-500 text-white' : 'bg-gray-800/90 text-white'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.open ? 'bg-white' : 'bg-red-400'}`} />
          {st.open ? 'مفتوح' : 'مغلق'}
        </span>
      </div>

      {/* body */}
      <div className="relative flex flex-1 items-start gap-3 px-4 pb-4 pt-0">
        <span className="-mt-7 grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl shadow-card ring-2 ring-cream dark:ring-night-800">
          {s.logo
            ? <img src={s.logo} alt={s.name} className="h-full w-full object-contain p-1 mix-blend-multiply" />
            : <span>{emojiFor(s.category)}</span>}
        </span>
        <div className="min-w-0 flex-1 pt-2.5">
          <h3 className="truncate font-display text-lg font-black text-ink dark:text-cream">{s.name}</h3>
          {s.tagline
            ? <p className="mt-0.5 truncate font-body text-xs text-ink/50 dark:text-cream/50">{s.tagline}</p>
            : <p className="mt-0.5 truncate font-body text-xs text-ink/40 dark:text-cream/40">متجر في سوق السماوة</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {dist != null && (
              <span className="inline-flex items-center gap-0.5 font-body text-[11px] font-bold text-brand-700 dark:text-brand-300"><MapPin className="h-3 w-3" /> {distanceLabel(dist)}</span>
            )}
            {!st.unknown && st.todayLabel && (
              <span className="inline-flex items-center gap-0.5 font-body text-[11px] text-ink/45 dark:text-cream/45"><Clock className="h-3 w-3" /> {st.todayLabel}</span>
            )}
            {s.followersCount > 0 && (
              <span className="font-body text-[11px] font-bold text-copper dark:text-copper-light">❤️ {s.followersCount}</span>
            )}
          </div>
        </div>
      </div>

      {active && (
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-copper px-2.5 py-0.5 text-[10px] font-bold text-cream">تتصفّحه الآن ✓</span>
      )}
    </motion.button>
  );
}

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'open', label: 'مفتوح الآن' },
  { key: 'rating', label: 'الأعلى تقييماً' },
  { key: 'followers', label: 'الأكثر متابعة' },
  { key: 'near', label: 'الأقرب', geo: true },
];

export default function StoresSection({ stores = [], activeStore = null, onSelect, followIds = [], onToggleFollow }) {
  const [filter, setFilter] = useState('all');
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoNote, setGeoNote] = useState('');

  function pickFilter(key) {
    if (key === 'near') {
      if (userLoc) { setFilter('near'); return; }
      if (!('geolocation' in navigator)) { setGeoNote('جهازك ما يدعم تحديد الموقع'); return; }
      setLocating(true); setGeoNote('');
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setFilter('near'); setLocating(false); },
        (e) => { setLocating(false); setGeoNote(e && e.code === 1 ? 'رُفض إذن الموقع — فعّله من إعدادات المتصفّح' : 'تعذّر تحديد موقعك، حاول ثانية'); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }
    setFilter(key);
  }

  // attach distances, then filter/sort by the active chip
  const view = useMemo(() => {
    let arr = stores.map((s) => ({
      s,
      dist: userLoc && s.lat != null && s.lng != null ? distanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng) : null,
    }));
    if (filter === 'open') arr = arr.filter(({ s }) => storeStatus(s).open);
    else if (filter === 'rating') arr.sort((a, b) => (b.s.rating - a.s.rating) || ((b.s.ratingCount || 0) - (a.s.ratingCount || 0)));
    else if (filter === 'followers') arr.sort((a, b) => (b.s.followersCount || 0) - (a.s.followersCount || 0));
    else if (filter === 'near') arr.sort((a, b) => {
      if (a.dist == null && b.dist == null) return 0;
      if (a.dist == null) return 1;
      if (b.dist == null) return -1;
      return a.dist - b.dist;
    });
    return arr;
  }, [stores, filter, userLoc]);

  const openCount = useMemo(() => stores.filter((s) => storeStatus(s).open).length, [stores]);

  if (!stores.length) return null;

  return (
    <section id="stores" className="bg-gradient-to-b from-beige/60 to-cream py-14 dark:from-night-900 dark:to-night sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}
          className="flex items-end justify-between gap-4">
          <div>
            <span className="font-body text-sm font-bold tracking-widest text-copper dark:text-copper-light">سوق السماوة 🏙️</span>
            <h2 className="mt-2 font-display text-3xl font-black text-ink dark:text-cream sm:text-4xl">متاجر تختارها أنت</h2>
            <p className="mt-1 font-body text-sm text-ink/50 dark:text-cream/50">
              {openCount} متجر مفتوح الآن من أصل {stores.length}
            </p>
          </div>
          {activeStore && (
            <button onClick={() => onSelect?.(null)}
              className="shrink-0 rounded-full bg-brand-800 px-4 py-2 font-body text-sm font-bold text-cream shadow-soft transition hover:bg-brand-700 dark:bg-brand-600">
              كل المتاجر
            </button>
          )}
        </motion.div>

        {/* filters / sort */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => pickFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-body text-sm font-bold transition ${
                  on
                    ? 'bg-brand-800 text-cream shadow-soft ring-1 ring-brand-800 dark:bg-brand-600 dark:ring-brand-600'
                    : 'bg-white text-ink ring-1 ring-ink/10 hover:ring-copper/40 dark:bg-night-800 dark:text-cream/80 dark:ring-white/10'
                }`}
              >
                {f.geo && (locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />)}
                {f.key === 'open' && <Clock className="h-3.5 w-3.5" />}
                {f.label}
              </button>
            );
          })}
        </div>
        {geoNote && <p className="mt-2 font-body text-[12px] font-bold text-amber-600 dark:text-amber-300">{geoNote}</p>}

        {view.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink/15 bg-beige/30 py-14 text-center dark:border-white/15 dark:bg-white/5">
            <p className="font-display text-lg font-bold text-ink/70 dark:text-cream/70">ماكو متجر مفتوح الآن 🌙</p>
            <p className="mt-1 font-body text-sm text-ink/45 dark:text-cream/45">جرّب «الكل» حتى تشوف كل المتاجر</p>
            <button onClick={() => setFilter('all')} className="mt-4 rounded-full bg-copper px-5 py-2 font-body text-sm font-bold text-cream hover:bg-copper-dark">عرض كل المتاجر</button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {view.map(({ s, dist }, i) => (
              <StoreCard key={s.id} s={s} index={i} active={activeStore === s.id} onSelect={onSelect}
                followed={followIds.includes(s.id)} onFollow={onToggleFollow} dist={dist} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
