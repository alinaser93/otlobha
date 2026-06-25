import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Check, Loader2, Phone, Mail, Cake, MapPin, Truck, Camera } from 'lucide-react';
import { uploadAvatar } from '../lib/storage.js';

/* ── Avatar: image if avatar_url, else gradient circle with initials ── */
export function Avatar({ name, url, size = 72, onPick, uploading }) {
  const initials = (name || '؟').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt={name || ''} className="h-full w-full rounded-full object-cover ring-2 ring-copper/40" />
      ) : (
        <div
          className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-copper to-brand-600 font-display font-black text-cream ring-2 ring-copper/30"
          style={{ fontSize: size * 0.36 }}
        >
          {initials}
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 grid place-items-center rounded-full bg-black/50">
          <Loader2 className="h-6 w-6 animate-spin text-cream" />
        </div>
      )}
      {onPick && !uploading && (
        <button
          type="button"
          onClick={onPick}
          className="absolute -bottom-1 -left-1 grid h-7 w-7 place-items-center rounded-full bg-copper text-cream shadow-card ring-2 ring-cream dark:ring-night-800"
          aria-label="تغيير الصورة"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-ink/55 dark:text-cream/55">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm text-ink outline-none transition focus:border-copper/50 dark:border-white/10 dark:bg-night-900 dark:text-cream';

/*
  Reusable professional profile editor.
  props:
    initial   : object with current values
    readOnly  : array of { label, value, icon } shown as non-editable
    areas     : optional array → renders an area <select> (customer)
    show      : { phone, phone2, email, birthdate, gender, area, address, vehicle }
    onSave    : async (fields) => ({ error? })
    onPickPhoto : optional () => void  (Batch C)
    title     : section title
*/
export default function ProfileForm({ initial = {}, readOnly = [], areas, show = {}, onSave, uploadPrefix, uploadId, onAvatarChange, title = 'الملف الشخصي' }) {
  const [f, setF] = useState({
    name: initial.name || '',
    phone: initial.phone || '',
    phone2: initial.phone2 || '',
    email: initial.email || '',
    birthdate: initial.birthdate || '',
    gender: initial.gender || '',
    area: initial.area || '',
    address: initial.address || '',
    vehicle: initial.vehicle || '',
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const canUpload = uploadPrefix && uploadId && onAvatarChange;

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking same file
    if (!file) return;
    setUploading(true); setErr('');
    const res = await uploadAvatar(file, uploadPrefix, uploadId);
    if (res?.error) { setUploading(false); setErr(res.error); return; }
    setAvatarUrl(res.url);
    const saveRes = await onAvatarChange(res.url); // persist to DB
    setUploading(false);
    if (saveRes?.error) setErr(saveRes.error);
  }

  async function save() {
    setBusy(true); setErr(''); setOk(false);
    const res = await onSave(f);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setOk(true);
    setTimeout(() => setOk(false), 2500);
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      )}
      {/* avatar + name header */}
      <div className="flex items-center gap-3">
        <Avatar
          name={f.name || initial.username}
          url={avatarUrl}
          uploading={uploading}
          onPick={canUpload ? () => fileRef.current?.click() : undefined}
        />
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-black text-ink dark:text-cream">{f.name || initial.username || 'بدون اسم'}</div>
          {initial.username && <div className="text-[12px] text-ink/45 dark:text-cream/45">@{initial.username}</div>}
          {canUpload && <div className="text-[11px] text-ink/40 dark:text-cream/40">اضغط الكاميرا لتغيير الصورة</div>}
        </div>
      </div>

      {/* read-only chips */}
      {readOnly.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {readOnly.map((r, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-2.5 py-1 text-[12px] text-ink/60 dark:bg-white/5 dark:text-cream/60">
              {r.icon && <r.icon className="h-3.5 w-3.5" />} {r.label}: <b className="text-ink/80 dark:text-cream/85">{r.value || '—'}</b>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field icon={User} label="الاسم الكامل">
          <input className={inputCls} value={f.name} onChange={set('name')} placeholder="الاسم" />
        </Field>

        {show.phone && (
          <Field icon={Phone} label="رقم الهاتف">
            <input className={inputCls} value={f.phone} onChange={set('phone')} placeholder="07XXXXXXXXX" inputMode="tel" />
          </Field>
        )}
        {show.phone2 && (
          <Field icon={Phone} label="هاتف إضافي (اختياري)">
            <input className={inputCls} value={f.phone2} onChange={set('phone2')} placeholder="07XXXXXXXXX" inputMode="tel" />
          </Field>
        )}
        {show.email && (
          <Field icon={Mail} label="البريد الإلكتروني (اختياري)">
            <input className={inputCls} value={f.email} onChange={set('email')} placeholder="example@mail.com" inputMode="email" dir="ltr" />
          </Field>
        )}
        {show.birthdate && (
          <Field icon={Cake} label="تاريخ الميلاد">
            <input type="date" className={inputCls} value={f.birthdate || ''} onChange={set('birthdate')} dir="ltr" />
          </Field>
        )}
        {show.gender && (
          <Field label="الجنس">
            <select className={inputCls} value={f.gender} onChange={set('gender')}>
              <option value="">—</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </Field>
        )}
        {show.vehicle && (
          <Field icon={Truck} label="نوع المركبة">
            <input className={inputCls} value={f.vehicle} onChange={set('vehicle')} placeholder="دراجة / سيارة ..." />
          </Field>
        )}
        {show.area && areas && (
          <Field icon={MapPin} label="المنطقة">
            <select className={inputCls} value={f.area} onChange={set('area')}>
              <option value="">اختر المنطقة</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
        )}
        {show.address && (
          <Field icon={MapPin} label="العنوان التفصيلي">
            <input className={inputCls} value={f.address} onChange={set('address')} placeholder="أقرب نقطة دالة" />
          </Field>
        )}
      </div>

      {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}

      <motion.button
        onClick={save} disabled={busy}
        whileTap={{ scale: 0.97 }}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-bold text-cream transition ${
          ok ? 'bg-green-600' : 'bg-copper hover:bg-copper-dark'
        } disabled:opacity-60`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : ok ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {ok ? 'تم الحفظ' : 'حفظ البيانات'}
      </motion.button>
    </div>
  );
}
