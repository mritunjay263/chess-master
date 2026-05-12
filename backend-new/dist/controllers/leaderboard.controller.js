"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardController = void 0;
const elo_service_1 = require("../services/elo.service");
exports.leaderboardController = {
    async getLeaderboard(req, res) { try {
        const limit = parseInt(req.query.limit) || 50;
        const leaderboard = await elo_service_1.eloService.getLeaderboard(limit);
        res.json(leaderboard);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    } },
    async getUserRank(req, res) { try {
        const leaderboard = await elo_service_1.eloService.getLeaderboard(1000);
        const rank = leaderboard.findIndex((u) => u.id === req.params.userId);
        if (rank === -1) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ rank: rank + 1 });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    } },
};
//# sourceMappingURL=leaderboard.controller.js.map