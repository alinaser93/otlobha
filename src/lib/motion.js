import { useCallback, useRef } from 'react';

// ── Reusable scroll-reveal variants (used with whileInView) ──
export const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] },
  }),
};

export const viewportOnce = { once: true, amount: 0.18 };

// ── fly-to-cart engine ──
// Returns a ref to attach to the cart button, and a `fly(sourceEl)` fn
// that clones the product image and animates it into the cart icon.
export function useFlyToCart() {
  const cartRef = useRef(null);

  const fly = useCallback((sourceEl) => {
    if (!sourceEl || !cartRef.current) return;

    const s = sourceEl.getBoundingClientRect();
    const c = cartRef.current.getBoundingClientRect();
    const size = Math.min(64, s.width || 56);

    const node = sourceEl.cloneNode(true);
    node.classList.add('fly-clone');
    node.style.width = size + 'px';
    node.style.height = size + 'px';
    node.style.left = s.left + s.width / 2 - size / 2 + 'px';
    node.style.top = s.top + s.height / 2 - size / 2 + 'px';
    node.style.fontSize = '26px';
    document.body.appendChild(node);

    requestAnimationFrame(() => {
      const dx = c.left + c.width / 2 - (s.left + s.width / 2);
      const dy = c.top + c.height / 2 - (s.top + s.height / 2);
      node.style.transform = `translate(${dx}px, ${dy}px) scale(0.25)`;
      node.style.opacity = '0.2';
    });

    setTimeout(() => node.remove(), 900);
  }, []);

  return { cartRef, fly };
}
