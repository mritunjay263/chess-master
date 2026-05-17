"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginDto = void 0;
const zod_1 = require("zod");
exports.loginDto = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) });
//# sourceMappingURL=login.dto.js.map