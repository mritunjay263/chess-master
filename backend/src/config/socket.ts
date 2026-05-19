// backend/src/config/socket.ts — fixed CORS to allow all origins in dev
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export const createSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });
  return io;
};
