import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { initSocket } from './socket';
import './queues/worker';

const server = http.createServer(app);

initSocket(server);

async function start(): Promise<void> {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`AI Provider: ${env.AI_PROVIDER}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
