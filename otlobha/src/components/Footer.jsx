import { Leaf } from 'lucide-react';

const COLS = [
  { h: 'تسوّق', l: ['الخضار', 'الفواكه', 'المؤونة', 'الحلويات', 'الباقات الذكية'] },
  { h: 'اطلبها', l: ['من نحن', 'مناطق التوصيل', 'الوظائف', 'تواصل معنا'] },
  { h: 'المساعدة', l: ['الأسئلة الشائعة', 'سياسة الإرجاع', 'الخصوصية', 'الشروط'] },
];

export default function Footer() {
  return (
    <footer className="bg-brand-950 pt-16 text-cream/80">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-copper text-cream">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl font-extrabold text-cream">اطلبها</span>
            </div>
            <p className="mt-4 max-w-sm font-body leading-relaxed">
              متجرك العراقي للخضار والفواكه والمؤونة الأصيلة — نوصلها طازجة إلى باب بيتك كل يوم.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-cream/5 p-2 pr-4 sm:max-w-sm">
              <input
                className="flex-1 bg-transparent py-2 font-body text-sm text-cream placeholder:text-cream/40 focus:outline-none"
                placeholder="بريدك ليصلك كل جديد وعروض"
              />
              <button className="rounded-xl bg-copper px-4 py-2 font-display text-sm font-bold text-cream hover:bg-copper-dark">
                اشترك
              </button>
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.h}>
              <h4 className="font-display text-lg font-bold text-cream">{c.h}</h4>
              <ul className="mt-3 space-y-2 font-body text-sm">
                {c.l.map((x) => (
                  <li key={x}>
                    <a href="#" className="transition hover:text-copper-light">
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/10 py-6 font-body text-sm text-cream/50 sm:flex-row">
          <span>© ٢٠٢٥ اطلبها · Otlobha — جميع الحقوق محفوظة</span>
          <span className="flex items-center gap-3">
            <span className="rounded-lg bg-cream/10 px-3 py-1.5">دفع عند الاستلام</span>
            <span className="rounded-lg bg-cream/10 px-3 py-1.5">Mastercard</span>
            <span className="rounded-lg bg-cream/10 px-3 py-1.5">زين كاش</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
