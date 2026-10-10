import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client. Bypasses every security rule, so it is used for one thing only:
 * letting the administrator set a new password for a driver. Server code only.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
