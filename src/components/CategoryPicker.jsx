import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';

/*
  Mobile-friendly category picker (replaces native <datalist>, which does not
  open reliably on phones). Lets the user pick a saved option OR type a new one.

  props:
    value       current category string
    onChange    (newValue) => void
    options     string[] of saved categories
    allowNew    allow typing a brand-new category (default true)
    placeholder shown when empty
*/
export default function CategoryPicker({ value, onChange, options = [], allowNew = true, placeholder = 'اختر التصنيف' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); } }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const all = Array.from(new Set((options || []).filter(Boolean)));
  const needle = q.trim();
  const filtered = needle ? all.filter((o) => o.includes(needle)) : all;
  const canAddNew = allowNew && needle && !all.some((o) => o === needle);

  function pick(v) { onChange(v); setOpen(false); setQ(''); }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream">
        <span className={value ? '' : 'text-ink/40 dark:text-cream/40'}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink/40 transition dark:text-cream/40 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-[130] mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-ink/10 bg-cream p-1.5 shadow-card dark:border-white/10 dark:bg-night-800">
          {allowNew && (
            <div className="mb-1.5 flex gap-1.5">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث أو تصنيف جديد…"
                className="min-w-0 flex-1 rounded-lg border border-ink/10 bg-beige px-2.5 py-2 text-sm text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream"
                onKeyDown={(e) => { if (e.key === 'Enter' && canAddNew) { e.preventDefault(); pick(needle); } }} />
              {canAddNew && (
                <button type="button" onClick={() => pick(needle)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-copper px-2.5 text-xs font-bold text-cream">
                  <Plus className="h-3.5 w-3.5" /> أضف
                </button>
              )}
            </div>
          )}

          {filtered.length === 0 && !canAddNew && (
            <div className="px-2 py-3 text-center text-xs text-ink/40 dark:text-cream/40">لا توجد تصنيفات — اكتب واحداً جديداً</div>
          )}

          {filtered.map((o) => (
            <button key={o} type="button" onClick={() => pick(o)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-right text-sm transition ${
                value === o ? 'bg-copper/15 font-bold text-copper-dark dark:text-copper-light' : 'text-ink hover:bg-ink/5 dark:text-cream dark:hover:bg-white/5'
              }`}>
              <span>{o}</span>
              {value === o && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
