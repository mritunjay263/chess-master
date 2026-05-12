"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const game_routes_1 = __importDefault(require("./game.routes"));
const leaderboard_routes_1 = __importDefault(require("./leaderboard.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/game', game_routes_1.default);
router.use('/leaderboard', leaderboard_routes_1.default);
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
exports.default = router;
//# sourceMappingURL=index.js.map