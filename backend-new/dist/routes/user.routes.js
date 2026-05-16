"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/stats', auth_middleware_1.authenticate, user_controller_1.userController.getStats);
router.get('/:userId', user_controller_1.userController.getUserById);
router.put('/profile', auth_middleware_1.authenticate, user_controller_1.userController.updateProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map