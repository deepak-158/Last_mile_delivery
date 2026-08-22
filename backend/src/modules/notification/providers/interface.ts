/**
 * Notification provider interface.
 * Implement this to add new notification channels (Email, SMS, Push, etc.)
 */
export interface INotificationProvider {
  channel: string;
  send(to: string, subject: string, body: string): Promise<boolean>;
}
