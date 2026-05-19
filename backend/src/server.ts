import http from 'http';
import { createApp } from './app';
import { createSocketServer } from './config/socket';
import { initializeGameSocket } from './websocket/game.socket';
import { createLogger } from './utils/logger';

const logger = createLogger('server');

// Global error handlers — prevent crashes from unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION', { reason: (reason as Error).message, stack: (reason as Error).stack });
});

const BASE_PORT = parseInt(process.env.PORT || '3000', 10);

const tryListen = (port: number, maxRetries = 1): void => {
  const app = createApp();
  const httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);
  initializeGameSocket(io);

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && port < BASE_PORT + maxRetries) {
      logger.warn(`Port ${port} in use, trying ${port + 1}`);
      httpServer.close(() => tryListen(port + 1, maxRetries));
    } else {
      logger.error('Server error', { error: err.message, code: err.code });
    }
  });

  httpServer.listen(port, '0.0.0.0', () => {
    logger.info(`Server running on 0.0.0.0:${port}`);
  });
};

tryListen(BASE_PORT);