export default function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`mb-6 rounded-2xl border-2 px-5 py-4 text-lg font-bold ${error ? 'border-bad/40 bg-bad-soft text-bad' : 'border-ok/40 bg-ok-soft text-ok'}`}
    >
      {error ?? ok}
    </div>
  );
}
