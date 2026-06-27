import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, ChevronRight, Phone, BadgeCheck, Users } from 'lucide-react';
import { Stars } from './StoresSection.jsx';
import { RatingModal } from './StoreRating.jsx';

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

import ShareButton from './ShareButton.jsx';

export default function StoreHeader({ store, count = 0, onBack, account = null, onRequireLogin, onRated, followIds = [], onToggleFollow }) {
  const [rateOpen, setRateOpen] = useState(false);
  if (!store) return null;
  const followed = followIds.includes(store.id);
  const phone = (store.phone || '').replace(/[^\d]/g, '');

  function openRate() {
    if (account?.id) setRateOpen(true);
    else onRequireLogin?.();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-[2rem] bg-cream shadow-card ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10"
    >
      {/* cover (video > image > gradient) */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56">
        {store.coverVideo ? (
          <video className="h-full w-full object-cover" src={store.coverVideo} autoPlay muted loop playsInline
            poster={store.cover || undefined} />
        ) : store.cover ? (
          <img src={store.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradFor(store.category)}`}>
            <span className="absolute inset-0 grid place-items-center text-7xl opacity-25">{emojiFor(store.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

        {/* back */}
        <button onClick={onBack}
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-sm font-bold text-white backdrop-blur transition hover:bg-black/55">
          <ChevronRight className="h-4 w-4" /> كل المتاجر
        </button>

        {/* follow + rate + share */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <button onClick={openRate}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-sm font-bold text-ink shadow-soft transition hover:bg-amber-300">
            <Star className="h-4 w-4 fill-ink" /> قيّم
          </button>
          <button onClick={() => onToggleFollow?.(store.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold backdrop-blur transition ${
              followed ? 'bg-red-500 text-white' : 'bg-white/90 text-ink hover:bg-white'
            }`}>
            <Heart className={`h-4 w-4 ${followed ? 'fill-white' : ''}`} /> {followed ? 'متابَع' : 'متابعة'}
          </button>
          <ShareButton variant="icon" path={`/s/${store.name}`} title={store.name}
            text={`${store.name} — ${store.tagline || 'متجر في اطلبها'} 🛒`} />
        </div>
      </div>

      {rateOpen && (
        <RatingModal store={store} account={account} onClose={() => setRateOpen(false)} onRated={onRated} />
      )}

      {/* identity row */}
      <div className="relative flex items-start gap-4 px-5 pb-5 pt-0 sm:px-7">
        <span className="-mt-12 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-white text-5xl shadow-card ring-4 ring-cream dark:ring-night-800 sm:h-28 sm:w-28">
          {store.logo
            ? <img src={store.logo} alt={store.name} className="h-full w-full object-contain p-2 mix-blend-multiply" />
            : <span>{emojiFor(store.category)}</span>}
        </span>

        <div className="min-w-0 flex-1 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-black text-ink dark:text-cream sm:text-3xl">{store.name}</h2>
            {store.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-copper/15 px-2 py-0.5 text-[11px] font-bold text-copper-dark dark:text-copper-light">
                <BadgeCheck className="h-3.5 w-3.5" /> مميّز
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {(store.rating || 0).toFixed(1)}
              {store.ratingCount > 0 && <span className="font-normal opacity-70">({store.ratingCount} تقييم)</span>}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-bold text-ink/60 dark:bg-white/10 dark:text-cream/60">
              {emojiFor(store.category)} {store.category}
            </span>
            <span className="text-xs font-bold text-ink/45 dark:text-cream/45">{count} منتج</span>
            {store.followersCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/45 dark:text-cream/45">
                <Users className="h-3.5 w-3.5" /> {store.followersCount} متابِع
              </span>
            )}
          </div>

          {store.tagline && <p className="mt-2 font-body text-sm leading-relaxed text-ink/55 dark:text-cream/55">{store.tagline}</p>}

          {phone && (
            <a href={`tel:${phone}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-copper hover:underline dark:text-copper-light" dir="ltr">
              <Phone className="h-3.5 w-3.5" /> {store.phone}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
