"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketServer = void 0;
const socket_io_1 = require("socket.io");
const createSocketServer = (httpServer) => {
    return new socket_io_1.Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket'],
    });
};
exports.createSocketServer = createSocketServer;
//# sourceMappingURL=socket.js.map