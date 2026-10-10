import Link from 'next/link';
import VehiclePhoto from '@/components/VehiclePhoto';
import { getRole } from '@/lib/auth';
import { dayRange, fmtFull, isValidDate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 25;

type Row = {
  id: string;
  vehicle_name: string;
  plate_number: string;
  photo_path: string | null;
  driver_name: string;
  taken_at: string;
  returned_by_name: string | null;
  returned_at: string | null;
  status: 'Out' | 'Returned';
};

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ q?: string; date?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').replace(/[,()*%\\"]/g, ' ').trim();
  const date = isValidDate(sp.date) ? sp.date! : '';
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  const { role } = await getRole();
  const isAdmin = role === 'admin';

  let rows: Row[] = [];
  let total = 0;

  if (isAdmin) {
    let query = supabase
      .from('movement_log')
      .select('*', { count: 'exact' })
      .order('taken_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (q) {
      const p = `*${q}*`;
      query = query.or(`vehicle_name.ilike.${p},plate_number.ilike.${p},driver_name.ilike.${p},returned_by_name.ilike.${p}`);
    }
    if (date) {
      const { from, to } = dayRange(date);
      const f = from.toISOString();
      const t = to.toISOString();
      query = query.or(`and(taken_at.gte.${f},taken_at.lt.${t}),and(returned_at.gte.${f},returned_at.lt.${t})`);
    }
    const { data, count } = await query;
    rows = (data ?? []) as Row[];
    total = count ?? 0;
  } else {
    // A driver sees only the trips they took or returned.
    const { data } = await supabase.rpc('my_trips', { p_limit: 100 });
    rows = (data ?? []) as Row[];
    total = rows.length;
  }

  const lastPage = isAdmin ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (date) params.set('date', date);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return s ? `/history?${s}` : '/history';
  };

  const chip = (r: Row) =>
    r.status === 'Out' ? (
      <span className="rounded-full bg-away-soft px-3 py-1 text-base font-bold text-away">Out</span>
    ) : (
      <span className="rounded-full bg-ok-soft px-3 py-1 text-base font-bold text-ok">Returned</span>
    );

  return (
    <>
      <Link href="/" className="text-lg font-bold text-navy underline underline-offset-4">Back</Link>
      <h1 className="mb-6 mt-3 text-3xl font-bold">{isAdmin ? 'Vehicle records' : 'My trips'}</h1>

      {isAdmin && (
      <form className="card mb-6 grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="q" className="label">Search by car or driver</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name or plate number" className="field" />
        </div>
        <div>
          <label htmlFor="date" className="label">Date</label>
          <input id="date" name="date" type="date" defaultValue={date} className="field" />
        </div>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button className="btn-primary">Search</button>
          {(q || date) && <Link href="/history" className="btn-ghost">Clear search</Link>}
        </div>
      </form>
      )}

      <p className="mb-3 text-base text-ink/70">
        {total === 0 ? 'No records found.' : !isAdmin ? `Your latest ${total} ${total === 1 ? 'trip' : 'trips'}, newest first.` : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, total)} of ${total} records, newest first.`}
      </p>

      {rows.length > 0 && (
        <>
          {/* Phones: one card per movement */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <VehiclePhoto path={r.photo_path} className="h-16 w-20 shrink-0 rounded-lg" />
                  <p className="flex-1 text-lg font-bold">{r.vehicle_name} <span className="font-normal text-ink/70">({r.plate_number})</span></p>
                  {chip(r)}
                </div>
                <dl className="mt-2 space-y-1 text-base">
                  <div><dt className="inline font-bold">Taken by: </dt><dd className="inline">{r.driver_name}</dd></div>
                  <div><dt className="inline font-bold">Time out: </dt><dd className="inline">{fmtFull(r.taken_at)}</dd></div>
                  <div><dt className="inline font-bold">Returned by: </dt><dd className="inline">{r.returned_by_name ?? 'Not yet returned'}</dd></div>
                  <div><dt className="inline font-bold">Time back: </dt><dd className="inline">{r.returned_at ? fmtFull(r.returned_at) : 'Not yet returned'}</dd></div>
                </dl>
              </li>
            ))}
          </ul>

          {/* Bigger screens: a table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-base">
              <thead className="bg-navy-soft">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Taken by</th>
                  <th className="px-4 py-3">Time out</th>
                  <th className="px-4 py-3">Returned by</th>
                  <th className="px-4 py-3">Time back</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <VehiclePhoto path={r.photo_path} className="h-12 w-16 shrink-0 rounded-md" />
                        <span className="font-bold">{r.vehicle_name}<br /><span className="font-normal text-ink/70">{r.plate_number}</span></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{r.driver_name}</td>
                    <td className="px-4 py-3">{fmtFull(r.taken_at)}</td>
                    <td className="px-4 py-3">{r.returned_by_name ?? '-'}</td>
                    <td className="px-4 py-3">{r.returned_at ? fmtFull(r.returned_at) : '-'}</td>
                    <td className="px-4 py-3">{chip(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {lastPage > 1 && (
        <nav className="mt-6 flex items-center justify-between" aria-label="Pages">
          {page > 1 ? <Link href={href(page - 1)} className="btn-ghost">Newer</Link> : <span />}
          <span className="text-base text-ink/70">Page {page} of {lastPage}</span>
          {page < lastPage ? <Link href={href(page + 1)} className="btn-ghost">Older</Link> : <span />}
        </nav>
      )}
    </>
  );
}
