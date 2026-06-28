import { ArrowRight, Info, FileText, ShieldCheck, HelpCircle, RotateCcw, MessageCircle, MapPin, Briefcase, Sparkles } from 'lucide-react';
import { SHOP_NAME, CITY, WHATSAPP_NUMBER, AREAS, SETTINGS } from '../config.js';
import Footer from './Footer.jsx';

const wa = `https://wa.me/${WHATSAPP_NUMBER}`;
const fee = (SETTINGS.delivery_fee || 2000).toLocaleString('en-US');
const extra = (SETTINGS.delivery_extra_store || 500).toLocaleString('en-US');

// content for every info page, keyed by slug
const PAGES = {
  about: {
    icon: Info, title: 'من نحن',
    intro: `«${SHOP_NAME}» سوق إلكتروني عراقي يجمع أفضل متاجر ${CITY} في مكان واحد — نوصّل لك الخضار والفواكه والمؤونة واحتياجات البيت طازجة إلى باب دارك.`,
    sections: [
      { h: 'فكرتنا', p: `بدل ما تلفّ على عدّة محلات، تتسوّق من أكثر من متجر بطلب واحد، وتدفع نقداً عند الاستلام، ويوصلك كل شي بأجرة توصيل واحدة محسوبة بإنصاف.` },
      { h: 'رؤيتنا', p: `نسهّل التسوّق اليومي لأهل ${CITY}، وندعم المتاجر المحلية حتى توصل لأكبر عدد من الزبائن بأقل جهد.` },
      { h: 'ليش تختار ' + SHOP_NAME, items: [
        'تسوّق من عدّة متاجر بطلب واحد',
        'أسعار المتجر نفسها — بدون مبالغة',
        'دفع نقدي مريح عند الاستلام',
        'تتبّع طلبك لحظة بلحظة حتى باب دارك',
        'تقييمات حقيقية من زبائن استلموا فعلاً',
      ] },
    ],
  },
  terms: {
    icon: FileText, title: 'شروط الاستخدام',
    intro: `باستخدامك تطبيق «${SHOP_NAME}» وتقديم طلب، فإنك توافق على الشروط التالية.`,
    sections: [
      { h: 'الطلبات والأسعار', p: 'الأسعار معروضة بالدينار العراقي وقد تتغيّر حسب المتجر والتوفّر. يُعتمد السعر الظاهر وقت تأكيد الطلب. نبذل أقصى جهد لدقّة المعلومات والصور، لكن قد تحصل اختلافات بسيطة.' },
      { h: 'الدفع', p: 'الدفع حالياً نقداً عند الاستلام. جهّز المبلغ للمندوب عند وصول الطلب.' },
      { h: 'التوصيل والأجور', p: `نخدم ${CITY} وأحياءها وأقضيتها. تبدأ أجرة التوصيل من ${fee} دينار للمتجر الواحد، ويُضاف ${extra} دينار لكل متجر إضافي ضمن نفس الطلب.` },
      { h: 'الإلغاء والتعديل', p: 'تقدر تلغي أو تعدّل طلبك قبل أن يبدأ المتجر بتجهيزه. بعد التجهيز أو خروج المندوب قد لا يكون الإلغاء ممكناً.' },
      { h: 'حسابك', p: 'أنت مسؤول عن دقّة اسمك ورقم هاتفك وعنوانك، لأنها أساس وصول طلبك. حافظ على سرّية بيانات دخولك.' },
      { h: 'الاستخدام المقبول', p: 'يُمنع استخدام المنصّة لطلبات وهمية أو مزعجة أو لأي غرض غير قانوني. نحتفظ بحق إيقاف أي حساب يسيء الاستخدام.' },
      { h: 'حدود المسؤولية', p: 'نسعى لتقديم خدمة موثوقة، لكننا لا نتحمّل مسؤولية تأخير أو ظروف خارجة عن إرادتنا. لأي مشكلة، تواصل معنا ونحلّها بأسرع وقت.' },
    ],
  },
  privacy: {
    icon: ShieldCheck, title: 'سياسة الخصوصية',
    intro: `خصوصيتك تهمّنا. هنا نوضّح بكل شفافية ما نجمعه من معلومات وكيف نستخدمها.`,
    sections: [
      { h: 'المعلومات التي نجمعها', items: [
        'الاسم ورقم الهاتف — للتواصل وتأكيد الطلب',
        'العنوان والموقع — لإيصال الطلب بدقّة',
        'سجلّ طلباتك — لمتابعة الطلب وخدمتك أفضل',
      ] },
      { h: 'كيف نستخدمها', p: 'نستخدم بياناتك حصراً لتنفيذ طلبك، والتواصل معك بخصوصه، وتحسين تجربتك داخل التطبيق. لا نرسل لك رسائل مزعجة.' },
      { h: 'المشاركة', p: 'نشارك الحدّ الأدنى الضروري فقط مع المتجر والمندوب لإتمام توصيل طلبك. لا نبيع بياناتك ولا نشاركها مع أي جهة إعلانية.' },
      { h: 'الأمان', p: 'نحمي بياناتك ونخزّنها بشكل آمن، ولا يصل إليها إلا من يحتاجها لخدمتك.' },
      { h: 'حقوقك', p: 'تقدر تطلب الاطّلاع على بياناتك أو تعديلها أو حذفها في أي وقت عبر التواصل معنا.' },
    ],
  },
  faq: {
    icon: HelpCircle, title: 'الأسئلة الشائعة',
    intro: 'أكثر الأسئلة التي تردنا — وإذا ما لقيت جوابك، تواصل معنا.',
    sections: [
      { h: 'شلون أطلب؟', p: 'تصفّح المتاجر والمنتجات، أضِف ما يعجبك إلى السلّة، ثم أكمل الطلب وأدخل عنوانك. بهاي البساطة.' },
      { h: 'شنو طرق الدفع؟', p: 'حالياً الدفع نقداً عند الاستلام — جهّز المبلغ للمندوب.' },
      { h: 'بأي وقت يوصل طلبي؟', p: 'عادةً خلال ساعات من نفس اليوم حسب المتجر ومنطقتك. تقدر تتابع حالة طلبك مباشرة من التطبيق.' },
      { h: 'أي مناطق تخدمون؟', p: `نخدم ${CITY} وأحياءها وأقضيتها. شوف صفحة «مناطق التوصيل» للتفاصيل.` },
      { h: 'أقدر أطلب من أكثر من متجر؟', p: 'نعم! تقدر تجمع منتجات من عدّة متاجر بطلب واحد وأجرة توصيل واحدة محسوبة.' },
      { h: 'وإذا صار خطأ بالطلب؟', p: 'راجع «سياسة الإرجاع» أو تواصل معنا فوراً عبر واتساب ونصلّح الموضوع.' },
    ],
  },
  returns: {
    icon: RotateCcw, title: 'سياسة الإرجاع والاستبدال',
    intro: 'رضاك أولاً. لأن أغلب منتجاتنا طازجة، نتّبع سياسة واضحة وعادلة.',
    sections: [
      { h: 'افحص عند الاستلام', p: 'ننصحك تتأكّد من طلبك أمام المندوب وقت التسليم. إذا في شي ناقص أو غير مطابق، بلّغ فوراً.' },
      { h: 'منتج تالف أو خاطئ', p: 'إذا وصلك منتج تالف أو غير الذي طلبته، تواصل معنا ونستبدله أو نعيد قيمته دون عناء.' },
      { h: 'مدة الإبلاغ', p: 'للمنتجات الطازجة، بلّغنا في نفس يوم الاستلام لنتمكّن من معالجة طلبك بسرعة.' },
      { h: 'شلون تبلّغ؟', p: 'أسهل طريقة عبر واتساب — أرسل لنا رقم طلبك ووصف المشكلة وصورة إن أمكن.' },
    ],
  },
  contact: {
    icon: MessageCircle, title: 'تواصل معنا',
    intro: 'إحنا قريبون منك. لأي استفسار أو مساعدة أو ملاحظة، لا تتردّد.',
    sections: [
      { h: 'واتساب', p: 'أسرع طريقة للوصول إلينا — اضغط الزر بالأسفل وراح نردّ عليك بأقرب وقت.', whatsapp: true },
      { h: 'المدينة', p: `نخدم ${CITY} وأحياءها وأقضيتها.` },
      { h: 'أوقات الخدمة', p: 'نستقبل طلباتك واستفساراتك يومياً خلال ساعات عمل المتاجر.' },
    ],
  },
  delivery: {
    icon: MapPin, title: 'مناطق التوصيل',
    intro: `نوصّل إلى ${CITY} وأحياءها وأقضيتها. إذا منطقتك مو بالقائمة، تواصل معنا ونرتّبها.`,
    sections: [
      { h: 'الأحياء والمناطق', areas: true },
      { h: 'أجور التوصيل', p: `تبدأ من ${fee} دينار للمتجر الواحد، ويُضاف ${extra} دينار لكل متجر إضافي ضمن نفس الطلب — مع حدّ أقصى عادل للأجور.` },
    ],
  },
  careers: {
    icon: Briefcase, title: 'انضمّ إلينا',
    intro: `${SHOP_NAME} يكبر، وندوّر على شركاء يكبرون وياّنا.`,
    sections: [
      { h: 'مندوب توصيل', p: 'عندك دراجة أو سيارة ووقت فاضي؟ انضمّ لفريق مندوبينا واكسب من توصيل الطلبات في منطقتك.' },
      { h: 'سجّل متجرك', p: `عندك محل خضار أو مؤونة أو حلويات في ${CITY}؟ اعرض منتجاتك على آلاف الزبائن من دون تكاليف بداية.` },
      { h: 'كيف تبدأ؟', p: 'تواصل معنا عبر واتساب وراح نوضّح لك الخطوات بكل بساطة.', whatsapp: true },
    ],
  },
};

