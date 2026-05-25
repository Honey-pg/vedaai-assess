import type { Response, NextFunction, RequestHandler, Request } from 'express';
import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/express';
import { UserModel, type IUserDoc, type VedaRole } from '../models/User';

function parseRole(metadata: Record<string, unknown> | undefined | null): VedaRole | null {
  const r = metadata?.role;
  if (r === 'teacher' || r === 'student') return r;
  return null;
}

/** JWT must authenticate; attaches nothing if missing Clerk user row yet */
export function requireAuthenticatedUser(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req) as { userId: string | null };
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return;
  }
  next();
}

/** After requireAuthenticatedUser: upsert mongo User from Clerk metadata */
export const syncVedaUser: RequestHandler = async (req, res, next): Promise<void> => {
  const { userId } = getAuth(req) as { userId: string | null };
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return;
  }

  try {
    let doc = await UserModel.findOne({ clerkUserId: userId });
    const clerkUser = await clerkClient.users.getUser(userId);
    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress ?? doc?.email ?? `${userId}@placeholder.invalid`;
    const role = parseRole(clerkUser.publicMetadata as Record<string, unknown>) ?? doc?.role ?? null;
    const displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || email;

    if (!role) {
      res.status(403).json({
        error: 'Complete onboarding — set role in Clerk (public_metadata.role)',
        code: 'ROLE_REQUIRED',
      });
      return;
    }

    if (!doc) {
      doc = await UserModel.create({
        clerkUserId: userId,
        email,
        displayName,
        role,
      });
    } else if (doc.email !== email || doc.role !== role || doc.displayName !== displayName) {
      doc.email = email;
      doc.role = role;
      doc.displayName = displayName;
      await doc.save();
    }

    req.vedaUser = doc as IUserDoc;
    next();
  } catch (e) {
    console.error('syncVedaUser', e);
    res.status(500).json({ error: 'Failed to sync user profile', code: 'INTERNAL_ERROR' });
  }
};

export function requireTeacher(req: Request, res: Response, next: NextFunction): void {
  if (req.vedaUser?.role !== 'teacher') {
    res.status(403).json({ error: 'Teacher role required', code: 'FORBIDDEN' });
    return;
  }
  next();
}

export function requireStudent(req: Request, res: Response, next: NextFunction): void {
  if (req.vedaUser?.role !== 'student') {
    res.status(403).json({ error: 'Student role required', code: 'FORBIDDEN' });
    return;
  }
  next();
}
