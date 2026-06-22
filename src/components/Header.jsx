import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Leaf, ShoppingCart, Menu, X, MapPin, Sun, Moon } from 'lucide-react';

const LINKS = ['الباقات', 'الخضار', 'الفواكه', 'المؤونة', 'عروض'];

// day / night switch
function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label="تبديل الوضع الليلي"
      className="relative inline-flex h-8 w-[58px] shrink-0 items-center rounded-full border border-cream/20 bg-brand-950/40 px-1 backdrop-blur transition-colors"
    >
      <Sun className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-copper-light" />
      <Moon className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-cream/60" />
      <motion.span
        className="z-10 grid h-6 w-6 place-items-center rounded-full bg-cream shadow"
        animate={{ x: dark ? 0 : 26 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      >
        {dark ? <Moon className="h-3.5 w-3.5 text-brand-900" /> : <Sun className="h-3.5 w-3.5 text-copper" />}
      </motion.span>
    </button>
  );
}

export default function Header({ cartCount, bump, onCart, cartRef, dark, onToggleTheme }) {
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
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-copper text-cream shadow-seal">
              <Leaf className="h-5 w-5" />
            </span>
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
            <MapPin className="h-3.5 w-3.5 text-copper-light" /> بغداد · الكرّادة
          </div>

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
            className="overflow-hidden bg-brand-900/98 backdrop-blur-md dark:bg-night/95 lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 pb-4 font-body text-cream">
              {LINKS.map((l) => (
                <a key={l} href="#" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-lg hover:bg-cream/10">
                  {l}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
