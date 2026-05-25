'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '@/lib/store/assignmentStore';
import type { WSEvent } from '@vedaai/shared/types';

export function useAssignmentSocket(assignmentId: string | null) {
  const { updateJobStatus } = useAssignmentStore();
  const socketRef = useRef<Socket | null>(null);
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    let cancelled = false;
    socketRef.current = null;

    if (!isLoaded || !assignmentId || !isSignedIn) {
      return;
    }

    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
        const socket = io(wsUrl, {
          transports: ['websocket', 'polling'],
          auth: { token },
        });
        if (cancelled) {
          socket.disconnect();
          return;
        }

        socketRef.current = socket;
        socket.emit('subscribe:assignment', assignmentId);

        socket.on('job:started', (e: WSEvent) => {
          updateJobStatus('processing', 0, e.message || 'Starting...');
        });

        socket.on('job:progress', (e: WSEvent) => {
          updateJobStatus('processing', e.progress || 0, e.message || 'Processing...');
        });

        socket.on('job:completed', () => {
          updateJobStatus('completed', 100, 'Complete!');
        });

        socket.on('job:failed', (e: WSEvent) => {
          updateJobStatus('failed', 0, e.error || 'Generation failed');
        });
      } catch {
        /* REST polling fallback */
      }
    })();

    return () => {
      cancelled = true;
      const sock = socketRef.current;
      if (sock?.connected && assignmentId) {
        sock.emit('unsubscribe:assignment', assignmentId);
      }
      sock?.disconnect();
      socketRef.current = null;
    };
  }, [assignmentId, getToken, isLoaded, isSignedIn, updateJobStatus]);
}
