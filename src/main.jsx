import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminPage from './components/AdminPage.jsx';
import DriverPage from './components/DriverPage.jsx';
import { AuthProvider } from './lib/auth.jsx';
import './index.css';

// secret routes: /admin and /driver (also support ?admin / ?driver as fallbacks)
function route() {
  try {
    const path = window.location.pathname.replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (path === '/admin' || params.has('admin') || hash === '#admin') return 'admin';
    if (path === '/driver' || params.has('driver') || hash === '#driver') return 'driver';
    return 'store';
  } catch {
    return 'store';
  }
}

const r = route();
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {r === 'admin' ? (
      <AdminPage />
    ) : r === 'driver' ? (
      <DriverPage />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
