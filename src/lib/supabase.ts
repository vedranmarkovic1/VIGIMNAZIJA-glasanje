import { createClient } from '@supabase/supabase-js';

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xsxrhjjwbukrcnpwmhoq.supabase.co';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzeHJoamp3YnVrcmNucHdtaG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDIwOTIsImV4cCI6MjEwNTQ3ODA5Mn0.LVS1YI59BTqmWfYMSUxDAl4gU1I1bi4ALCIuH5gprMg';

export const SUPABASE_URL = localStorage.getItem('parlament_supabase_url') || defaultUrl;
export const SUPABASE_ANON_KEY = localStorage.getItem('parlament_supabase_key') || defaultKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const updateSupabaseCredentials = (url: string, key: string) => {
  localStorage.setItem('parlament_supabase_url', url.trim());
  localStorage.setItem('parlament_supabase_key', key.trim());
  window.location.reload();
};
