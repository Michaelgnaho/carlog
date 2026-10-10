import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { signOut } from '@/lib/actions';
import { getRole } from '@/lib/auth';

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="my-4 space-y-3 text-lg text-ink/80">{children}</div>
      <form action={signOut}>
        <button className="btn-primary">Sign out</button>
      </form>
    </main>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, role, name } = await getRole();
  if (!user) redirect('/login');

  if (role === 'pending') {
    return (
      <Screen title="Waiting for approval">
        <p>Thank you, {name}. Your account has been created.</p>
        <p>The administrator needs to approve it before you can take or return vehicles. Please ask them to approve you, then open the app again.</p>
      </Screen>
    );
  }
  if (role === 'none') {
    return (
      <Screen title="This account cannot use CarLog">
        <p>Your access has been removed, or this account is not set up for CarLog. Please speak to the administrator.</p>
      </Screen>
    );
  }

  return (
    <>
      <Header name={name} />
      <main className="mx-auto w-full max-w-3xl px-5 py-8">{children}</main>
    </>
  );
}
