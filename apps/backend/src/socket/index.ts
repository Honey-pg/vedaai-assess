import { Server } from 'socket.io';
import http from 'http';
import { verifyToken } from '@clerk/backend';
import { AssignmentModel } from '../models/Assignment';
import { UserModel } from '../models/User';
import { env } from '../config/env';

export let io: Server;

export function initSocket(server: http.Server): void {
  const socketCorsOrigin =
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'http://localhost:3000'
      : true;

  io = new Server(server, {
    cors: {
      origin: socketCorsOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const authHdr = socket.handshake.headers.authorization;
      const bearer =
        typeof authHdr === 'string' && /^Bearer\s+/i.test(authHdr)
          ? authHdr.replace(/^Bearer\s+/i, '').trim()
          : '';

      const bodyToken =
        typeof socket.handshake.auth === 'object' &&
        socket.handshake.auth !== null &&
        'token' in socket.handshake.auth
          ? String((socket.handshake.auth as { token?: unknown }).token ?? '').trim()
          : '';

      const token = bearer || bodyToken;
      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }

      const verified = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });
      const sub = verified.sub;
      if (!sub) {
        next(new Error('Unauthorized'));
        return;
      }
      (socket.data as { clerkUserId: string }).clerkUserId = sub;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const clerkUserId = (socket.data as { clerkUserId?: string }).clerkUserId ?? '';

    socket.on('subscribe:assignment', async (assignmentId: string) => {
      if (!assignmentId || !clerkUserId) return;
      try {
        const doc = await AssignmentModel.findById(assignmentId).lean<{
          teacherId: string;
          studentIds?: string[];
          studentEmails?: string[];
        } | null>();
        if (!doc) return;
        let allowed = doc.teacherId === clerkUserId || (doc.studentIds?.includes(clerkUserId) ?? false);
        if (!allowed && doc.studentEmails?.length) {
          const u = await UserModel.findOne({ clerkUserId }).lean<{ email?: string | null }>();
          const em = String(u?.email ?? '')
            .trim()
            .toLowerCase();
          if (em && doc.studentEmails.some((e) => String(e).toLowerCase() === em)) allowed = true;
        }
        if (!allowed) return;
        await socket.join(`assignment:${assignmentId}`);
      } catch (e) {
        console.error('subscribe:assignment', e);
      }
    });

    socket.on('unsubscribe:assignment', (assignmentId: string) => {
      if (assignmentId) socket.leave(`assignment:${assignmentId}`);
    });
  });
}

export function emitToAssignment(assignmentId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`assignment:${assignmentId}`).emit(event, data);
  }
}
