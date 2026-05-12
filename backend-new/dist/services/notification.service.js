"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const firebase_1 = __importDefault(require("../config/firebase"));
const prisma_1 = __importDefault(require("../config/prisma"));
class NotificationService {
    async sendNotification(userId, title, body, data) {
        try {
            const user = await prisma_1.default.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
            if (!user?.fcmToken)
                return;
            await firebase_1.default.messaging().send({ notification: { title, body }, data: data || {}, token: user.fcmToken });
        }
        catch (e) {
            console.log('Notification error:', e.message);
        }
    }
    async notifyYourTurn(userId, opponent) {
        await this.sendNotification(userId, 'Your Turn', `${opponent} made a move. It's your turn!`, { type: 'your_turn' });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map