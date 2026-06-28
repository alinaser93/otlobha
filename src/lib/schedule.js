// Scheduling helpers for "deliver later" — 2-hour delivery windows over the next 7 days.

export const SLOTS = [
  { id: 's9', h: 9, label: '٩ – ١١ ص' },
  { id: 's11', h: 11, label: '١١ ص – ١ ظ' },
  { id: 's13', h: 13, label: '١ – ٣ ع' },
  { id: 's15', h: 15, label: '٣ – ٥ ع' },
  { id: 's17', h: 17, label: '٥ – ٧ م' },
  { id: 's19', h: 19, label: '٧ – ٩ م' },
];

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Day chips for the next `count` days, starting today.
export function dayOptions(count = 7) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const label = i === 0 ? 'اليوم' : i === 1 ? 'غداً' : WEEKDAYS[d.getDay()];
    out.push({ offset: i, label, sub: `${d.getDate()}/${d.getMonth() + 1}`, date: d });
  }
  return out;
}

// Slots still bookable for a given day offset (today hides windows that already started).
export function availableSlots(offset) {
  if (offset !== 0) return SLOTS;
  const nowH = new Date().getHours();
  return SLOTS.filter((s) => s.h > nowH);
}

// Build the ISO timestamp for a chosen day offset + slot (local time → ISO).
export function buildScheduledISO(offset, slot) {
  if (!slot) return null;
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(slot.h, 0, 0, 0);
  return d.toISOString();
}

// Human label for a stored schedule, e.g. "غداً ٥ – ٧ م".
export function formatScheduled(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const that = new Date(d); that.setHours(0, 0, 0, 0);
  const diffDays = Math.round((that - today) / 86400000);
  const dayLabel = diffDays === 0 ? 'اليوم' : diffDays === 1 ? 'غداً' : `${WEEKDAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
  const slot = SLOTS.find((s) => s.h === d.getHours());
  return slot ? `${dayLabel} · ${slot.label}` : dayLabel;
}
