"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    database: { url: process.env.DATABASE_URL || '' },
    redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
    chess: { initialTime: 600000, increment: 0 },
};
exports.default = exports.config;
//# sourceMappingURL=env.js.map