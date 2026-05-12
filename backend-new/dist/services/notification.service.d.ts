export declare class NotificationService {
    sendNotification(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
    notifyYourTurn(userId: string, opponent: string): Promise<void>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map