import type { SupabaseClient } from '@supabase/supabase-js';
import type { Car } from './vehicle';

/** Every vehicle on the list with its current status (who has it, since when). */
export async function getFleet(supabase: SupabaseClient): Promise<Car[]> {
  const { data } = await supabase.rpc('fleet_status');
  return (data ?? []) as Car[];
}
