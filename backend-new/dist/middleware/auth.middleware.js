"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token' });
        return;
    }
    const payload = (0, jwt_1.verifyToken)(auth.substring(7));
    if (!payload) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
    req.user = payload;
    next();
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map