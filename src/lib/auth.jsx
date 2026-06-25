import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, supabaseEnabled } from './supabase.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const SESSION_KEY = 'otlobha-acct-id'; // persistent device session (account UUID acts as token)

// normalise a locally-typed Iraqi number to E.164 (+9647XXXXXXXXX) so logins always match
export function normalizePhone(raw) {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('964')) return '+' + d;
  if (d.startsWith('0')) d = d.slice(1);
  return '+964' + d;
}

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // restore the saved session on load (same device = auto login)
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let id = '';
    try {
      id = localStorage.getItem(SESSION_KEY) || '';
    } catch {}
    if (!id) {
      setLoading(false);
      return;
    }
    supabase
      .rpc('account_get', { p_id: id })
      .then(({ data }) => {
        if (data?.ok) setAccount(data.account);
        else
          try {
            localStorage.removeItem(SESSION_KEY);
          } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((acct) => {
    setAccount(acct);
    try {
      if (acct?.id) localStorage.setItem(SESSION_KEY, acct.id);
    } catch {}
  }, []);

  // create a new account (phone + 4-digit PIN + details). instant, no code.
  const signup = useCallback(
    async ({ phone, pin, name, area, address, ref }) => {
      if (!supabase) return { error: 'نظام الحسابات لم يُفعّل بعد.' };
      const { data, error } = await supabase.rpc('account_signup', {
        p_phone: normalizePhone(phone),
        p_pin: pin,
        p_name: name?.trim() || null,
        p_area: area || null,
        p_address: address?.trim() || null,
        p_ref: ref?.trim() || null,
      });
      if (error) return { error: error.message };
      if (!data?.ok) return { error: data?.msg || 'تعذّر إنشاء الحساب' };
      persist(data.account);
      return { account: data.account };
    },
    [persist]
  );

  // sign in on a new device (phone + PIN)
  const login = useCallback(
    async ({ phone, pin }) => {
      if (!supabase) return { error: 'نظام الحسابات لم يُفعّل بعد.' };
      const { data, error } = await supabase.rpc('account_login', {
        p_phone: normalizePhone(phone),
        p_pin: pin,
      });
      if (error) return { error: error.message };
      if (!data?.ok) return { error: data?.msg || 'تعذّر تسجيل الدخول' };
      persist(data.account);
      return { account: data.account };
    },
    [persist]
  );

  const updateProfile = useCallback(
    async (fields) => {
      if (!supabase || !account?.id) return { error: 'سجّل الدخول أولاً.' };
      const { data, error } = await supabase.rpc('account_update', {
        p_id: account.id,
        p_name: fields.name ?? null,
        p_area: fields.area ?? null,
        p_address: fields.address ?? null,
      });
      if (error) return { error: error.message };
      if (data?.ok) setAccount(data.account);
      return { error: data?.ok ? undefined : data?.msg };
    },
    [account]
  );

  const reload = useCallback(async () => {
    if (!supabase || !account?.id) return;
    const { data } = await supabase.rpc('account_get', { p_id: account.id });
    if (data?.ok) setAccount(data.account);
  }, [account]);

  const logout = useCallback(() => {
    setAccount(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const value = {
    enabled: supabaseEnabled,
    loading,
    account,
    signup,
    login,
    updateProfile,
    reload,
    logout,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
