import { Server } from 'socket.io';
import { gameService } from '../services/game.service';
import { setupSocketEvents } from './socketEvents';
import { startMatchmakingScheduler } from './matchmaking.scheduler';
import { createLogger } from '../utils/logger';

const logger = createLogger('game-socket');

export const initializeGameSocket = (io: Server): void => {
  gameService.setSocketIO(io);
  setupSocketEvents(io);
  startMatchmakingScheduler(io);
  logger.info('Game socket initialized');
};