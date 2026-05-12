"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
class Logger {
    context;
    constructor(context) { this.context = context; }
    log(level, message, meta) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] [${level.toUpperCase()}] [${this.context}] ${message}`, meta || '');
    }
    debug(m, x) { this.log('debug', m, x); }
    info(m, x) { this.log('info', m, x); }
    warn(m, x) { this.log('warn', m, x); }
    error(m, x) { this.log('error', m, x); }
}
const createLogger = (ctx) => new Logger(ctx);
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map