import { INotificationProvider } from './interface';

/**
 * SMS stub provider — logs to console.
 * Swap with Twilio or any real SMS provider by implementing INotificationProvider.
 */
export class SMSProvider implements INotificationProvider {
  channel = 'SMS';

  async send(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`📱 [SMS STUB] To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body.substring(0, 160)}`);
    return true;
  }
}
