import Link from 'next/link';
import CarChoiceCard from '@/components/CarChoiceCard';
import Notice from '@/components/Notice';
import StickyBar from '@/components/StickyBar';
import SubmitButton from '@/components/SubmitButton';
import { takeVehicle } from '@/lib/actions';
import { getRole } from '@/lib/auth';
import { getFleet } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function TakePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { role, name } = await getRole();
  const isAdmin = role === 'admin';

  const available = (await getFleet(supabase)).filter((c) => !c.is_out);
  const { data: drivers } = isAdmin
    ? await supabase.from('drivers').select('id, name').eq('status', 'active').order('name')
    : { data: [] as { id: string; name: string }[] };

  return (
    <>
      <Link href="/" className="text-lg font-bold text-navy underline underline-offset-4">Back</Link>
      <h1 className="mb-6 mt-3 text-3xl font-bold">Take a vehicle</h1>
      <Notice error={sp.error} />

      {available.length === 0 ? (
        <p className="card p-6 text-lg">No vehicle is available right now. Every vehicle on the list is out, or none have been added yet.</p>
      ) : isAdmin && (drivers ?? []).length === 0 ? (
        <p className="card p-6 text-lg">
          No drivers have been added yet. <Link href="/manage" className="font-bold text-navy underline">Add or approve drivers</Link> first.
        </p>
      ) : (
        <form action={takeVehicle} className="space-y-7">
          <div>
            <p className="label">1. Tap the vehicle you are taking</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {available.map((c) => (
                <CarChoiceCard key={c.id} name="vehicle_id" value={c.id} photo={c.photo_path} title={c.name} subtitle={c.plate_number} />
              ))}
            </div>
          </div>

          {isAdmin ? (
            <div>
              <label htmlFor="driver_id" className="label">2. Who is taking it?</label>
              <select id="driver_id" name="driver_id" required defaultValue="" className="field">
                <option value="" disabled>Choose a name</option>
                {(drivers ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="card p-4 text-lg">You are taking it as <strong>{name}</strong>.</p>
          )}

          <p className="hint">The date and time are recorded automatically.</p>
          <StickyBar>
            <SubmitButton pendingText="Saving..." className="btn-take">Confirm</SubmitButton>
          </StickyBar>
        </form>
      )}
    </>
  );
}
