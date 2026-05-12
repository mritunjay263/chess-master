"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const register_dto_1 = require("../dto/register.dto");
const login_dto_1 = require("../dto/login.dto");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_middleware_1.validate)(register_dto_1.registerDto), auth_controller_1.authController.register);
router.post('/login', (0, validation_middleware_1.validate)(login_dto_1.loginDto), auth_controller_1.authController.login);
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.authController.getProfile);
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.authController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map