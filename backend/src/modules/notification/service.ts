import prisma from '../../config/database';
import { INotificationProvider } from './providers/interface';
import { EmailProvider } from './providers/email';
import { SMSProvider } from './providers/sms';
import { OrderStatus, NotificationType, NotificationChannel } from '../../types/enums';
import { STATUS_LABELS } from '../../utils/statusTransitions';

export class NotificationService {
  private emailProvider: INotificationProvider;
  private smsProvider: INotificationProvider;

  constructor() {
    this.emailProvider = new EmailProvider();
    this.smsProvider = new SMSProvider();
  }

  async notifyStatusChange(orderId: string, newStatus: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, pickupZone: true, dropZone: true },
    });

    if (!order) return;

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const subject = `Order Update: Your order #${order.id.slice(0, 8)} is now ${statusLabel}`;
    const body = this.buildStatusEmailBody(order, statusLabel);

    const emailSent = await this.emailProvider.send(order.customer.email, subject, body);

    await prisma.notification.create({
      data: {
        orderId: order.id,
        userId: order.customerId,
        type: NotificationType.STATUS_CHANGE,
        channel: NotificationChannel.EMAIL,
        status: emailSent ? 'SENT' : 'FAILED',
        subject,
        body,
        sentAt: emailSent ? new Date() : null,
      },
    });

    await this.smsProvider.send(
      order.customer.phone || '',
      subject,
      `Your order #${order.id.slice(0, 8)} status: ${statusLabel}`
    );
  }

  async notifyReschedule(orderId: string, newDate: Date) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) return;

    const subject = `Order Rescheduled: #${order.id.slice(0, 8)}`;
    const body = this.buildRescheduleEmailBody(order, newDate);

    const emailSent = await this.emailProvider.send(order.customer.email, subject, body);

    await prisma.notification.create({
      data: {
        orderId: order.id,
        userId: order.customerId,
        type: NotificationType.RESCHEDULE,
        channel: NotificationChannel.EMAIL,
        status: emailSent ? 'SENT' : 'FAILED',
        subject,
        body,
        sentAt: emailSent ? new Date() : null,
      },
    });
  }

  private buildStatusEmailBody(order: any, statusLabel: string): string {
    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 24px; margin: 0;">
            📦 LastMile Delivery
          </h1>
        </div>
        <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h2 style="color: #f1f5f9; margin-top: 0;">Order Status Update</h2>
          <p style="color: #94a3b8;">Your order <strong style="color: #a5b4fc;">#${order.id.slice(0, 8)}</strong> has been updated.</p>
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px; margin: 8px 0;">
            ${statusLabel}
          </div>
        </div>
        <div style="background: #1e293b; border-radius: 12px; padding: 24px;">
          <h3 style="color: #f1f5f9; margin-top: 0;">Order Details</h3>
          <table style="width: 100%; color: #94a3b8; font-size: 14px;">
            <tr><td style="padding: 4px 0;">Pickup:</td><td style="text-align: right;">${order.pickupAddress}</td></tr>
            <tr><td style="padding: 4px 0;">Drop:</td><td style="text-align: right;">${order.dropAddress}</td></tr>
            <tr><td style="padding: 4px 0;">Total Charge:</td><td style="text-align: right; color: #a5b4fc; font-weight: 600;">₹${order.totalCharge.toFixed(2)}</td></tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">
          © LastMile Delivery Platform
        </p>
      </div>
    `;
  }

  private buildRescheduleEmailBody(order: any, newDate: Date): string {
    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 24px; margin: 0;">
            📦 LastMile Delivery
          </h1>
        </div>
        <div style="background: #1e293b; border-radius: 12px; padding: 24px;">
          <h2 style="color: #f1f5f9; margin-top: 0;">Order Rescheduled</h2>
          <p style="color: #94a3b8;">Your order <strong style="color: #a5b4fc;">#${order.id.slice(0, 8)}</strong> has been rescheduled.</p>
          <p style="color: #a5b4fc; font-weight: 600;">New Delivery Date: ${newDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="color: #94a3b8;">A delivery agent will be reassigned for the new attempt.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">
          © LastMile Delivery Platform
        </p>
      </div>
    `;
  }
}
