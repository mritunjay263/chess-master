/**
 * matchmaking.scheduler.ts
 * FIX: use matchmakingService.matchPlayers() (FIFO pairing built-in)
 *      instead of calling getQueue() which does not exist.
 *      Emits 'match_found' with shape useSocket.ts expects:
 *        { matchId, color, white, black, timeMs }
 */
import { Server } from 'socket.io';
import { matchmakingService } from '../services/matchmaking.service';
import { gameService } from '../services/game.service';
import { createLogger } from '../utils/logger';

const logger      = createLogger('matchmaking-scheduler');
const INTERVAL_MS = 2000;
const DEFAULT_TIME_MS = 300_000; // 5 min

export function startMatchmakingScheduler(io: Server): void {
  setInterval(async () => {
    try {
      // FIX: matchPlayers() pops two players from the queue and returns them
      const match = await matchmakingService.matchPlayers();
      if (!match) return; // fewer than 2 players queued

      const { white, black, gameId: matchId } = match;

      await gameService.createGameSession(
        white.userId, black.userId, matchId,
        {
          whiteUsername: white.username,
          blackUsername: black.username,
          whiteElo:      white.elo,
          blackElo:      black.elo,
        },
      );

      const timeMs = DEFAULT_TIME_MS;

      // Emit 'match_found' — frontend useSocket.ts onMatchFound handler
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
