# اطلبها · Otlobha

A luxurious, mobile-first **Iraqi grocery & fresh-produce** landing page.
Built with **React + Vite + Tailwind CSS + Framer Motion**, fully **RTL** Arabic.

> Deep emerald (freshness) · warm beige (clean canvas for product PNGs) · copper CTAs · Cairo + Tajawal.

---

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the build
```

Node 18+ recommended.

---

## Add your assets

The project ships with emoji/CSS placeholders so it runs out of the box. Swap them for your real media:

### 1) Hero video (the cinematic slow-mo droplets)
- Put the file at **`public/media/hero-droplets.mp4`**.
- Open `src/components/Hero.jsx`, find the `<video>` tag, and uncomment the `src`:
  ```jsx
  <video ... src="/media/hero-droplets.mp4" />
  ```
- Once it plays you can delete the `.hero-fallback` / `.droplets` ambience `div` right below it.

### 2) Product PNGs (transparent backgrounds)
- Drop them in **`public/images/`** using the paths already defined in `src/data/catalog.js`
  (e.g. `pomegranate.png`, `figs.png`, `dates.png`, `eggplant.png`, `anbar-rice.png`, `pickles.png`, `molasses.png` …).
- In `src/components/ProductCard.jsx`, replace the placeholder orb with the commented `<img>` (it already
  uses `loading="lazy"`):
  ```jsx
  <img src={p.image} alt={p.name} loading="lazy" className="h-28 w-28 object-contain sm:h-32 sm:w-32" />
  ```
- Do the same for the bundle ingredient orbs in `src/components/BundleSection.jsx` if you want real PNGs
  in the “curated plate”.

All catalog content (names, prices, units, bundles) lives in **`src/data/catalog.js`** — edit it there.

---

## Structure

```
src/
├─ data/catalog.js        # products, categories, bundles, price formatter
├─ lib/motion.js          # shared Framer Motion variants + useFlyToCart()
├─ components/
│  ├─ Header.jsx          # sticky transparent → solid emerald, animated cart badge
│  ├─ Hero.jsx            # full-screen video + overlay + headline + CTAs
│  ├─ BundleSection.jsx   # باقات ذكية — signature curated-plate cards + copper seal
│  ├─ ProductGrid.jsx     # category pills + responsive grid
│  ├─ ProductCard.jsx     # quick-add on hover/tap + fly-to-cart
│  ├─ CartDrawer.jsx      # slide-in cart (RTL end)
│  ├─ ReferralModal.jsx   # viral referral popup + copy link
│  └─ Footer.jsx
└─ App.jsx                # composition, cart state, fly-to-cart, toast, auto-referral
```

## Notes
- **RTL**: set globally via `dir="rtl"` in `index.html`; layout uses flex/gap + logical spacing.
- **Bundles** (`لمة الدولمة العراقية`, `عصرية بغدادية`, `سلة الطبخ الأسبوعية`) and prices are in `catalog.js`.
- **Quick-add → fly-to-cart**: `useFlyToCart()` in `lib/motion.js` clones the product image into the cart icon.
- **Accessibility**: visible focus, `aria-label`s on icon buttons, and `prefers-reduced-motion` is respected (`src/index.css`).
- **Brand tokens**: colors, fonts, shadows live in `tailwind.config.js`.
