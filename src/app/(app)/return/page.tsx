import Link from 'next/link';
import Notice from '@/components/Notice';
import ReturnForm, { type OutCar } from '@/components/ReturnForm';
import { getRole } from '@/lib/auth';
import { getFleet } from '@/lib/data';
import { fmtDateTime } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';

export default async function ReturnPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { role, driverId, name } = await getRole();
  const isAdmin = role === 'admin';

  const fleet = await getFleet(supabase);
  const { data: drivers } = isAdmin ? await supabase.from('drivers').select('id, name, status').neq('status', 'pending').order('name') : { data: [] };

  const cars: OutCar[] = fleet
    .filter((c) => c.is_out && c.movement_id)
    .map((c) => ({
      movement_id: c.movement_id!,
      photo_path: c.photo_path,
      name: c.name,
      plate_number: c.plate_number,
      taken_by_id: c.taken_by_id!,
      taken_by_name: c.taken_by_name ?? '',
      since: fmtDateTime(c.taken_at!),
      mine: !!driverId && c.taken_by_id === driverId,
    }))
    .sort((a, b) => Number(b.mine) - Number(a.mine)); // the driver's own cars first

  return (
    <>
      <Link href="/" className="text-lg font-bold text-navy underline underline-offset-4">Back</Link>
      <h1 className="mb-6 mt-3 text-3xl font-bold">Return a vehicle</h1>
      <Notice error={sp.error} />

      {cars.length === 0 ? (
        <p className="card p-6 text-lg">No vehicle is out right now, so there is nothing to return.</p>
      ) : (
        <ReturnForm cars={cars} drivers={drivers ?? []} isAdmin={isAdmin} myName={name} />
      )}
    </>
  );
}
