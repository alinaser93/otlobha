import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminPage from './components/AdminPage.jsx';
import { AuthProvider } from './lib/auth.jsx';
import './index.css';

function isAdminRoute() {
  try {
    const path = window.location.pathname.replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    return path === '/admin' || params.has('admin') || window.location.hash === '#admin';
  } catch {
    return false;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {isAdminRoute() ? (
      <AdminPage />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
