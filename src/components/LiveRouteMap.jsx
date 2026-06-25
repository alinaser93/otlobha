import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* branded markers via divIcon (avoids leaflet's broken default icon paths) */
const driverIcon = L.divIcon({
  className: '',
  html: `<div style="display:grid;place-items:center;width:42px;height:42px;border-radius:50%;
    background:#C17C4F;color:#fff;font-size:20px;box-shadow:0 4px 12px rgba(0,0,0,.35);
    border:3px solid #fff;">🚗</div>`,
  iconSize: [42, 42], iconAnchor: [21, 21],
});
const homeIcon = L.divIcon({
  className: '',
  html: `<div style="display:grid;place-items:center;width:40px;height:40px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);background:#0E7C5A;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.35);
    border:3px solid #fff;"><span style="transform:rotate(45deg);font-size:18px;">🏠</span></div>`,
  iconSize: [40, 40], iconAnchor: [20, 38],
});

function haversineKm(a, b) {
  const R = 6371, toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function LiveRouteMap({ driver, customer, height = 260 }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layers = useRef({});
  const [eta, setEta] = useState(null); // { minutes, km, approx }

  // init map once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;
    // leaflet needs a size recalculation after mount
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; layers.current = {}; };
  }, []);

  // update markers + route when coordinates change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driver) return;

    // driver marker
    if (!layers.current.driver) layers.current.driver = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(map);
    else layers.current.driver.setLatLng([driver.lat, driver.lng]);

    // customer marker
    if (customer) {
      if (!layers.current.home) layers.current.home = L.marker([customer.lat, customer.lng], { icon: homeIcon }).addTo(map);
      else layers.current.home.setLatLng([customer.lat, customer.lng]);
    }

    // fit view
    if (customer) {
      map.fitBounds([[driver.lat, driver.lng], [customer.lat, customer.lng]], { padding: [45, 45], maxZoom: 16 });
    } else {
      map.setView([driver.lat, driver.lng], 15);
    }

    // route via OSRM (free, no key) with graceful fallback
    let cancelled = false;
    async function route() {
      if (!customer) return;
      const drawLine = (latlngs, dashed) => {
        if (layers.current.line) { map.removeLayer(layers.current.line); }
        layers.current.line = L.polyline(latlngs, {
          color: '#C17C4F', weight: 5, opacity: 0.9, dashArray: dashed ? '8 10' : null, lineJoin: 'round',
        }).addTo(map);
      };
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${driver.lng},${driver.lat};${customer.lng},${customer.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        const r = data?.routes?.[0];
        if (!r) throw new Error('no route');
        drawLine(r.geometry.coordinates.map(([lng, lat]) => [lat, lng]), false);
        setEta({ minutes: Math.max(1, Math.round(r.duration / 60)), km: r.distance / 1000, approx: false });
      } catch {
        if (cancelled) return;
        // fallback: straight dashed line + city-speed estimate (~25 km/h)
        drawLine([[driver.lat, driver.lng], [customer.lat, customer.lng]], true);
        const km = haversineKm(driver, customer);
        setEta({ minutes: Math.max(1, Math.round((km / 25) * 60)), km, approx: true });
      }
    }
    route();
    return () => { cancelled = true; };
  }, [driver?.lat, driver?.lng, customer?.lat, customer?.lng]);

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-ink/10 dark:ring-white/10" style={{ height }}>
      <div ref={elRef} className="h-full w-full" />
      {eta && (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl bg-brand-900/90 px-3 py-2 font-display text-cream shadow-card backdrop-blur">
          <div className="text-[11px] text-cream/70">وقت الوصول التقريبي</div>
          <div className="text-lg font-black leading-tight">
            {eta.approx ? '~' : ''}{eta.minutes} دقيقة
            <span className="mr-1.5 text-xs font-bold text-cream/70">· {eta.km.toFixed(1)} كم</span>
          </div>
        </div>
      )}
    </div>
  );
}
