import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initializeGameSocket } from './websocket/game.socket';
import { createLogger } from './utils/logger';

const logger = createLogger('server');
const app    = express();
const http   = createServer(app);

// FIX: allow all origins in dev so Expo tunnel URL (https://xxxx.exp.direct)
// and any LAN IP can connect. In production replace '*' with your domain.
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
  : ['*'];

app.use(cors({
  origin: allowedOrigins.length && allowedOrigins[0] !== '*'
    ? allowedOrigins
    : true,           // true = reflect request origin (needed for credentials)
  credentials: true,
}));
app.use(express.json());

// REST routes
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import userRoutes from './routes/user.routes';
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
app.use('/user', userRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Socket.IO
// FIX: cors origin '*' for dev — Expo tunnel sends an Origin header that
//      Socket.IO's default policy may reject if not configured explicitly.
const io = new Server(http, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
      : '*',
    methods: ['GET', 'POST'],
    credentials: false, // must be false when origin is '*'
  },
  transports: ['websocket', 'polling'],  // polling as fallback
  pingTimeout:  20000,
  pingInterval: 10000,
});

initializeGameSocket(io);

const PORT = parseInt(process.env.PORT ?? '3001', 10);
http.listen(PORT, '0.0.0.0', () => {
  // FIX: bind to 0.0.0.0 so the server is reachable from any network interface
  // (LAN, tunnel, Docker, etc.) — not just localhost
  logger.info(`Server running on port ${PORT}`);
});

export { app, io };
