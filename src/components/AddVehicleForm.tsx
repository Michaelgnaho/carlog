'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { addVehicle } from '@/lib/actions';
import { uploadVehiclePhoto } from '@/lib/photo';

export default function AddVehicleForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const page = useSearchParams().toString();

  useEffect(() => {
    setBusy(false);
  }, [page]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const photo = fd.get('photo') as File | null;
    fd.delete('photo');
    const id = crypto.randomUUID();
    fd.set('id', id);
    setBusy(true);
    try {
      fd.set('photo_path', photo && photo.size > 0 ? await uploadVehiclePhoto(id, photo) : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The photo could not be saved.');
      setBusy(false);
      return;
    }
    startTransition(async () => {
      await addVehicle(fd);
    });
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="card mb-4 grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label htmlFor="v-name" className="label">Vehicle name</label>
        <input id="v-name" name="name" required placeholder="Toyota Hilux" className="field" />
      </div>
      <div>
        <label htmlFor="v-plate" className="label">Plate number</label>
        <input id="v-plate" name="plate_number" required placeholder="LND 123 AB" className="field uppercase" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="v-photo" className="label">Photo of the vehicle (optional)</label>
        <input id="v-photo" name="photo" type="file" accept="image/*" className="field !text-base file:mr-4 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:font-bold file:text-white" />
      </div>
      {error && <p role="alert" className="text-lg font-bold text-bad sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button disabled={busy} className="btn-primary">{busy ? 'Saving...' : 'Add vehicle'}</button>
      </div>
    </form>
  );
}
