import http from 'http';
import { createApp } from './app';
import { createSocketServer } from './config/socket';
import { initializeGameSocket } from './websocket/game.socket';
import { createLogger } from './utils/logger';

const logger = createLogger('server');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const app = createApp();
    const httpServer = http.createServer(app);
    const io = createSocketServer(httpServer);
    initializeGameSocket(io);
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

startServer();