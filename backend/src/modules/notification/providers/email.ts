import nodemailer from 'nodemailer';
import { config } from '../../../config';
import { INotificationProvider } from './interface';

export class EmailProvider implements INotificationProvider {
  channel = 'EMAIL';
  private transporter: nodemailer.Transporter;

  constructor() {
    // Use real SMTP if credentials provided, else use a console/preview transport
    if (config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } else {
      // Fallback: log emails to console (no real sending)
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
      });
      console.log('📧 Email: Using console transport (no SMTP credentials configured)');
    }
  }

  async send(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html: body,
      });

      // If using stream transport, log the email content
      if (!config.smtp.user) {
        console.log(`📧 [EMAIL] To: ${to} | Subject: ${subject}`);
        console.log(`   Body preview: ${body.substring(0, 200)}...`);
      }

      return true;
    } catch (err) {
      console.error('Email send error:', err);
      return false;
    }
  }
}
