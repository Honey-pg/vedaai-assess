import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';

import { roleFromSessionClaims } from '@/lib/clerk/roleFromClaims';

export const dynamic = 'force-dynamic';

/**
 * Sends signed-in users to onboarding or the right dashboard based on Clerk role metadata.
 *
 * Prefer JWT claims (`auth().sessionClaims`) over `currentUser()` so we don't bounce back to `/sign-in`
 * when Clerk's user API is slow/unavailable despite a live session cookie (often after email/password sign-in).
 */
export default async function RootPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  let role = roleFromSessionClaims(sessionClaims);
  if (!role) {
    const user = await currentUser();
    role = user?.publicMetadata?.role as string | undefined ?? null;
  }

  if (!role) {
    redirect('/onboarding');
  }

  redirect(role === 'student' ? '/student' : '/home');
}
