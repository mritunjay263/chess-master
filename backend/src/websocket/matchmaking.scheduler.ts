/**
 * matchmaking.scheduler.ts
 * FIX: emits 'match_found' (not 'game_found') with the shape useSocket.ts expects:
 *   { matchId, color, white, black, timeMs }
 */
import { Server } from 'socket.io';
import { matchmakingService } from '../services/matchmaking.service';
import { gameService } from '../services/game.service';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('matchmaking-scheduler');
const INTERVAL_MS = 2000;
const DEFAULT_TIME_MS = 300_000; // 5 min

export function startMatchmakingScheduler(io: Server): void {
  setInterval(async () => {
    try {
      const queue = await matchmakingService.getQueue();
      if (queue.length < 2) return;

      // Simple FIFO pairing (can be replaced with ELO-based)
      const p1 = queue[0];
      const p2 = queue[1];

      await matchmakingService.removeFromQueue(p1.userId);
      await matchmakingService.removeFromQueue(p2.userId);

      const matchId = uuidv4();
      // Randomly assign colors
      const [white, black] = Math.random() < 0.5 ? [p1, p2] : [p2, p1];

      const session = await gameService.createGameSession(
        white.userId, black.userId, matchId,
        { whiteUsername: white.username, blackUsername: black.username, whiteElo: white.elo, blackElo: black.elo },
      );

      const timeMs = DEFAULT_TIME_MS;

      // FIX: emit 'match_found' with flat shape matching useSocket.ts onMatchFound handler
      io.to(white.userId).emit('match_found', {
        matchId,
        color: 'w',
        white: { id: white.userId, username: white.username, rating: white.elo },
        black: { id: black.userId, username: black.username, rating: black.elo },
        timeMs,
      });
      io.to(black.userId).emit('match_found', {
        matchId,
        color: 'b',
        white: { id: white.userId, username: white.username, rating: white.elo },
        black: { id: black.userId, username: black.username, rating: black.elo },
        timeMs,
      });

      logger.info('Match created', { matchId, white: white.userId, black: black.userId });
    } catch (e) {
      logger.error('Matchmaking scheduler error', { error: (e as Error).message });
    }
  }, INTERVAL_MS);

  logger.info('Matchmaking scheduler started');
}
