"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSocketId = exports.setupSocketEvents = void 0;
const game_service_1 = require("../services/game.service");
const matchmaking_service_1 = require("../services/matchmaking.service");
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger = (0, logger_1.createLogger)('socket-events');
const userSockets = new Map();
const gameSockets = new Map();
const setupSocketEvents = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        const userId = socket.handshake.auth.userId;
        logger.info('Socket auth attempt', { hasToken: !!token, userId: userId ?? 'none', ip: socket.handshake.address });
        // If token provided, verify JWT
        if (token) {
            const payload = (0, jwt_1.verifyToken)(token);
            if (!payload) {
                logger.warn('Socket auth rejected: invalid token', { userId });
                return next(new Error('Invalid token'));
            }
            socket.user = payload;
            return next();
        }
        // Allow guest connections if userId is provided (starts with 'guest_')
        if (userId && typeof userId === 'string' && userId.startsWith('guest_')) {
            socket.user = { userId, username: `Guest_${userId.slice(6, 12)}`, email: '' };
            return next();
        }
        logger.warn('Socket auth rejected: no token or guest userId', { userId });
        return next(new Error('Authentication required'));
    });
    io.engine.on('connection_error', (err) => {
        logger.error('Socket engine connection error', { code: err.code, message: err.message, context: err.context });
    });
    io.on('connection', async (socket) => {
        const user = socket.user;
        logger.info('Socket connected', { userId: user.userId, socketId: socket.id });
        userSockets.set(user.userId, socket.id);
        // ensure we can address this user by their userId room
        try {
            socket.join(user.userId);
        }
        catch (e) { /* ignore */ }
        socket.on('join_queue', async (data) => {
            try {
                const dbUser = await prisma_1.default.user.findUnique({ where: { id: user.userId }, select: { elo: true } });
                const elo = dbUser?.elo ?? 1200;
                const added = await matchmaking_service_1.matchmakingService.addToQueue({
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
                logger.info('Player joined queue', { userId: user.userId, elo, queueLength: await matchmaking_service_1.matchmakingService.getQueueLength() });
            }
            catch (e) {
                logger.error('join_queue error', { error: e.message });
                socket.emit('error', { code: 'QUEUE_ERROR', message: 'Failed to join queue' });
            }
        });
        socket.on('leave_queue', async () => {
            try {
                await matchmaking_service_1.matchmakingService.removeFromQueue(user.userId);
                logger.info('Player left queue', { userId: user.userId });
            }
            catch (e) { /* ignore */ }
        });
        socket.on('join_game', async (data) => {
            try {
                const id = data.matchId || data.gameId;
                if (!id) {
                    socket.emit('error', { message: 'No game ID provided' });
                    return;
                }
                const session = await game_service_1.gameService.getGameSession(id);
                if (!session) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }
                socket.join(id);
                socket.gameId = id;
                if (!gameSockets.has(id))
                    gameSockets.set(id, new Set());
                gameSockets.get(id).add(socket.id);
                socket.to(id).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
            }
            catch (e) {
                socket.emit('error', { message: 'Failed to join game' });
            }
        });
        socket.on('rejoin_game', async (data) => {
            try {
                const id = data.matchId || data.gameId;
                if (!id)
                    return;
                const session = await game_service_1.gameService.getGameSession(id);
                if (!session) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }
                socket.join(id);
                socket.gameId = id;
                if (!gameSockets.has(id))
                    gameSockets.set(id, new Set());
                gameSockets.get(id).add(socket.id);
                logger.info('Player rejoined game', { gameId: id, userId: user.userId, socketId: socket.id });
                socket.to(id).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
                // Send state sync to reconnecting player
                socket.emit('state_sync', { matchId: id, fen: session.fen, moves: session.moveHistory, times: { whiteMs: session.whiteTime, blackMs: session.blackTime, serverTimestamp: Date.now() }, turn: session.turn });
                logger.info('State sync sent', { gameId: id, fen: session.fen.substring(0, 20) });
            }
            catch (e) {
                logger.error('Rejoin error', { error: e.message });
                socket.emit('error', { message: 'Failed to rejoin game' });
            }
        });
        socket.on('move', async (data) => {
            try {
                const id = data.matchId || data.gameId;
                if (!id) {
                    socket.emit('move_rejected', { error: 'No game ID' });
                    return;
                }
                logger.info('Move received', { gameId: id, userId: user.userId, from: data.from, to: data.to });
                const result = await game_service_1.gameService.makeMove(id, user.userId, data.from, data.to, data.promotion);
                if (!result.success) {
                    logger.warn('Move rejected', { gameId: id, userId: user.userId, error: result.error });
                    socket.emit('move_rejected', { error: result.error });
                }
                else {
                    logger.info('Move accepted and broadcasted', { gameId: id, from: data.from, to: data.to });
                }
            }
            catch (e) {
                logger.error('Move error', { error: e.message });
                socket.emit('move_rejected', { error: 'Server error' });
            }
        });
        socket.on('presence', async (data) => {
            const gameId = socket.gameId;
            if (gameId)
                socket.to(gameId).emit('opponent_presence', { userId: user.userId, username: user.username, status: data.status });
        });
        socket.on('resign', async (data) => {
            try {
                const id = data.matchId || data.gameId;
                if (!id) {
                    socket.emit('error', { message: 'No game ID' });
                    return;
                }
                logger.info('Resign received', { gameId: id, userId: user.userId, reason: data.reason });
                if (data.reason === 'timeout' && data.flaggedColor) {
                    await game_service_1.gameService.handleTimeout(id, data.flaggedColor);
                }
                else {
                    await game_service_1.gameService.resign(id, user.userId);
                }
            }
            catch (e) {
                logger.error('Resign error', { error: e.message });
                socket.emit('error', { message: 'Failed to resign' });
            }
        });
        socket.on('offer_draw', async (data) => {
            try {
                const id = data.matchId || data.gameId || socket.gameId;
                if (!id) {
                    socket.emit('error', { message: 'No game ID for draw' });
                    return;
                }
                const session = await game_service_1.gameService.getGameSession(id);
                if (!session) {
                    socket.emit('error', { message: 'Game not found for draw' });
                    return;
                }
                if (session.status !== 'in_progress') {
                    socket.emit('error', { message: 'Game not in progress' });
                    return;
                }
                const isWhite = user.userId === session.whitePlayerId;
                const byColor = isWhite ? 'w' : 'b';
                logger.info('Draw offered', { gameId: id, by: user.userId, byColor });
                socket.to(id).emit('draw_offered', { matchId: id, by: byColor });
            }
            catch (e) {
                logger.error('offer_draw error', { error: e.message });
            }
        });
        socket.on('accept_draw', async (data) => {
            try {
                const id = data.matchId || data.gameId || socket.gameId;
                if (!id)
                    return;
                const session = await game_service_1.gameService.getGameSession(id);
                if (!session || session.status !== 'in_progress')
                    return;
                const updatedSession = { ...session, status: 'draw' };
                game_service_1.gameService.setSession?.(id, updatedSession);
                // Use the gameService's handleGameEnd
                await game_service_1.gameService.acceptDraw(id);
            }
            catch (e) {
                logger.error('accept_draw error', { error: e.message });
            }
        });
        socket.on('decline_draw', async (data) => {
            try {
                const id = data.matchId || data.gameId || socket.gameId;
                if (!id)
                    return;
                logger.info('Draw declined', { gameId: id, by: user.userId });
                socket.to(id).emit('draw_declined', { matchId: id });
            }
            catch (e) {
                logger.error('decline_draw error', { error: e.message });
            }
        });
        socket.on('disconnect', async () => {
            logger.info('Socket disconnected', { userId: user.userId });
            await matchmaking_service_1.matchmakingService.removeFromQueue(user.userId);
            const gameId = socket.gameId;
            if (gameId) {
                socket.to(gameId).emit('opponent_left', { userId: user.userId });
                gameSockets.get(gameId)?.delete(socket.id);
            }
            userSockets.delete(user.userId);
        });
    });
    logger.info('Socket events setup complete');
};
exports.setupSocketEvents = setupSocketEvents;
const getUserSocketId = (userId) => userSockets.get(userId);
exports.getUserSocketId = getUserSocketId;
//# sourceMappingURL=socketEvents.js.map