'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

export type SetRoleResult = { ok: true; role: 'teacher' | 'student' } | { ok: false; error: string };

export async function setUserRole(
  role: 'teacher' | 'student',
  schoolName?: string
): Promise<SetRoleResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: 'Not signed in.' };

    const backend = await clerkClient();
    const publicMetadata: Record<string, unknown> = { role };
    if (role === 'teacher' && schoolName?.trim()) {
      publicMetadata.schoolName = schoolName.trim();
    }

    await backend.users.updateUser(userId, {
      publicMetadata,
    });

    return { ok: true, role };
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
