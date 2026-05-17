"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const socket_1 = require("./config/socket");
const game_socket_1 = require("./websocket/game.socket");
const logger_1 = require("./utils/logger");
const logger = (0, logger_1.createLogger)('server');
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    try {
        const app = (0, app_1.createApp)();
        const httpServer = http_1.default.createServer(app);
        const io = (0, socket_1.createSocketServer)(httpServer);
        (0, game_socket_1.initializeGameSocket)(io);
        httpServer.listen(Number(PORT), '0.0.0.0', () => {
            logger.info(`Server running on 0.0.0.0:${PORT}`);
        });
    }
    catch (error) {
        logger.error('Failed to start server', { error: error.message });
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map