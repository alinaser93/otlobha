import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Store as StoreIcon, Sparkles, Loader2, ShoppingBasket, Check, Clock, Wand2 } from 'lucide-react';
import { fmt } from '../data/catalog.js';
import { assistantBuildCart } from '../lib/ai.js';
import { useBackClose } from '../lib/motion.js';

/* normalise Arabic for forgiving matching (strip diacritics, unify alef/yaa/taa) */
const norm = (s = '') =>
  s.toString().toLowerCase()
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ').trim();

const PROMPTS = ['دولمة لـ٦ أشخاص', 'فطور عراقي', 'أساسيات البيت لأسبوع', 'حلويات للضيوف', 'سلطة وخضار طازة'];
const RECENT_KEY = 'otlobha-recent-search';

const emojiCat = { بقالة: '🛒', مخبز: '🥖', مطعم: '🍽️', خضار: '🥬', فواكه: '🍎', حلويات: '🍰', لحوم: '🥩', مشروبات: '🥤', ألبان: '🧀' };

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 6); } catch { return []; }
}

export default function SearchModal({ open, onClose, products = [], stores = [], categories = [], bundles = [], onAddProduct, onSelectStore, onPickCategory, onOpenBundle }) {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(loadRecent);
  const [ai, setAi] = useState(null);            // { loading, note, items:[product], bundle, error, none }
  const inputRef = useRef(null);

  useBackClose(open, onClose);

  // focus the field + reset when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQ(''); setAi(null);
    }
  }, [open]);

  const cats = useMemo(
    () => (categories || []).map((c) => (typeof c === 'string' ? { name: c } : c)).filter((c) => c.name && c.name !== 'الكل'),
    [categories]
  );

  // instant local search across products / stores / categories / bundles
  const results = useMemo(() => {
    const nq = norm(q);
    if (!nq) return null;
    const toks = nq.split(' ').filter(Boolean);
    const hit = (hay) => { const h = norm(hay); return toks.every((t) => h.includes(t)); };
    return {
      products: products.filter((p) => hit(`${p.name} ${p.tag || ''}`)).slice(0, 8),
      stores: stores.filter((s) => hit(`${s.name} ${s.tagline || ''} ${s.category || ''}`)).slice(0, 4),
      cats: cats.filter((c) => hit(c.name)).slice(0, 6),
      bundles: bundles.filter((b) => hit(`${b.name} ${(b.items || []).join(' ')} ${b.kicker || ''} ${b.desc || ''}`)).slice(0, 4),
    };
  }, [q, products, stores, cats, bundles]);

  const totalResults = results ? results.products.length + results.stores.length + results.cats.length + results.bundles.length : 0;

  const pushRecent = (term) => {
    const t = term.trim();
    if (!t) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // run the AI shopping assistant on the current query
  const runAssistant = async (term) => {
    const query = (term ?? q).trim();
    if (!query) return;
    setQ(query);
    pushRecent(query);
    setAi({ loading: true });
    const r = await assistantBuildCart(query, products, bundles);
    if (!r?.ok) {
      // graceful fallback: AI off or failed → lean on the local results
      setAi({ error: r?.no_key ? 'off' : (r?.error || 'fail') });
      return;
    }
    const items = (r.items || [])
      .map((it) => { const p = products.find((x) => String(x.id) === String(it.id)); return p ? { p, qty: it.qty || 1 } : null; })
      .filter(Boolean);
    const bundle = r.bundleId ? bundles.find((b) => String(b.id) === String(r.bundleId)) : null;
    setAi({ note: r.note || '', items, bundle, none: items.length === 0 && !bundle });
  };

  const addAll = () => {
    (ai?.items || []).forEach(({ p, qty }) => onAddProduct?.(p, qty));
  };

  const clearRecent = () => { setRecent([]); try { localStorage.removeItem(RECENT_KEY); } catch {} };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex h-full w-full max-w-2xl flex-col bg-beige dark:bg-night sm:my-6 sm:h-[calc(100%-3rem)] sm:rounded-[1.75rem] sm:shadow-card"
          >
            {/* search bar */}
            <div className="flex items-center gap-2 border-b border-ink/10 p-3 dark:border-white/10 sm:p-4">
              <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-copper dark:bg-night-800 dark:ring-white/10">
                <Search className="h-5 w-5 shrink-0 text-ink/40 dark:text-cream/40" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setAi(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') runAssistant(); }}
                  placeholder="دور على منتج، متجر، أو اكتب وصفة…"
                  className="w-full bg-transparent font-body text-[15px] text-ink outline-none placeholder:text-ink/40 dark:text-cream dark:placeholder:text-cream/40"
                />
                {q && (
                  <button onClick={() => { setQ(''); setAi(null); inputRef.current?.focus(); }} aria-label="مسح" className="shrink-0 text-ink/40 hover:text-ink dark:text-cream/40">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button onClick={onClose} className="shrink-0 rounded-full bg-white px-3.5 py-2.5 font-body text-sm font-bold text-ink ring-1 ring-ink/10 hover:bg-cream dark:bg-night-800 dark:text-cream dark:ring-white/10">
                إلغاء
              </button>
            </div>

            {/* AI assistant call-to-action */}
            {q.trim() && !ai && (
              <button
                onClick={() => runAssistant()}
                className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-l from-brand-800 to-brand-600 px-4 py-3 text-right shadow-soft sm:mx-4"
              >
                <span className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"><Sparkles className="h-5 w-5 text-cream" /></span>
                  <span className="leading-tight">
                    <span className="block font-display text-sm font-black text-cream">خلّي مساعد اطلبها يجمعلك السلة</span>
                    <span className="block font-body text-[11px] text-cream/75">«{q.trim()}» → سلّة جاهزة بضغطة</span>
                  </span>
                </span>
                <Wand2 className="h-5 w-5 shrink-0 text-copper-light" />
              </button>
            )}

            {/* body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {/* AI panel */}
              {ai && (
                <div className="mb-4 overflow-hidden rounded-2xl border border-copper/30 bg-white shadow-soft dark:border-copper/30 dark:bg-night-800">
                  <div className="flex items-center gap-2 bg-gradient-to-l from-brand-800 to-brand-600 px-4 py-2.5">
                    <Sparkles className="h-4 w-4 text-copper-light" />
                    <span className="font-display text-sm font-black text-cream">مساعد اطلبها</span>
                  </div>
                  <div className="p-4">
                    {ai.loading && (
                      <div className="flex items-center gap-3 py-3 text-ink/70 dark:text-cream/70">
                        <Loader2 className="h-5 w-5 animate-spin text-copper" />
                        <span className="font-body text-sm">دزيت طلبك للمساعد… يجمعلك السلة 🧺</span>
                      </div>
                    )}

                    {ai.error && (
                      <p className="py-2 font-body text-sm text-ink/70 dark:text-cream/70">
                        {ai.error === 'off'
                          ? 'مساعد الذكاء مو مفعّل حالياً — بس تكدر تستخدم نتائج البحث تحت 👇'
                          : 'تعذّر تشغيل المساعد الحين، جرّب مرة ثانية أو دوّر بالبحث تحت 👇'}
                      </p>
                    )}

                    {ai.none && (
                      <p className="py-2 font-body text-sm text-ink/70 dark:text-cream/70">
                        ما لگيت شي مناسب تماماً لهذا الطلب — جرّب توضّح أكثر، أو شوف نتائج البحث تحت.
                      </p>
                    )}

                    {!ai.loading && !ai.error && (ai.items?.length > 0 || ai.bundle) && (
                      <>
                        {ai.note && <p className="mb-3 font-body text-sm leading-relaxed text-ink dark:text-cream">{ai.note}</p>}

                        {ai.bundle && (
                          <button
                            onClick={() => onOpenBundle?.(ai.bundle)}
                            className="mb-3 flex w-full items-center gap-3 rounded-xl bg-copper/10 p-2.5 text-right ring-1 ring-copper/20 transition hover:bg-copper/15"
                          >
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white text-2xl shadow dark:bg-night-700">🧺</span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-display text-sm font-black text-ink dark:text-cream">باقة تناسب طلبك: {ai.bundle.name}</span>
                              <span className="block font-body text-xs text-copper dark:text-copper-light">افتح الباقة لتفاصيلها ←</span>
                            </span>
                          </button>
                        )}

                        {ai.items?.length > 0 && (
                          <>
                            <div className="space-y-2">
                              {ai.items.map(({ p, qty }) => (
                                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-beige/50 p-2 dark:bg-white/5">
                                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-xl dark:bg-night-700">
                                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <span>{p.emoji}</span>}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-body text-sm font-bold text-ink dark:text-cream">{p.name}</p>
                                    <p className="font-body text-xs text-ink/50 dark:text-cream/50">×{qty} · {fmt(p.price)} د.ع</p>
                                  </div>
                                  <button
                                    onClick={() => onAddProduct?.(p, qty)}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-800 text-cream transition hover:bg-brand-700 dark:bg-brand-600"
                                    aria-label="أضف"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={addAll}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-copper py-3 font-display text-sm font-bold text-cream shadow-seal transition hover:bg-copper-dark"
                            >
                              <ShoppingBasket className="h-4 w-4" />
                              أضف كل المقترحات للسلة ({ai.items.length})
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* instant local results */}
              {results && totalResults > 0 && (
                <div className="space-y-5">
                  {results.products.length > 0 && (
                    <Section title="منتجات">
                      {results.products.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-soft ring-1 ring-ink/5 dark:bg-night-800 dark:ring-white/10">
                          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-beige/60 text-2xl dark:bg-night-700">
                            {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <span>{p.emoji}</span>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-body text-sm font-bold text-ink dark:text-cream">{p.name}</p>
                            <p className="font-body text-xs text-ink/50 dark:text-cream/50">{p.tag} · {fmt(p.price)} د.ع</p>
                          </div>
                          <button onClick={() => onAddProduct?.(p, 1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-copper text-cream transition hover:bg-copper-dark" aria-label="أضف">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </Section>
                  )}

                  {results.stores.length > 0 && (
                    <Section title="متاجر">
                      {results.stores.map((s) => (
                        <button key={s.id} onClick={() => onSelectStore?.(s.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-right shadow-soft ring-1 ring-ink/5 transition hover:ring-copper/30 dark:bg-night-800 dark:ring-white/10">
                          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-beige/60 text-2xl dark:bg-night-700">
                            {s.logo ? <img src={s.logo} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <span>{emojiCat[s.category] || '🏪'}</span>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-body text-sm font-bold text-ink dark:text-cream">{s.name}</p>
                            <p className="truncate font-body text-xs text-ink/50 dark:text-cream/50">{s.tagline || s.category || 'متجر في السماوة'}</p>
                          </div>
                          <StoreIcon className="h-4 w-4 shrink-0 text-ink/30 dark:text-cream/30" />
                        </button>
                      ))}
                    </Section>
                  )}

                  {results.cats.length > 0 && (
                    <Section title="أقسام">
                      <div className="flex flex-wrap gap-2">
                        {results.cats.map((c) => (
                          <button key={c.name} onClick={() => onPickCategory?.(c.name)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-body text-sm font-bold text-ink ring-1 ring-ink/10 transition hover:ring-copper/40 dark:bg-night-800 dark:text-cream dark:ring-white/10">
                            <span>{c.emoji || '🏷️'}</span>{c.name}
                          </button>
                        ))}
                      </div>
                    </Section>
                  )}

                  {results.bundles.length > 0 && (
                    <Section title="باقات">
                      {results.bundles.map((b) => (
                        <button key={b.id} onClick={() => onOpenBundle?.(b)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-right shadow-soft ring-1 ring-ink/5 transition hover:ring-copper/30 dark:bg-night-800 dark:ring-white/10">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-beige/60 text-2xl dark:bg-night-700">🧺</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-body text-sm font-bold text-ink dark:text-cream">{b.name}</p>
                            <p className="font-body text-xs text-ink/50 dark:text-cream/50">{b.kicker || 'باقة'} · {fmt(b.price)} د.ع</p>
                          </div>
                        </button>
                      ))}
                    </Section>
                  )}
                </div>
              )}

              {/* no local matches (and not showing an AI panel) */}
              {results && totalResults === 0 && !ai && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-copper/10 text-copper"><ShoppingBasket className="h-8 w-8" /></span>
                  <p className="mt-4 font-display text-lg font-bold text-ink/70 dark:text-cream/70">ماكو نتيجة مباشرة لـ «{q.trim()}»</p>
                  <p className="mt-1 font-body text-sm text-ink/45 dark:text-cream/45">جرّب مساعد اطلبها فوق — يفهم الوصفات و المناسبات 👆</p>
                </div>
              )}

              {/* empty state: recent + prompt ideas */}
              {!q.trim() && !ai && (
                <div className="space-y-6">
                  {recent.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-body text-sm font-bold text-ink/60 dark:text-cream/60"><Clock className="h-4 w-4" /> بحثك الأخير</span>
                        <button onClick={clearRecent} className="font-body text-xs text-copper hover:underline dark:text-copper-light">مسح</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((t) => (
                          <button key={t} onClick={() => { setQ(t); setAi(null); }} className="rounded-full bg-white px-3.5 py-1.5 font-body text-sm text-ink ring-1 ring-ink/10 hover:ring-copper/40 dark:bg-night-800 dark:text-cream dark:ring-white/10">
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-copper/25 bg-gradient-to-bl from-brand-800/5 to-copper/5 p-4 dark:border-copper/25 dark:from-white/5 dark:to-white/5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-cream dark:bg-brand-600"><Sparkles className="h-5 w-5" /></span>
                      <div>
                        <p className="font-display text-sm font-black text-ink dark:text-cream">جديد: مساعد التسوّق الذكي</p>
                        <p className="font-body text-xs text-ink/55 dark:text-cream/55">اكتب شنو تريد تطبخ أو شنو تحتاج، و هو يجمعلك السلة</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PROMPTS.map((p) => (
                        <button key={p} onClick={() => runAssistant(p)} className="rounded-full bg-white px-3.5 py-1.5 font-body text-[13px] font-bold text-brand-800 ring-1 ring-brand-800/15 transition hover:bg-brand-800 hover:text-cream dark:bg-night-800 dark:text-cream dark:ring-white/10">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="mb-2 font-body text-sm font-black text-ink/60 dark:text-cream/60">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
