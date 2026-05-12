import { Server, Socket } from 'socket.io';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { createLogger } from '../utils/logger';
import prisma from '../config/prisma';

const logger = createLogger('socket-events');

const userSockets = new Map<string, string>();
const gameSockets = new Map<string, Set<string>>();

export const setupSocketEvents = (io: Server): void => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    logger.info('Socket auth attempt', { hasToken: !!token, userId: userId ?? 'none', ip: socket.handshake.address });
    
    // If token provided, verify JWT
    if (token) {
      const payload = verifyToken(token);
      if (!payload) {
        logger.warn('Socket auth rejected: invalid token', { userId });
        return next(new Error('Invalid token'));
      }
      (socket as any).user = payload;
      return next();
    }
    
    // Allow guest connections if userId is provided (starts with 'guest_')
    if (userId && typeof userId === 'string' && userId.startsWith('guest_')) {
      (socket as any).user = { userId, username: `Guest_${userId.slice(6, 12)}`, email: '' } as JwtPayload;
      return next();
    }
    
    logger.warn('Socket auth rejected: no token or guest userId', { userId });
    return next(new Error('Authentication required'));
  });

  io.engine.on('connection_error', (err: any) => {
    logger.error('Socket engine connection error', { code: err.code, message: err.message, context: err.context });
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    logger.info('Socket connected', { userId: user.userId, socketId: socket.id });
    userSockets.set(user.userId, socket.id);
    // ensure we can address this user by their userId room
    try { socket.join(user.userId); } catch (e) { /* ignore */ }

    socket.on('join_queue', async (data: { timeControl?: any; playerId?: string }) => {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { elo: true } });
        const elo = dbUser?.elo ?? 1200;
        const added = await matchmakingService.addToQueue({
          userId: user.userId,
          username: user.username,
          elo,
          timestamp: Date.now(),
          socketId: socket.id,
          timeControl: data?.timeControl,
        });
        if (!added) {
          socket.emit('error', { code: 'ALREADY_IN_QUEUE', message: 'Already in matchmaking queue' });
        }
        logger.info('Player joined queue', { userId: user.userId, elo, queueLength: await matchmakingService.getQueueLength() });
      } catch (e) {
        logger.error('join_queue error', { error: (e as Error).message });
        socket.emit('error', { code: 'QUEUE_ERROR', message: 'Failed to join queue' });
      }
    });

    socket.on('leave_queue', async () => {
      try {
        await matchmakingService.removeFromQueue(user.userId);
        logger.info('Player left queue', { userId: user.userId });
      } catch (e) { /* ignore */ }
    });

    socket.on('join_game', async (data: { gameId: string }) => {
      try {
        const session = await gameService.getGameSession(data.gameId);
        if (!session) { socket.emit('error', { message: 'Game not found' }); return; }
        socket.join(data.gameId);
        (socket as any).gameId = data.gameId;
        
        if (!gameSockets.has(data.gameId)) gameSockets.set(data.gameId, new Set());
        gameSockets.get(data.gameId)!.add(socket.id);
        
        socket.to(data.gameId).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
      } catch (e) { socket.emit('error', { message: 'Failed to join game' }); }
    });

    socket.on('rejoin_game', async (data: { matchId?: string; gameId?: string; playerId?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session) { socket.emit('error', { message: 'Game not found' }); return; }
        socket.join(id);
        (socket as any).gameId = id;
        if (!gameSockets.has(id)) gameSockets.set(id, new Set());
        gameSockets.get(id)!.add(socket.id);
        socket.to(id).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
        // Send state sync to reconnecting player
        socket.emit('state_sync', { matchId: id, fen: session.fen, moves: session.moveHistory, times: { whiteMs: session.whiteTime, blackMs: session.blackTime, serverTimestamp: Date.now() }, turn: session.turn });
      } catch (e) { socket.emit('error', { message: 'Failed to rejoin game' }); }
    });

    socket.on('move', async (data: { gameId: string; from: string; to: string; promotion?: string }) => {
      try { const result = await gameService.makeMove(data.gameId, user.userId, data.from, data.to, data.promotion); if (!result.success) socket.emit('move_rejected', { error: result.error }); }
      catch (e) { socket.emit('move_rejected', { error: 'Server error' }); }
    });

    socket.on('presence', async (data: { status: string }) => {
      const gameId = (socket as any).gameId;
      if (gameId) socket.to(gameId).emit('opponent_presence', { userId: user.userId, username: user.username, status: data.status });
    });

    socket.on('resign', async (data: { gameId: string }) => { try { await gameService.resign(data.gameId, user.userId); } catch (e) { socket.emit('error', { message: 'Failed to resign' }); } });

    socket.on('disconnect', async () => {
      logger.info('Socket disconnected', { userId: user.userId });
      await matchmakingService.removeFromQueue(user.userId);
      const gameId = (socket as any).gameId;
      if (gameId) {
        socket.to(gameId).emit('opponent_disconnected', { userId: user.userId });
        gameSockets.get(gameId)?.delete(socket.id);
      }
      userSockets.delete(user.userId);
    });
  });
  logger.info('Socket events setup complete');
};

export const getUserSocketId = (userId: string): string | undefined => userSockets.get(userId);