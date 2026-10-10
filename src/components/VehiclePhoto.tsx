import CarIcon from './CarIcon';
import { photoUrl } from '@/lib/vehicle';

/** A car's photo, or a neutral picture if none has been added yet. */
export default function VehiclePhoto({ path, alt = '', className = '' }: { path?: string | null; alt?: string; className?: string }) {
  const url = photoUrl(path);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-navy-soft ${className}`} aria-hidden>
      <CarIcon className="h-1/3 w-1/3 max-h-16 max-w-16 opacity-70" />
    </div>
  );
}
