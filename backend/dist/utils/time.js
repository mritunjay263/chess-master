"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTimeOut = exports.formatTime = void 0;
const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
exports.formatTime = formatTime;
const isTimeOut = (timeLeft) => timeLeft <= 0;
exports.isTimeOut = isTimeOut;
//# sourceMappingURL=time.js.map