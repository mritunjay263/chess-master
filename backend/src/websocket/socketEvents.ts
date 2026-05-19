import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { createLogger } from '../utils/logger';
import prisma from '../config/prisma';

const logger = createLogger('socket-events');

const userSockets = new Map<string, string>();
const gameSockets = new Map<string, Set<string>>();
const rematchRequests = new Map<string, Set<string>>(); // gameId -> Set of userIds who want rematch

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

    socket.on('join_game', async (data: { gameId?: string; matchId?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) { socket.emit('error', { message: 'No game ID provided' }); return; }
        const session = await gameService.getGameSession(id);
        if (!session) { socket.emit('error', { message: 'Game not found' }); return; }
        socket.join(id);
        (socket as any).gameId = id;
        
        if (!gameSockets.has(id)) gameSockets.set(id, new Set());
        gameSockets.get(id)!.add(socket.id);
        
        socket.to(id).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
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
        logger.info('Player rejoined game', { gameId: id, userId: user.userId, socketId: socket.id });
        socket.to(id).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
        // Send state sync to reconnecting player
        socket.emit('state_sync', { matchId: id, fen: session.fen, moves: session.moveHistory, times: { whiteMs: session.whiteTime, blackMs: session.blackTime, serverTimestamp: Date.now() }, turn: session.turn });
        logger.info('State sync sent', { gameId: id, fen: session.fen.substring(0, 20) });
      } catch (e) { logger.error('Rejoin error', { error: (e as Error).message }); socket.emit('error', { message: 'Failed to rejoin game' }); }
    });

    socket.on('move', async (data: { gameId?: string; matchId?: string; from: string; to: string; promotion?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) { socket.emit('move_rejected', { error: 'No game ID' }); return; }
        logger.info('Move received', { gameId: id, userId: user.userId, from: data.from, to: data.to });
        const result = await gameService.makeMove(id, user.userId, data.from, data.to, data.promotion);
        if (!result.success) {
          logger.warn('Move rejected', { gameId: id, userId: user.userId, error: result.error });
          socket.emit('move_rejected', { error: result.error });
        } else {
          logger.info('Move accepted and broadcasted', { gameId: id, from: data.from, to: data.to });
        }
      } catch (e) { logger.error('Move error', { error: (e as Error).message }); socket.emit('move_rejected', { error: 'Server error' }); }
    });

    socket.on('presence', async (data: { status: string }) => {
      const gameId = (socket as any).gameId;
      if (gameId) socket.to(gameId).emit('opponent_presence', { userId: user.userId, username: user.username, status: data.status });
    });

    socket.on('resign', async (data: { gameId?: string; matchId?: string; reason?: string; flaggedColor?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) { socket.emit('error', { message: 'No game ID' }); return; }
        logger.info('Resign received', { gameId: id, userId: user.userId, reason: data.reason });
        if (data.reason === 'timeout' && data.flaggedColor) {
          await gameService.handleTimeout(id, data.flaggedColor as 'w' | 'b');
        } else {
          await gameService.resign(id, user.userId);
        }
      } catch (e) { logger.error('Resign error', { error: (e as Error).message }); socket.emit('error', { message: 'Failed to resign' }); }
    });

    socket.on('offer_draw', async (data: { matchId?: string; gameId?: string }) => {
      try {
        const id = data.matchId || data.gameId || (socket as any).gameId;
        if (!id) { socket.emit('error', { message: 'No game ID for draw' }); return; }
        const session = await gameService.getGameSession(id);
        if (!session) { socket.emit('error', { message: 'Game not found for draw' }); return; }
        if (session.status !== 'in_progress') { socket.emit('error', { message: 'Game not in progress' }); return; }
        const isWhite = user.userId === session.whitePlayerId;
        const byColor = isWhite ? 'w' : 'b';
        logger.info('Draw offered', { gameId: id, by: user.userId, byColor });
        socket.to(id).emit('draw_offered', { matchId: id, by: byColor });
      } catch (e) { logger.error('offer_draw error', { error: (e as Error).message }); }
    });

    socket.on('accept_draw', async (data: { matchId?: string; gameId?: string }) => {
      try {
        const id = data.matchId || data.gameId || (socket as any).gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session || session.status !== 'in_progress') return;
        await gameService.acceptDraw(id);
      } catch (e) { logger.error('accept_draw error', { error: (e as Error).message }); }
    });

    socket.on('decline_draw', async (data: { matchId?: string; gameId?: string }) => {
      try {
        const id = data.matchId || data.gameId || (socket as any).gameId;
        if (!id) return;
        logger.info('Draw declined', { gameId: id, by: user.userId });
        socket.to(id).emit('draw_declined', { matchId: id });
      } catch (e) { logger.error('decline_draw error', { error: (e as Error).message }); }
    });

    socket.on('rematch_request', async (data: { matchId?: string; gameId?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session) return;
        if (user.userId !== session.whitePlayerId && user.userId !== session.blackPlayerId) return;
        if (!rematchRequests.has(id)) rematchRequests.set(id, new Set());
        rematchRequests.get(id)!.add(user.userId);
        const opponentId = user.userId === session.whitePlayerId ? session.blackPlayerId : session.whitePlayerId;
        const byColor = user.userId === session.whitePlayerId ? 'w' : 'b';
        io.to(opponentId).emit('rematch_offered', { matchId: id, by: byColor });
        logger.info('Rematch requested', { gameId: id, by: user.userId });
      } catch (e) { logger.error('rematch_request error', { error: (e as Error).message }); }
    });

    socket.on('rematch_accept', async (data: { matchId?: string; gameId?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session) return;
        if (user.userId !== session.whitePlayerId && user.userId !== session.blackPlayerId) return;
        const reqs = rematchRequests.get(id);
        if (!reqs) return;
        reqs.add(user.userId);
        const opponentId = user.userId === session.whitePlayerId ? session.blackPlayerId : session.whitePlayerId;
        // Both players accepted? Create new game
        if (reqs.has(session.whitePlayerId) && reqs.has(session.blackPlayerId)) {
          rematchRequests.delete(id);
          const newGameId = uuidv4();
          const newSession = await gameService.createGameSession(
            session.whitePlayerId, session.blackPlayerId, newGameId,
            { whiteUsername: session.whitePlayerUsername, blackUsername: session.blackPlayerUsername, whiteElo: session.whiteElo, blackElo: session.blackElo },
          );
          if (!newSession) return;
          // Determine colors: swap
          const payload = {
            matchId: newGameId,
            newMatchId: newGameId,
            white: { id: session.whitePlayerId, username: session.whitePlayerUsername, rating: session.whiteElo },
            black: { id: session.blackPlayerId, username: session.blackPlayerUsername, rating: session.blackElo },
            timeControl: { key: 'blitz5', label: 'Blitz 5+0', baseSeconds: 300, incrementSeconds: 0 },
            myColor: 'w' as const,
          };
          // Send to each player with their own myColor
          io.to(session.whitePlayerId).emit('rematch_ready', { ...payload, myColor: 'w' });
          io.to(session.blackPlayerId).emit('rematch_ready', { ...payload, myColor: 'b' });
          logger.info('Rematch accepted, new game created', { oldGameId: id, newGameId });
        }
      } catch (e) { logger.error('rematch_accept error', { error: (e as Error).message }); }
    });

    socket.on('rematch_decline', async (data: { matchId?: string; gameId?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) return;
        rematchRequests.delete(id);
        logger.info('Rematch declined', { gameId: id, by: user.userId });
      } catch (e) { logger.error('rematch_decline error', { error: (e as Error).message }); }
    });

    socket.on('disconnect', async () => {
      logger.info('Socket disconnected', { userId: user.userId });
      await matchmakingService.removeFromQueue(user.userId);
      const gameId = (socket as any).gameId;
      if (gameId) {
        socket.to(gameId).emit('opponent_left', { userId: user.userId });
        gameSockets.get(gameId)?.delete(socket.id);
      }
      userSockets.delete(user.userId);
    });
  });
  logger.info('Socket events setup complete');
};

export const getUserSocketId = (userId: string): string | undefined => userSockets.get(userId);