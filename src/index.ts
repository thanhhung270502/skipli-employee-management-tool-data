import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';

import { validateEnv } from './common/config/env';
import { initializeFirebase } from './common/services/firebase';
import { createApp } from './app';
import { initializeChatSocket } from './modules/chat';
import { initializeTaskSocket } from './modules/task';

validateEnv();
initializeFirebase();

const app = createApp();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

initializeChatSocket(io);
initializeTaskSocket(io);

// Only start the server locally if not running on Vercel
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT ?? '5000', 10);
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Skipli Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io enabled`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}\n`);
  });
}

export { app, httpServer };
export default app;

