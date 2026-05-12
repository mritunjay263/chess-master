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
        // If token provided, verify JWT
        if (token) {
            const payload = (0, jwt_1.verifyToken)(token);
            if (!payload)
                return next(new Error('Invalid token'));
            socket.user = payload;
            return next();
        }
        // Allow guest connections if userId is provided (starts with 'guest_')
        if (userId && typeof userId === 'string' && userId.startsWith('guest_')) {
            socket.user = { userId, username: `Guest_${userId.slice(6, 12)}`, email: '' };
            return next();
        }
        return next(new Error('Authentication required'));
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
                const session = await game_service_1.gameService.getGameSession(data.gameId);
                if (!session) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }
                socket.join(data.gameId);
                socket.gameId = data.gameId;
                if (!gameSockets.has(data.gameId))
                    gameSockets.set(data.gameId, new Set());
                gameSockets.get(data.gameId).add(socket.id);
                socket.to(data.gameId).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
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
                socket.to(id).emit('opponent_presence', { userId: user.userId, username: user.username, status: 'online' });
                // Send state sync to reconnecting player
                socket.emit('state_sync', { matchId: id, fen: session.fen, moves: session.moveHistory, times: { whiteMs: session.whiteTime, blackMs: session.blackTime, serverTimestamp: Date.now() }, turn: session.turn });
            }
            catch (e) {
                socket.emit('error', { message: 'Failed to rejoin game' });
            }
        });
        socket.on('move', async (data) => {
            try {
                const result = await game_service_1.gameService.makeMove(data.gameId, user.userId, data.from, data.to, data.promotion);
                if (!result.success)
                    socket.emit('move_rejected', { error: result.error });
            }
            catch (e) {
                socket.emit('move_rejected', { error: 'Server error' });
            }
        });
        socket.on('presence', async (data) => {
            const gameId = socket.gameId;
            if (gameId)
                socket.to(gameId).emit('opponent_presence', { userId: user.userId, username: user.username, status: data.status });
        });
        socket.on('resign', async (data) => { try {
            await game_service_1.gameService.resign(data.gameId, user.userId);
        }
        catch (e) {
            socket.emit('error', { message: 'Failed to resign' });
        } });
        socket.on('disconnect', async () => {
            logger.info('Socket disconnected', { userId: user.userId });
            await matchmaking_service_1.matchmakingService.removeFromQueue(user.userId);
            const gameId = socket.gameId;
            if (gameId) {
                socket.to(gameId).emit('opponent_disconnected', { userId: user.userId });
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