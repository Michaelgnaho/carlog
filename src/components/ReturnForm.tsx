'use client';

import { useState } from 'react';
import { returnVehicle } from '@/lib/actions';
import CarChoiceCard from './CarChoiceCard';
import StickyBar from './StickyBar';
import SubmitButton from './SubmitButton';

export type OutCar = {
  movement_id: string;
  photo_path: string | null;
  name: string;
  plate_number: string;
  taken_by_id: string;
  taken_by_name: string;
  since: string; // already formatted
  mine: boolean;
};
export type DriverOption = { id: string; name: string; status: string };

export default function ReturnForm({ cars, drivers, isAdmin, myName }: { cars: OutCar[]; drivers: DriverOption[]; isAdmin: boolean; myName: string }) {
  const [picked, setPicked] = useState('');
  const [by, setBy] = useState('');
  const car = cars.find((c) => c.movement_id === picked);
  const options = drivers.filter((d) => d.status === 'active' || d.id === car?.taken_by_id);

  return (
    <form action={returnVehicle} className="space-y-7">
      <div>
        <p className="label">1. Tap the vehicle that is back</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {cars.map((c) => (
            <CarChoiceCard
              key={c.movement_id}
              name="movement_id"
              value={c.movement_id}
              photo={c.photo_path}
              title={c.name}
              subtitle={c.plate_number}
              note={`${c.mine ? 'Taken by you' : `Taken by ${c.taken_by_name}`}, ${c.since}`}
              checked={picked === c.movement_id}
              onChange={() => {
                setPicked(c.movement_id);
                setBy(c.taken_by_id);
              }}
            />
          ))}
        </div>
      </div>

      {isAdmin ? (
        <div>
          <label htmlFor="returned_by" className="label">2. Who returned it?</label>
          <select id="returned_by" name="returned_by" required value={by} onChange={(e) => setBy(e.target.value)} className="field">
            <option value="" disabled>Choose a name</option>
            {options.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {car && <p className="hint">We filled in {car.taken_by_name}, who took it. Change it if someone else brought it back.</p>}
        </div>
      ) : (
        <p className="card p-4 text-lg">You are returning it as <strong>{myName}</strong>.</p>
      )}

      <p className="hint">The date and time are recorded automatically.</p>
      <StickyBar>
        <SubmitButton pendingText="Saving..." className="btn-return">Confirm return</SubmitButton>
      </StickyBar>
    </form>
  );
}
