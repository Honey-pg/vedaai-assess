/**
 * Clerk session JWT/custom claims sometimes mirror `publicMetadata` via a template;
 * middleware and server layouts share this shape so redirects stay consistent.
 */
export function roleFromSessionClaims(sessionClaims: unknown): string | null {
  if (!sessionClaims || typeof sessionClaims !== 'object') return null;

  const claims = sessionClaims as Record<string, unknown>;
  const metaBucket = claims.metadata ?? claims.public_metadata;
  const nested =
    typeof metaBucket === 'object' && metaBucket !== null
      ? (metaBucket as Record<string, unknown>)
      : undefined;

  if (nested && typeof nested.role === 'string') return nested.role;
  if (typeof claims.role === 'string') return claims.role;

  return null;
}
