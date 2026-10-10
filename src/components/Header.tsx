import Link from 'next/link';
import CarIcon from './CarIcon';
import { signOut } from '@/lib/actions';

export default function Header({ name }: { name?: string }) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <CarIcon className="h-9 w-9" />
          CarLog
        </Link>
        <form action={signOut} className="flex items-center gap-3">
          {name && <span className="hidden max-w-[10rem] truncate text-base text-white/80 sm:inline">{name}</span>}
          <button className="rounded-lg border-2 border-white/40 px-4 py-2 text-base font-bold hover:bg-white/10">Sign out</button>
        </form>
      </div>
    </header>
  );
}
