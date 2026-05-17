"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('auth-controller');
exports.authController = {
    async register(req, res) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            logger.error('Registration failed', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    },
    async login(req, res) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.json(result);
        }
        catch (error) {
            logger.error('Login failed', { error: error.message });
            res.status(401).json({ error: error.message });
        }
    },
    async getProfile(req, res) {
        try {
            const user = await auth_service_1.authService.getProfile(req.user.userId);
            res.json(user);
        }
        catch (error) {
            logger.error('Get profile failed', { error: error.message });
            res.status(404).json({ error: error.message });
        }
    },
    async logout(req, res) {
        logger.info('User logged out', { userId: req.user?.userId });
        res.json({ success: true, message: 'Logged out successfully' });
    },
};
//# sourceMappingURL=auth.controller.js.map