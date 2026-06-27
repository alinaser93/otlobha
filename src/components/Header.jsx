import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ShoppingCart, Menu, X, MapPin, Sun, Moon, User, ChevronLeft } from 'lucide-react';
import InstallButton from './InstallButton.jsx';
import PushToggle from './PushToggle.jsx';
import { useAuth } from '../lib/auth.jsx';

const LINKS = ['الباقات', 'الخضار', 'الفواكه', 'المؤونة', 'عروض'];

// day / night switch — pure CSS (no animation lib), overflow-clipped so the knob can never leave the track
function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      dir="ltr"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label="تبديل الوضع الليلي"
      className={`relative h-7 w-[52px] shrink-0 overflow-hidden rounded-full border transition-colors duration-200 ${
        dark ? 'border-white/15 bg-brand-700' : 'border-copper-dark/40 bg-copper/85'
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-cream shadow transition-transform duration-200 ${
          dark ? 'translate-x-1' : 'translate-x-[26px]'
        }`}
      >
        {dark ? <Moon className="h-3 w-3 text-brand-800" /> : <Sun className="h-3 w-3 text-copper" />}
      </span>
    </button>
  );
}

export default function Header({ cartCount, bump, onCart, cartRef, dark, onToggleTheme, onAccount }) {
  const { account } = useAuth();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setSolid(y > 24));

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        solid ? 'bg-brand-900/95 shadow-soft backdrop-blur-md dark:bg-night/90' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand + theme switch — start (right in RTL) */}
        <div className="flex shrink-0 items-center gap-3">
          <a href="#" className="flex items-center gap-2.5">
            <img
              src="/icons/icon-192.png"
              alt="اطلبها"
              className="h-11 w-11 rounded-full object-cover shadow-seal"
            />
            <span className="leading-none">
              <span className="block font-display text-2xl font-extrabold text-cream">اطلبها</span>
              <span className="font-body text-[10px] tracking-[0.35em] text-copper-light">OTLOBHA</span>
            </span>
          </a>
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        </div>

        {/* Nav — desktop */}
        <nav className="hidden items-center gap-7 font-body text-[15px] text-cream/90 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l}
              href="#"
              className="relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-right after:scale-x-0 after:bg-copper-light after:transition-transform hover:text-copper-light hover:after:scale-x-100"
            >
              {l}
            </a>
          ))}
        </nav>

        {/* Actions — end (left in RTL) */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full bg-cream/10 px-3 py-1.5 text-[12px] text-cream/80 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-copper-light" /> السماوة
          </div>

          <button
            onClick={onAccount}
            className="grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream transition hover:bg-cream/20"
            aria-label="حسابي"
          >
            {account && account.name ? (
              <span className="font-display text-base font-black">{account.name.trim().charAt(0)}</span>
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>

          <motion.button
            ref={cartRef}
            onClick={onCart}
            whileTap={{ scale: 0.92 }}
            className="relative grid h-11 w-11 place-items-center rounded-full bg-copper text-cream shadow-seal hover:bg-copper-dark"
            aria-label="السلة"
          >
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: bump ? [1, 1.45, 1] : 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.45 }}
                  className="absolute -left-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-cream px-1 text-[12px] font-extrabold text-brand-900 ring-2 ring-brand-900 dark:ring-night"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream lg:hidden"
            aria-label="القائمة"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-cream/10 bg-brand-950 shadow-card dark:border-white/10 dark:bg-night-900 lg:hidden"
          >
            <div className="flex flex-col p-3 font-body">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l}
                  href="#"
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i + 0.05 }}
                  className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 font-display text-lg font-bold text-cream/90 transition-colors hover:bg-cream/10 active:bg-cream/15 ${
                    i !== LINKS.length - 1 ? 'border-b border-cream/5' : ''
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-copper transition-transform group-hover:scale-150" />
                    {l}
                  </span>
                  <ChevronLeft className="h-5 w-5 text-cream/30 transition-all group-hover:-translate-x-1 group-hover:text-copper-light" />
                </motion.a>
              ))}
              <div className="mt-2 space-y-2 px-1">
                <div className="rounded-2xl bg-cream/10 p-2.5">
                  <p className="mb-2 px-1 text-center text-[11px] font-bold text-cream/70">📢 وصلك إشعار بأحدث العروض والخصومات</p>
                  <PushToggle partyType="customer" partyId={null} />
                </div>
                <InstallButton />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
