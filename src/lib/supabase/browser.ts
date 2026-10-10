import { createBrowserClient } from '@supabase/ssr';

/** Used only for uploading car photos straight from the browser. */
export const createBrowserSupabase = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
