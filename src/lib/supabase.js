import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

// true only once the owner pastes real Supabase credentials into config.js
export const supabaseEnabled =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('XXXX') &&
  !SUPABASE_ANON_KEY.includes('XXXX');

// while not configured, supabase stays null and the UI degrades gracefully
export const supabase = supabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true, // keeps the customer logged in across visits
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
