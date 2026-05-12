"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) });
        return;
    }
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map