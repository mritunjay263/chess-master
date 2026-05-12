"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDto = void 0;
const zod_1 = require("zod");
exports.registerDto = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email'),
    username: zod_1.z.string().min(3).max(20),
    password: zod_1.z.string().min(6),
});
//# sourceMappingURL=register.dto.js.map