// Times are stored exactly (UTC) and always shown in Lagos time.
export const TZ = 'Africa/Lagos';

const short = new Intl.DateTimeFormat('en-NG', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
const full = new Intl.DateTimeFormat('en-NG', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

const caps = (s: string) => s.replace(/\s?am\b/i, ' AM').replace(/\s?pm\b/i, ' PM');

/** e.g. Fri, 9 Oct, 2:35 PM */
export const fmtDateTime = (d: string | Date) => caps(short.format(new Date(d)));
/** e.g. 9 Oct 2026, 2:35 PM */
export const fmtFull = (d: string | Date) => caps(full.format(new Date(d)));

export const isValidDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(`${s}T00:00:00+01:00`).getTime());

/** Start and end of a Lagos calendar day */
export function dayRange(date: string) {
  const from = new Date(`${date}T00:00:00+01:00`);
  return { from, to: new Date(from.getTime() + 24 * 3600_000) };
}
