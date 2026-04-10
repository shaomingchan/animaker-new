import { redirect } from 'next/navigation';
import { getAuth } from '@/core/auth';
import { headers } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}
