import Link from 'next/link';
import CarIcon from '@/components/CarIcon';
import Notice from '@/components/Notice';
import SubmitButton from '@/components/SubmitButton';
import { signUp } from '@/lib/actions';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const sp = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <CarIcon className="h-14 w-14" />
        <h1 className="text-4xl font-bold leading-none">Create your account</h1>
      </div>

      {sp.sent ? (
        <div className="card p-6 text-lg">
          <p className="font-bold">Check your email.</p>
          <p className="mt-2">We sent you a link to confirm your address. After that, the administrator will approve your account.</p>
          <p className="mt-4"><Link href="/login" className="font-bold text-navy underline underline-offset-4">Back to sign in</Link></p>
        </div>
      ) : (
        <>
          <p className="mb-5 text-lg text-ink/80">For drivers. After you sign up, the administrator checks your name and approves you. Then you can take and return vehicles yourself.</p>
          <Notice error={sp.error} />
          <form action={signUp} className="card space-y-5 p-6">
            <div>
              <label htmlFor="full_name" className="label">Full name</label>
              <input id="full_name" name="full_name" autoComplete="name" required className="field" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone number</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="0803 000 0000" className="field" />
              <p className="hint">So the administrator knows it is you.</p>
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="field" />
            </div>
            <div>
              <label htmlFor="password" className="label">Choose a password</label>
              <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required className="field" />
              <p className="hint">At least 8 characters. Write it down somewhere safe.</p>
            </div>
            <SubmitButton pendingText="Creating account..." className="btn-primary w-full !py-4 !text-xl">Create account</SubmitButton>
          </form>
          <p className="mt-6 text-center text-lg">
            Already have an account? <Link href="/login" className="font-bold text-navy underline underline-offset-4">Sign in</Link>
          </p>
        </>
      )}
    </main>
  );
}
