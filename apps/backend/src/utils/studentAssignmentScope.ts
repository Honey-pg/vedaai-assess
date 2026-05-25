/** Normalized email for matching `studentEmails` arrays on assignments. */
export function normalizeUserEmail(user: { email?: string | null }): string {
  return String(user.email ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Assignments visible to a learner: enrolled by Clerk id or by account email.
 * Keep in sync with list + access checks in `routes/assignments.ts`.
 */
export function buildStudentAssignmentFilter(
  clerkId: string,
  normalizedEmail: string
): Record<string, unknown> {
  const or: Record<string, unknown>[] = [{ studentIds: clerkId }];
  if (normalizedEmail) or.push({ studentEmails: normalizedEmail });
  return { $or: or };
}

export function buildAssignmentsListFilter(
  role: 'teacher' | 'student',
  clerkId: string,
  normalizedEmail: string
): Record<string, unknown> {
  if (role === 'teacher') return { teacherId: clerkId };
  return buildStudentAssignmentFilter(clerkId, normalizedEmail);
}
