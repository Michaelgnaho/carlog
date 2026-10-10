import Link from 'next/link';
import { redirect } from 'next/navigation';
import AddVehicleForm from '@/components/AddVehicleForm';
import Notice from '@/components/Notice';
import PhotoUploader from '@/components/PhotoUploader';
import SubmitButton from '@/components/SubmitButton';
import VehiclePhoto from '@/components/VehiclePhoto';
import { addDriver, changeDriver, setDriverPassword, setVehicleActive, updateDriver, updateVehicle } from '@/lib/actions';
import { getRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { role } = await getRole();
  if (role !== 'admin') redirect('/');

  const supabase = await createClient();
  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from('vehicles').select('*').order('is_active', { ascending: false }).order('name'),
    supabase.from('drivers').select('*').order('name'),
  ]);

  const pending = (drivers ?? []).filter((d) => d.status === 'pending');
  const others = (drivers ?? []).filter((d) => d.status !== 'pending').sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
  const removedTag = <span className="rounded bg-ink/10 px-2 py-0.5 text-sm font-bold text-ink/70">Removed</span>;

  return (
    <>
      <Link href="/" className="text-lg font-bold text-navy underline underline-offset-4">Back</Link>
      <h1 className="mb-2 mt-3 text-3xl font-bold">Cars, drivers and approvals</h1>
      <p className="mb-6 text-lg text-ink/80">Add each car once, with a photo. Drivers sign up themselves and you approve them here. Removing a car or driver hides them but keeps their past records.</p>
      <Notice error={sp.error} ok={sp.ok} />

      {/* ---------- Approvals ---------- */}
      <section id="approvals" className="mb-12 scroll-mt-4" aria-labelledby="appr">
        <h2 id="appr" className="mb-3 text-2xl font-bold">Waiting for approval</h2>
        {pending.length === 0 ? (
          <p className="card p-5 text-lg text-ink/70">No one is waiting. New drivers appear here after they sign up.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((d) => (
              <li key={d.id} className="card border-signal p-4">
                <p className="text-xl font-bold">{d.name}</p>
                <p className="text-lg text-ink/80">Phone: {d.phone ?? 'not given'}</p>
                <p className="hint">Check that you know this person before you approve.</p>
                <form action={changeDriver} className="mt-3 flex flex-wrap gap-3">
                  <input type="hidden" name="id" value={d.id} />
                  <button name="intent" value="approve" className="btn-primary">Approve</button>
                  <button name="intent" value="decline" className="btn-danger">Decline</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Vehicles ---------- */}
      <section className="mb-12" aria-labelledby="veh">
        <h2 id="veh" className="mb-3 text-2xl font-bold">Vehicles</h2>
        <AddVehicleForm />

        <ul className="space-y-3">
          {(vehicles ?? []).length === 0 && <li className="card p-5 text-lg text-ink/70">No vehicles yet. Add the first one above.</li>}
          {(vehicles ?? []).map((v) => (
            <li key={v.id} className={`card p-4 ${v.is_active ? '' : 'opacity-70'}`}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <VehiclePhoto path={v.photo_path} alt={v.name} className="h-44 w-full shrink-0 rounded-xl sm:h-24 sm:w-32" />
                <div className="min-w-0 flex-1">
                  <form action={updateVehicle} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <input type="hidden" name="id" value={v.id} />
                    <div>
                      <label htmlFor={`vn-${v.id}`} className="label !text-base">Name {!v.is_active && removedTag}</label>
                      <input id={`vn-${v.id}`} name="name" defaultValue={v.name} required className="field !py-2" />
                    </div>
                    <div>
                      <label htmlFor={`vp-${v.id}`} className="label !text-base">Plate number</label>
                      <input id={`vp-${v.id}`} name="plate_number" defaultValue={v.plate_number} required className="field !py-2 uppercase" />
                    </div>
                    <SubmitButton pendingText="Saving..." className="btn-ghost">Save</SubmitButton>
                  </form>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-start gap-3">
                <PhotoUploader vehicleId={v.id} hasPhoto={!!v.photo_path} />
                <form action={setVehicleActive}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="active" value={v.is_active ? 'false' : 'true'} />
                  <SubmitButton pendingText="Saving..." className={v.is_active ? 'btn-danger' : 'btn-ghost'}>
                    {v.is_active ? 'Remove from list' : 'Put back on list'}
                  </SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Drivers ---------- */}
      <section aria-labelledby="drv">
        <h2 id="drv" className="mb-3 text-2xl font-bold">Drivers</h2>
        <p className="mb-4 text-lg text-ink/80">Most drivers sign up on their own phones. Use the form below only for someone without a phone: you can then record their trips yourself.</p>

        <form action={addDriver} className="card mb-4 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="d-name" className="label">Driver name</label>
            <input id="d-name" name="name" required placeholder="Musa Ibrahim" className="field" />
          </div>
          <div>
            <label htmlFor="d-phone" className="label">Phone (optional)</label>
            <input id="d-phone" name="phone" type="tel" className="field" />
          </div>
          <SubmitButton pendingText="Adding..." className="btn-primary">Add driver</SubmitButton>
        </form>

        <ul className="space-y-3">
          {others.length === 0 && <li className="card p-5 text-lg text-ink/70">No drivers yet.</li>}
          {others.map((d) => (
            <li key={d.id} className={`card p-4 ${d.status === 'active' ? '' : 'opacity-70'}`}>
              <form action={updateDriver} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <input type="hidden" name="id" value={d.id} />
                <div>
                  <label htmlFor={`dn-${d.id}`} className="label !text-base">
                    Name {d.status !== 'active' && removedTag}{' '}
                    {d.user_id && <span className="rounded bg-navy-soft px-2 py-0.5 text-sm font-bold text-navy">Has own login</span>}
                  </label>
                  <input id={`dn-${d.id}`} name="name" defaultValue={d.name} required className="field !py-2" />
                </div>
                <div>
                  <label htmlFor={`dp-${d.id}`} className="label !text-base">Phone</label>
                  <input id={`dp-${d.id}`} name="phone" type="tel" defaultValue={d.phone ?? ''} className="field !py-2" />
                </div>
                <SubmitButton pendingText="Saving..." className="btn-ghost">Save</SubmitButton>
              </form>

              <div className="mt-3 flex flex-wrap items-start gap-3">
                <form action={changeDriver}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="intent" value={d.status === 'active' ? 'remove' : 'restore'} />
                  <SubmitButton pendingText="Saving..." className={d.status === 'active' ? 'btn-danger' : 'btn-ghost'}>
                    {d.status === 'active' ? 'Remove from list' : 'Put back on list'}
                  </SubmitButton>
                </form>
              </div>

              {d.user_id && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-base font-bold text-navy underline underline-offset-4">Forgot password? Set a new one</summary>
                  <form action={setDriverPassword} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <input type="hidden" name="id" value={d.id} />
                    <div>
                      <label htmlFor={`pw-${d.id}`} className="label !text-base">New password (at least 8 characters)</label>
                      <input id={`pw-${d.id}`} name="password" type="text" minLength={8} required autoComplete="off" className="field !py-2" />
                    </div>
                    <SubmitButton pendingText="Saving..." className="btn-primary">Save password</SubmitButton>
                  </form>
                </details>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
