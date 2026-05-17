"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGameSocket = void 0;
const game_service_1 = require("../services/game.service");
const socketEvents_1 = require("./socketEvents");
const matchmaking_scheduler_1 = require("./matchmaking.scheduler");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('game-socket');
const initializeGameSocket = (io) => {
    game_service_1.gameService.setSocketIO(io);
    (0, socketEvents_1.setupSocketEvents)(io);
    (0, matchmaking_scheduler_1.startMatchmakingScheduler)(io);
    logger.info('Game socket initialized');
};
exports.initializeGameSocket = initializeGameSocket;
//# sourceMappingURL=game.socket.js.map