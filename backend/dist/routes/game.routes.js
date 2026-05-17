"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const game_controller_1 = require("../controllers/game.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Test endpoint (no auth required)
router.get('/test', game_controller_1.gameController.test);
// History MUST come before :gameId
router.get('/history', auth_middleware_1.authenticate, game_controller_1.gameController.getHistory);
router.get('/active-game', auth_middleware_1.authenticate, game_controller_1.gameController.getActiveGame);
router.get('/queue-status', game_controller_1.gameController.getQueueStatus);
router.get('/queue-debug', auth_middleware_1.authenticate, game_controller_1.gameController.getQueueDebug);
router.post('/join-queue', auth_middleware_1.authenticate, (req, res) => game_controller_1.gameController.joinQueue(req, res));
router.post('/leave-queue', auth_middleware_1.authenticate, (req, res) => game_controller_1.gameController.leaveQueue(req, res));
router.get('/:gameId', auth_middleware_1.authenticate, game_controller_1.gameController.getGame);
router.post('/:gameId/move', auth_middleware_1.authenticate, game_controller_1.gameController.makeMove);
router.post('/:gameId/resign', auth_middleware_1.authenticate, game_controller_1.gameController.resign);
exports.default = router;
//# sourceMappingURL=game.routes.js.map