import { createClient } from '@supabase/supabase-js';

// The anon key is a public, browser-safe key: access is enforced by the
// row-level security rules in supabase/migrations. Never put the service_role key here.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'not-configured');
