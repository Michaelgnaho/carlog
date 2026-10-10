'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { setVehiclePhoto } from '@/lib/actions';
import { uploadVehiclePhoto } from '@/lib/photo';

export default function PhotoUploader({ vehicleId, hasPhoto }: { vehicleId: string; hasPhoto: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();
  const page = useSearchParams().toString();

  // When the page reloads after saving, reset the button
  useEffect(() => setBusy(false), [page, hasPhoto]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const path = await uploadVehiclePhoto(vehicleId, file);
      const fd = new FormData();
      fd.set('id', vehicleId);
      fd.set('photo_path', path);
      startTransition(async () => {
        await setVehiclePhoto(fd);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The photo could not be saved.');
      setBusy(false);
    }
  }

  return (
    <div>
      <label className={`btn-ghost cursor-pointer ${busy ? 'opacity-60' : ''}`}>
        {busy ? 'Saving photo...' : hasPhoto ? 'Change photo' : 'Add photo'}
        <input type="file" accept="image/*" className="sr-only" onChange={onPick} disabled={busy} />
      </label>
      {error && <p role="alert" className="mt-2 text-base font-bold text-bad">{error}</p>}
    </div>
  );
}
