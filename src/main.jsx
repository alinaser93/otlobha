import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminPage from './components/AdminPage.jsx';
import DriverPage from './components/DriverPage.jsx';
import MerchantPage from './components/MerchantPage.jsx';
import OrderTrackingPage from './components/OrderTrackingPage.jsx';
import { AuthProvider } from './lib/auth.jsx';
import './index.css';

// routes: /admin , /driver , /merchant , /order/{id}  (+ ?admin / ?driver / ?merchant / ?order= fallbacks)
function route() {
  try {
    const path = window.location.pathname.replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (path === '/admin' || params.has('admin') || hash === '#admin') return 'admin';
    if (path === '/driver' || params.has('driver') || hash === '#driver') return 'driver';
    if (path === '/merchant' || params.has('merchant') || hash === '#merchant') return 'merchant';
    if (/^\/order\//.test(window.location.pathname) || params.has('order')) return 'order';
    return 'store';
  } catch {
    return 'store';
  }
}

const r = route();
const root = ReactDOM.createRoot(document.getElementById('root'));

let content;
if (r === 'admin') content = <AdminPage />;
else if (r === 'driver') content = <DriverPage />;
else if (r === 'merchant') content = <MerchantPage />;
else if (r === 'order') content = <OrderTrackingPage />;
else content = (
  <AuthProvider>
    <App />
  </AuthProvider>
);

root.render(<React.StrictMode>{content}</React.StrictMode>);
