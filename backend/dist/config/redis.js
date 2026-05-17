"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Redis is optional - just use a mock for now
exports.default = {
    get: async (key) => null,
    set: async (key, value) => { },
    del: async (key) => { },
    lpush: async (key, value) => { },
    lpop: async () => null,
    lrem: async () => { },
    lrange: async () => [],
    llen: async () => 0,
    on: () => { },
};
//# sourceMappingURL=redis.js.map