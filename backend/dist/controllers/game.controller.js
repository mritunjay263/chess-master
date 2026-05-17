"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameController = void 0;
const game_service_1 = require("../services/game.service");
const matchmaking_service_1 = require("../services/matchmaking.service");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('game-controller');
exports.gameController = {
    async test(req, res) {
        try {
            logger.info('Test endpoint hit', { method: req.method, body: req.body });
            res.json({ success: true, message: 'Backend is reachable', timestamp: new Date().toISOString() });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async joinQueue(req, res) {
        try {
            const userId = req.user.userId;
            const { username, elo } = req.body;
            logger.info('joinQueue request', { userId, username, elo, bodyKeys: Object.keys(req.body) });
            if (!username || elo === undefined) {
                logger.warn('joinQueue missing username or elo', { userId, username, elo });
                res.status(400).json({ error: 'Missing username or elo in request body' });
                return;
            }
            // Auto-remove the player first to ensure a clean state
            await matchmaking_service_1.matchmakingService.removeFromQueue(userId);
            logger.info('joinQueue cleaned up existing queue entry', { userId });
            const added = await matchmaking_service_1.matchmakingService.addToQueue({ userId, username, elo, timestamp: Date.now() });
            if (!added) {
                logger.info('joinQueue rejected - could not add', { userId });
                res.status(400).json({ error: 'Failed to join queue' });
                return;
            }
            const position = await matchmaking_service_1.matchmakingService.getQueuePosition(userId);
            logger.info('joinQueue success', { userId, position });
            res.json({ message: 'Joined queue', position });
        }
        catch (error) {
            logger.error('joinQueue error', { error: error.message, stack: error.stack });
            res.status(500).json({ error: error.message });
        }
    },
    async leaveQueue(req, res) {
        try {
            const userId = req.user.userId;
            await matchmaking_service_1.matchmakingService.removeFromQueue(userId);
            res.json({ message: 'Left queue' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getQueueStatus(req, res) {
        try {
            const queueLength = await matchmaking_service_1.matchmakingService.getQueueLength();
            const position = req.query.userId ? await matchmaking_service_1.matchmakingService.getQueuePosition(req.query.userId) : -1;
            res.json({ queueLength, position });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getGame(req, res) {
        try {
            const session = await game_service_1.gameService.getGameSession(req.params.gameId);
            if (!session) {
                res.status(404).json({ error: 'Game not found' });
                return;
            }
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async makeMove(req, res) {
        try {
            const result = await game_service_1.gameService.makeMove(req.params.gameId, req.user.userId, req.body.from, req.body.to, req.body.promotion);
            if (!result.success) {
                res.status(400).json({ error: result.error });
                return;
            }
            res.json(result.session);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async resign(req, res) {
        try {
            const result = await game_service_1.gameService.resign(req.params.gameId, req.user.userId);
            if (!result.success) {
                res.status(400).json({ error: result.error });
                return;
            }
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getHistory(req, res) {
        try {
            const history = await game_service_1.gameService.getGameHistory(req.user.userId, parseInt(req.query.limit) || 20, parseInt(req.query.offset) || 0);
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getActiveGame(req, res) {
        try {
            const session = await game_service_1.gameService.getActiveGame(req.user.userId);
            if (!session) {
                res.status(404).json({ error: 'No active game' });
                return;
            }
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getQueueDebug(req, res) {
        try {
            const queueInfo = await matchmaking_service_1.matchmakingService.getQueueInfo();
            const queueLength = await matchmaking_service_1.matchmakingService.getQueueLength();
            logger.info('getQueueDebug called', { queueLength, playerCount: queueInfo.length });
            res.json({ queueLength, players: queueInfo.map(p => ({ userId: p.userId, username: p.username, elo: p.elo })) });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};
//# sourceMappingURL=game.controller.js.map