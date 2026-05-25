import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { AppShell } from '@/components/layout/AppShell';
import { roleFromSessionClaims } from '@/lib/clerk/roleFromClaims';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  let role = roleFromSessionClaims(sessionClaims);
  if (!role) {
    const user = await currentUser();
    role = user?.publicMetadata?.role as string | undefined ?? null;
  }

  if (!role) redirect('/onboarding');
  if (role !== 'student') redirect('/home');

  return <AppShell>{children}</AppShell>;
}
