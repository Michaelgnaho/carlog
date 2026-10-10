import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type Role = 'admin' | 'driver' | 'pending' | 'none';

/** Who is signed in, and what are they allowed to do? */
export const getRole = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as Role | null, driverId: null as string | null, name: '' };

  const { data } = await supabase.rpc('my_profile');
  const row = Array.isArray(data) ? data[0] : null;
  return {
    user,
    role: ((row?.role as Role | undefined) ?? 'none') as Role,
    driverId: (row?.driver_id as string | null) ?? null,
    name: (row?.driver_name as string | null) ?? user.email ?? '',
  };
});
