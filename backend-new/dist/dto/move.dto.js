"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveDto = void 0;
const zod_1 = require("zod");
exports.moveDto = zod_1.z.object({
    gameId: zod_1.z.string().uuid(),
    from: zod_1.z.string().length(2),
    to: zod_1.z.string().length(2),
    promotion: zod_1.z.enum(['q', 'r', 'b', 'n']).optional(),
});
//# sourceMappingURL=move.dto.js.map