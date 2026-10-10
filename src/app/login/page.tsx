import Link from 'next/link';
import { redirect } from 'next/navigation';
import CarIcon from '@/components/CarIcon';
import Notice from '@/components/Notice';
import SubmitButton from '@/components/SubmitButton';
import { signIn } from '@/lib/actions';
import { getRole } from '@/lib/auth';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { role } = await getRole();
  if (role === 'admin' || role === 'driver' || role === 'pending') redirect('/');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex items-center gap-3">
        <CarIcon className="h-14 w-14" />
        <div>
          <h1 className="text-4xl font-bold leading-none">CarLog</h1>
          <p className="mt-1 text-ink/70">Vehicle Movement Register</p>
        </div>
      </div>
      <Notice error={sp.error} />
      <form action={signIn} className="card space-y-5 p-6">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        <SubmitButton pendingText="Signing in..." className="btn-primary w-full !py-4 !text-xl">Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-lg">
        New driver? <Link href="/signup" className="font-bold text-navy underline underline-offset-4">Create your account</Link>
      </p>
      <p className="hint mt-2 text-center">You only sign in once on your phone. It stays signed in.</p>
    </main>
  );
}
