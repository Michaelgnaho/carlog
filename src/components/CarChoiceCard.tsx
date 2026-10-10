import VehiclePhoto from './VehiclePhoto';

/** A tappable car picture. Works inside a normal form: tapping it selects the radio button. */
export default function CarChoiceCard({
  name,
  value,
  photo,
  title,
  subtitle,
  note,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  photo: string | null;
  title: string;
  subtitle: string;
  note?: string;
  checked?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input type="radio" name={name} value={value} required className="peer sr-only" checked={checked} onChange={onChange} />
      <div className="card overflow-hidden transition peer-checked:border-navy peer-checked:ring-4 peer-checked:ring-signal peer-focus-visible:ring-4 peer-focus-visible:ring-navy/40">
        <VehiclePhoto path={photo} className="aspect-[4/3] w-full" />
        <div className="p-3">
          <p className="text-lg font-bold leading-tight">{title}</p>
          <p className="text-base text-ink/70">{subtitle}</p>
          {note && <p className="mt-1 text-base text-ink/80">{note}</p>}
        </div>
      </div>
      <span className="absolute right-3 top-3 hidden rounded-full bg-signal px-3 py-1 text-base font-bold text-navy shadow peer-checked:block">Selected</span>
    </label>
  );
}
