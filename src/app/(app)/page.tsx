import Link from 'next/link';
import Notice from '@/components/Notice';
import VehiclePhoto from '@/components/VehiclePhoto';
import { getRole } from '@/lib/auth';
import { getFleet } from '@/lib/data';
import { fmtDateTime } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { role } = await getRole();
  const isAdmin = role === 'admin';

  const [fleet, pending] = await Promise.all([
    getFleet(supabase),
    isAdmin ? supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
  ]);

  const out = fleet.filter((c) => c.is_out);
  const available = fleet.length - out.length;
  const waiting = pending.count ?? 0;

  return (
    <>
      <Notice error={sp.error} ok={sp.ok} />

      {isAdmin && waiting > 0 && (
        <Link href="/manage#approvals" className="mb-6 block rounded-2xl border-2 border-signal bg-signal/20 px-5 py-4 text-lg font-bold text-navy">
          {waiting} {waiting === 1 ? 'driver is' : 'drivers are'} waiting for your approval. Tap here to review.
        </Link>
      )}

      <h1 className="mb-6 text-3xl font-bold">Vehicle Movement Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="card border-ok/40 bg-ok-soft p-5 text-center">
          <p className="text-lg font-bold text-ok">Available</p>
          <p className="text-6xl font-bold leading-tight text-ok">{available}</p>
        </div>
        <div className="card border-away/40 bg-away-soft p-5 text-center">
          <p className="text-lg font-bold text-away">Currently Out</p>
          <p className="text-6xl font-bold leading-tight text-away">{out.length}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Link href="/take" className="btn-take">TAKE A VEHICLE</Link>
        <Link href="/return" className="btn-return">RETURN A VEHICLE</Link>
      </div>

      <p className="mt-6 text-center">
        <Link href="/history" className="text-xl font-bold text-navy underline underline-offset-4">
          {isAdmin ? 'View Vehicle Records' : 'View my trips'}
        </Link>
      </p>

      <section className="mt-10" aria-labelledby="fleet">
        <h2 id="fleet" className="mb-3 text-xl font-bold">All vehicles</h2>
        {fleet.length === 0 ? (
          <p className="card p-5 text-lg text-ink/70">No vehicles have been added yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {fleet.map((c) => (
              <li key={c.id} className="card overflow-hidden">
                <VehiclePhoto path={c.photo_path} alt={c.name} className="aspect-[4/3] w-full" />
                <div className="p-3">
                  <p className="text-lg font-bold leading-tight">{c.name}</p>
                  <p className="text-base text-ink/70">{c.plate_number}</p>
                  {c.is_out ? (
                    <p className="mt-2 rounded-lg bg-away-soft px-3 py-2 text-base font-bold text-away">
                      Out: {c.taken_by_name}
                      <span className="block font-normal">since {fmtDateTime(c.taken_at!)}</span>
                    </p>
                  ) : (
                    <p className="mt-2 rounded-lg bg-ok-soft px-3 py-2 text-base font-bold text-ok">Available</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <p className="mt-12 text-center text-base">
          <Link href="/manage" className="text-ink/70 underline underline-offset-4">Cars, drivers and approvals</Link>
        </p>
      )}
    </>
  );
}
