import { Server } from 'socket.io';
import http from 'http';

export let io: Server;

export function initSocket(server: http.Server): void {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('subscribe:assignment', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
      console.log(`Socket ${socket.id} subscribed to assignment:${assignmentId}`);
    });

    socket.on('unsubscribe:assignment', (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

export function emitToAssignment(assignmentId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`assignment:${assignmentId}`).emit(event, data);
  }
}
