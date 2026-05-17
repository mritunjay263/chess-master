import { Server } from 'socket.io';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { getUserSocketId } from './socketEvents';
import { createLogger } from '../utils/logger';

const logger = createLogger('matchmaking-scheduler');

const DEFAULT_TIME_CONTROL = { key: 'blitz5', label: 'Blitz 5+0', baseSeconds: 300, incrementSeconds: 0 };

const ioRef: { io: Server | null } = { io: null };

export const startMatchmakingScheduler = (io: Server): void => {
  ioRef.io = io;
  setInterval(async () => {
    try {
      const match = await matchmakingService.matchPlayers();
      if (!match) return;
      const { white, black, gameId } = match;
      logger.info('Attempting to create session for matched players', { gameId, white: white.userId, black: black.userId });
      const session = await gameService.createGameSession(white.userId, black.userId, gameId, {
        whiteUsername: white.username,
        blackUsername: black.username,
        whiteElo: white.elo,
        blackElo: black.elo,
      });
      if (!session) {
        logger.error('Session creation returned null/undefined', { gameId });
        return;
      }
      logger.info('Session created successfully', { gameId, fen: session.fen });

      // Use timeControl from player data or fallback to default
      const timeControl = white.timeControl || DEFAULT_TIME_CONTROL;

      // Build payload in the format mobile expects:
      // { matchId, white: PlayerInfo, black: PlayerInfo, timeControl: TimeControl }
      const payload = {
        matchId: gameId,
        white: {
          id: white.userId,
          username: white.username,
          rating: white.elo,
        },
        black: {
          id: black.userId,
          username: black.username,
          rating: black.elo,
        },
        timeControl,
      };

      logger.info('Emitting match_found to players', { whiteUserId: white.userId, blackUserId: black.userId });
      io.to(white.userId).emit('match_found', payload);
      io.to(black.userId).emit('match_found', payload);
      logger.info('Match created and notified', { gameId, white: white.userId, black: black.userId });
    } catch (e) { logger.error('Matchmaking error', { error: (e as Error).message, stack: (e as Error).stack }); }
  }, 1000);
  logger.info('Matchmaking scheduler started');
};