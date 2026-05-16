"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.userController = {
    async getStats(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    elo: true,
                    wins: true,
                    losses: true,
                    draws: true,
                    gamesPlayed: true,
                },
            });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            // Calculate average game length from recent games
            const recentGames = await prisma_1.default.game.findMany({
                where: {
                    OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
                    status: { not: 'IN_PROGRESS' },
                    completedAt: { not: null },
                },
                orderBy: { completedAt: 'desc' },
                take: 10,
            });
            let avgGameLengthMs = 0;
            if (recentGames.length > 0) {
                const totalDuration = recentGames.reduce((sum, game) => {
                    const duration = game.completedAt && game.createdAt
                        ? game.completedAt.getTime() - game.createdAt.getTime()
                        : 0;
                    return sum + duration;
                }, 0);
                avgGameLengthMs = Math.round(totalDuration / recentGames.length);
            }
            res.json({
                rating: user.elo,
                wins: user.wins,
                losses: user.losses,
                draws: user.draws,
                avgGameLengthMs,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    elo: true,
                    wins: true,
                    losses: true,
                    draws: true,
                    gamesPlayed: true,
                    createdAt: true,
                },
            });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { username, fcmToken } = req.body;
            const updateData = {};
            if (username) {
                // Check if username is taken
                const existing = await prisma_1.default.user.findFirst({
                    where: { username, NOT: { id: userId } },
                });
                if (existing) {
                    res.status(400).json({ error: 'Username already taken' });
                    return;
                }
                updateData.username = username;
            }
            if (fcmToken) {
                updateData.fcmToken = fcmToken;
            }
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({ error: 'No fields to update' });
                return;
            }
            const user = await prisma_1.default.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    elo: true,
                    wins: true,
                    losses: true,
                    draws: true,
                    gamesPlayed: true,
                },
            });
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};
//# sourceMappingURL=user.controller.js.map