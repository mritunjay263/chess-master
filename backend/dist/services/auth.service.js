"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('auth-service');
class AuthService {
    async register(data) {
        const exists = await prisma_1.default.user.findFirst({ where: { OR: [{ email: data.email }, { username: data.username }] } });
        if (exists)
            throw new Error('Email or username already exists');
        const passwordHash = await bcrypt_1.default.hash(data.password, 12);
        const user = await prisma_1.default.user.create({
            data: { email: data.email, username: data.username, passwordHash, elo: 1000 },
            select: { id: true, email: true, username: true, elo: true, createdAt: true }
        });
        const token = this.generateToken(user.id, user.email, user.username);
        logger.info('User registered', { userId: user.id });
        return { user, token };
    }
    async login(data) {
        const user = await prisma_1.default.user.findUnique({ where: { email: data.email } });
        if (!user || !(await bcrypt_1.default.compare(data.password, user.passwordHash)))
            throw new Error('Invalid credentials');
        const token = this.generateToken(user.id, user.email, user.username);
        logger.info('User logged in', { userId: user.id });
        return { user: { id: user.id, email: user.email, username: user.username, elo: user.elo, wins: user.wins, losses: user.losses, draws: user.draws, gamesPlayed: user.gamesPlayed }, token };
    }
    async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, select: { id: true, email: true, username: true, elo: true, wins: true, losses: true, draws: true, gamesPlayed: true, createdAt: true } });
        if (!user)
            throw new Error('User not found');
        return user;
    }
    generateToken(userId, email, username) {
        return (0, jwt_1.generateToken)({ userId, email, username });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map