"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMatchmakingScheduler = void 0;
const game_service_1 = require("../services/game.service");
const matchmaking_service_1 = require("../services/matchmaking.service");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('matchmaking-scheduler');
const DEFAULT_TIME_CONTROL = { key: 'blitz5', label: 'Blitz 5+0', baseSeconds: 300, incrementSeconds: 0 };
const ioRef = { io: null };
const startMatchmakingScheduler = (io) => {
    ioRef.io = io;
    setInterval(async () => {
        try {
            const match = await matchmaking_service_1.matchmakingService.matchPlayers();
            if (!match)
                return;
            const { white, black, gameId } = match;
            logger.info('Attempting to create session for matched players', { gameId, white: white.userId, black: black.userId });
            const session = await game_service_1.gameService.createGameSession(white.userId, black.userId, gameId, {
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
        }
        catch (e) {
            logger.error('Matchmaking error', { error: e.message, stack: e.stack });
        }
    }, 1000);
    logger.info('Matchmaking scheduler started');
};
exports.startMatchmakingScheduler = startMatchmakingScheduler;
//# sourceMappingURL=matchmaking.scheduler.js.map