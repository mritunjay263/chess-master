"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboard_controller_1 = require("../controllers/leaderboard.controller");
const router = (0, express_1.Router)();
router.get('/', leaderboard_controller_1.leaderboardController.getLeaderboard);
router.get('/rank/:userId', leaderboard_controller_1.leaderboardController.getUserRank);
exports.default = router;
//# sourceMappingURL=leaderboard.routes.js.map