function Section({ s }) {
  return (
    <div>
      <h2 className="font-display text-lg font-extrabold text-ink dark:text-cream">{s.h}</h2>
      {s.p && <p className="mt-2 font-body leading-relaxed text-ink/70 dark:text-cream/70">{s.p}</p>}
      {s.items && (
        <ul className="mt-2 space-y-1.5">
          {s.items.map((it) => (
            <li key={it} className="flex items-start gap-2 font-body text-ink/70 dark:text-cream/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
      {s.areas && (
        <div className="mt-3 flex flex-wrap gap-2">
          {AREAS.filter((a) => !a.startsWith('أخرى')).map((a) => (
            <span key={a} className="rounded-full bg-beige/60 px-3 py-1.5 font-body text-sm text-ink/75 dark:bg-white/5 dark:text-cream/75">{a}</span>
          ))}
        </div>
      )}
      {s.whatsapp && (
        <a href={wa} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-copper px-5 py-3 font-display font-bold text-cream shadow-soft transition hover:bg-copper-dark">
          <MessageCircle className="h-5 w-5" /> راسلنا على واتساب
        </a>
      )}
    </div>
  );
}

export default function InfoPage({ slug }) {
  const page = PAGES[slug] || PAGES.about;
  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-cream dark:bg-night-900" dir="rtl">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/90 backdrop-blur dark:border-white/5 dark:bg-night-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/icons/icon-192.png" alt={SHOP_NAME} className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-xl font-extrabold text-ink dark:text-cream">{SHOP_NAME}</span>
          </a>
          <a href="/" className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3.5 py-2 font-display text-sm font-bold text-ink/70 transition hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">
            العودة للمتجر <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* content */}
      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-copper/15 text-copper-dark dark:text-copper-light">
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-ink dark:text-cream">{page.title}</h1>
        </div>

        <p className="mb-7 font-body text-lg leading-relaxed text-ink/75 dark:text-cream/75">{page.intro}</p>

        <div className="space-y-6 rounded-3xl bg-white/60 p-6 shadow-card dark:bg-night-800/60 sm:p-8">
          {page.sections.map((s, i) => <Section key={i} s={s} />)}
        </div>

        {/* quick links to the other pages */}
        <div className="mt-8 flex flex-wrap gap-2">
          {Object.entries(PAGES).filter(([k]) => k !== slug).map(([k, p]) => (
            <a key={k} href={`/${k}`}
              className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3.5 py-2 font-display text-sm font-bold text-ink/60 transition hover:bg-copper hover:text-cream dark:bg-white/10 dark:text-cream/60">
              {p.title}
            </a>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
