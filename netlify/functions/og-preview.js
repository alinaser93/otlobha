// اطلبها — معاينة غنية (Open Graph) للروابط المشاركة.
// الروبوتات (واتساب/فيسبوك/تيليغرام) تحصل على عنوان+وصف+صورة مخصّصة لكل متجر/منتج/فئة.
// البشر يحصلون على التطبيق عادي (HTML مخزّن) بأقصى سرعة.
const SUPABASE_URL = 'https://tzruqvplazcwwhpmgdje.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cnVxdnBsYXpjd3docG1nZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODcwMTcsImV4cCI6MjA5Nzg2MzAxN30.rXfhNjLq99OyPTEVMHgSaodoldCb44UQu0e0dP6wrFE';

let cachedHtml = null;
let cachedAt = 0;

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function getBaseHtml(host) {
  const now = Date.now();
  if (cachedHtml && now - cachedAt < 300000) return cachedHtml;
  const res = await fetch('https://' + host + '/index.html');
  const html = await res.text();
  cachedHtml = html; cachedAt = now;
  return html;
}

async function fetchOne(table, query) {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
    });
    const arr = await res.json();
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  } catch (e) { return null; }
}

exports.handler = async function (event) {
  const host = (event.headers && event.headers.host) || 'otlobha.netlify.app';
  const q = event.queryStringParameters || {};
  const type = q.type || '';
  const key = q.key || '';
  const decoded = (() => { try { return decodeURIComponent(key); } catch (e) { return key; } })();
  const ua = ((event.headers && event.headers['user-agent']) || '').toLowerCase();
  const isCrawler = /facebookexternalhit|whatsapp|twitterbot|telegrambot|linkedinbot|pinterest|slackbot|discordbot|googlebot|bingbot|embedly|redditbot|facebot|vkshare|w3c_validator|skypeuripreview|bot\b/.test(ua);

  let html;
  try { html = await getBaseHtml(host); }
  catch (e) {
    return { statusCode: 302, headers: { Location: '/?' + (type === 'store' ? 's' : type === 'product' ? 'p' : 'c') + '=' + encodeURIComponent(decoded) }, body: '' };
  }

  // نحقن وسوم المعاينة دائماً (للجميع) — أضمن من الاعتماد على كشف الروبوت
  let title = 'اطلبها · Otlobha — متجرك العراقي الطازج';
  let desc = 'خضار وفواكه ومؤونة طازجة توصل لباب بيتك في السماوة. اطلبها الآن.';
  let image = 'https://' + host + '/icons/icon-512.png';
  let ogUrl = 'https://' + host + '/';

  try {
    if (type === 'store') {
      const s = await fetchOne('stores', 'name=eq.' + encodeURIComponent(decoded) + '&active=eq.true&select=name,tagline,logo,cover');
      if (s) { title = s.name + ' · اطلبها'; desc = s.tagline || ('تسوّق من ' + s.name + ' على اطلبها — توصيل سريع في السماوة.'); image = s.cover || s.logo || image; }
      ogUrl = 'https://' + host + '/s/' + encodeURIComponent(decoded);
    } else if (type === 'product') {
      const p = await fetchOne('products', 'id=eq.' + encodeURIComponent(decoded) + '&select=name,price,image,description,unit');
      if (p) {
        title = p.name + ' · اطلبها';
        const pr = p.price ? (' — ' + Number(p.price).toLocaleString('en') + ' د.ع' + (p.unit ? '/' + p.unit : '')) : '';
        desc = (p.description || ('اطلب ' + p.name + ' من اطلبها')) + pr;
        image = p.image || image;
      }
      ogUrl = 'https://' + host + '/p/' + encodeURIComponent(decoded);
    } else if (type === 'bundle') {
      const x = await fetchOne('bundles', 'id=eq.' + encodeURIComponent(decoded) + '&select=name,kicker,description,image,price,old_price');
      if (x) {
        title = x.name + ' · اطلبها';
        const pr = x.price ? (' — ' + Number(x.price).toLocaleString('en') + ' د.ع') : '';
        desc = (x.kicker || x.description || ('باقة ' + x.name + ' في اطلبها')) + pr;
        image = x.image || image;
      }
      ogUrl = 'https://' + host + '/b/' + encodeURIComponent(decoded);
    } else if (type === 'category') {
      const c = await fetchOne('categories', 'name=eq.' + encodeURIComponent(decoded) + '&select=name,image');
      title = decoded + ' · اطلبها';
      desc = 'تصفّح قسم ' + decoded + ' على اطلبها — توصيل سريع في السماوة.';
      if (c && c.image) image = c.image;
      ogUrl = 'https://' + host + '/c/' + encodeURIComponent(decoded);
    }
  } catch (e) { /* defaults */ }

  const T = esc(title), D = esc(desc), I = esc(image), U = esc(ogUrl);
  html = html
    .replace(/<title>[^<]*<\/title>/i, '<title>' + T + '</title>')
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, '$1' + T + '$2')
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, '$1' + D + '$2')
    .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/i, '$1' + I + '$2')
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, '$1' + U + '$2')
    .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, '$1' + T + '$2')
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, '$1' + D + '$2')
    .replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i, '$1' + I + '$2');

  return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' }, body: html };
};
