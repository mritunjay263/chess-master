"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const router = (0, express_1.Router)();
router.get('/best-move', ai_controller_1.aiController.getBestMove);
router.get('/suggestions', ai_controller_1.aiController.getMoveSuggestions);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map