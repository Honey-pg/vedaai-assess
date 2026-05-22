'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '@/lib/store/assignmentStore';
import type { WSEvent, GeneratedPaper } from '@vedaai/shared/types';

export function useAssignmentSocket(assignmentId: string | null) {
  const { updateJobStatus, setGeneratedPaper } = useAssignmentStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!assignmentId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    const socket = io(wsUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('subscribe:assignment', assignmentId);

    socket.on('job:started', (e: WSEvent) => {
      updateJobStatus('processing', 0, e.message || 'Starting...');
    });

    socket.on('job:progress', (e: WSEvent) => {
      updateJobStatus('processing', e.progress || 0, e.message || 'Processing...');
    });

    socket.on('job:completed', (e: WSEvent) => {
      updateJobStatus('completed', 100, 'Complete!');
      if (e.result) {
        setGeneratedPaper(e.result as GeneratedPaper);
      }
    });

    socket.on('job:failed', (e: WSEvent) => {
      updateJobStatus('failed', 0, e.error || 'Generation failed');
    });

    return () => {
      socket.emit('unsubscribe:assignment', assignmentId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [assignmentId, updateJobStatus, setGeneratedPaper]);
}
