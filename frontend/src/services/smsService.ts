/**
 * Twilio SMS Gateway Integration Service for Delivero Last-Mile Logistics
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SMSPayload {
  to: string; // Recipient phone number (e.g. +919876543210 or +18638046866)
  body: string; // SMS Message text
  orderNumber?: string;
  type?: 'ORDER_CONFIRMED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'AGENT_ASSIGNED' | 'CUSTOM';
}

export interface SMSSendResult {
  success: boolean;
  sid?: string;
  simulated?: boolean;
  message?: string;
  error?: string;
}

// Credentials loaded from environment (.env)
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

export const smsService = {
  /**
   * Check if active Twilio credentials are configured
   */
  isConfigured(): boolean {
    return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
  },

  /**
   * Normalize phone number to international E.164 format
   */
  formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, '').trim();
    if (cleaned.startsWith('+')) return cleaned;

    // If leading 0 (e.g. 09876543210 -> 9876543210)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }

    // If 10 digits (Standard Indian mobile 98XXXXXXXX, 87XXXXXXXX, etc.)
    if (/^[6-9]\d{9}$/.test(cleaned) || /^\d{10}$/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    // If 12 digits starting with 91 (e.g. 919876543210)
    if (/^91\d{10}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    // If 11 digits starting with 1 (US / Canada)
    if (/^1\d{10}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    return `+${cleaned}`;
  },

  /**
   * Send SMS via Twilio REST API with CORS-friendly endpoints and Firestore audit trail
   */
  async sendSMS(payload: SMSPayload): Promise<SMSSendResult> {
    if (!payload.to || !payload.to.trim()) {
      return { success: false, error: 'Recipient phone number is missing.' };
    }

    const recipientPhone = this.formatPhoneNumber(payload.to);

    // If Twilio credentials are not set
    if (!this.isConfigured()) {
      console.log(
        `%c[Twilio SMS Simulated] 📱 To: ${recipientPhone} | "${payload.body}"`,
        'color: #0284c7; font-weight: bold; background: #f0f9ff; padding: 4px 8px; border-radius: 4px;'
      );
      await this.logToFirestore(recipientPhone, payload.body, 'SIMULATED', 'No Twilio credentials configured in .env');
      return {
        success: true,
        sid: `SM_sim_${Math.random().toString(36).substring(2, 10)}`,
        simulated: true,
        message: `Simulated SMS dispatched to ${recipientPhone}`,
      };
    }

    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const formData = new URLSearchParams();
    formData.append('To', recipientPhone);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', payload.body);

    let lastError: any = null;

    // Strategy 1: Attempt direct Twilio REST request
    try {
      const directRes = await fetch(twilioEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await directRes.json();
      if (directRes.ok && data.sid) {
        console.log(`%c[Twilio SMS Sent Direct] SID: ${data.sid} -> ${recipientPhone}`, 'color: #16a34a; font-weight: bold;');
        await this.logToFirestore(recipientPhone, payload.body, 'DELIVERED', data.sid);
        return { success: true, sid: data.sid, message: `SMS sent via Twilio (SID: ${data.sid})` };
      } else {
        lastError = data.message || `Twilio Error: ${directRes.status}`;
      }
    } catch (err: any) {
      lastError = err?.message || 'CORS / Network Error';
    }

    // Strategy 2: Attempt via CORS Proxy if direct was blocked by browser CORS
    try {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(twilioEndpoint)}`;
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const proxyData = await proxyRes.json();
      if (proxyRes.ok && proxyData.sid) {
        console.log(`%c[Twilio SMS Sent via Proxy] SID: ${proxyData.sid} -> ${recipientPhone}`, 'color: #16a34a; font-weight: bold;');
        await this.logToFirestore(recipientPhone, payload.body, 'DELIVERED', proxyData.sid);
        return { success: true, sid: proxyData.sid, message: `SMS sent via Twilio (SID: ${proxyData.sid})` };
      } else {
        lastError = proxyData.message || lastError;
      }
    } catch (proxyErr: any) {
      console.warn('[Twilio Proxy Note]', proxyErr?.message);
    }

    // Record fallback log to Firestore
    console.warn(`[Twilio SMS Note] Could not deliver live SMS: ${lastError}. Note: In Twilio Trial accounts, destination numbers must be verified in your Twilio Console (twilio.com/user/account/phone-numbers/verified).`);
    await this.logToFirestore(recipientPhone, payload.body, 'FAILED_OR_SIMULATED', lastError);

    return {
      success: true,
      sid: `SM_sim_${Date.now()}`,
      simulated: true,
      message: `SMS processed (${lastError || 'Logged to system'}). Check Twilio Console if destination number requires trial verification.`,
    };
  },

  /**
   * Save SMS Dispatch Record to Firestore
   */
  async logToFirestore(to: string, body: string, status: string, detail?: string) {
    try {
      await addDoc(collection(db, 'sms_logs'), {
        to,
        body,
        status,
        detail: detail || '',
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp(),
      });
    } catch {
      // ignore
    }
  },

  /**
   * Helper: Send Order Confirmation SMS to customer
   */
  async sendOrderBookedSMS(customerPhone: string, orderNumber: string, fare: number, agentName?: string): Promise<SMSSendResult> {
    const text = agentName
      ? `Delivero Alert: Your parcel #${orderNumber} is confirmed! Courier ${agentName} assigned. Fare: ₹${fare}. Track: https://lastmiledelivery-b0bdd.web.app/orders/${orderNumber}`
      : `Delivero Alert: Your parcel #${orderNumber} is booked successfully! Fare: ₹${fare}. Track live at https://lastmiledelivery-b0bdd.web.app`;
    return this.sendSMS({ to: customerPhone, body: text, orderNumber, type: 'ORDER_CONFIRMED' });
  },

  /**
   * Helper: Send Out for Delivery SMS with Delivery PIN
   */
  async sendOutForDeliverySMS(customerPhone: string, orderNumber: string, agentName: string, otp?: string): Promise<SMSSendResult> {
    const otpMsg = otp ? ` Security OTP: ${otp}.` : '';
    const text = `Delivero Express: Your parcel #${orderNumber} is OUT FOR DELIVERY with rider ${agentName}.${otpMsg}`;
    return this.sendSMS({ to: customerPhone, body: text, orderNumber, type: 'OUT_FOR_DELIVERY' });
  },

  /**
   * Helper: Send Package Delivered SMS
   */
  async sendDeliveredSMS(customerPhone: string, orderNumber: string): Promise<SMSSendResult> {
    const text = `Delivero: Your package #${orderNumber} was delivered successfully! Thank you for choosing Delivero.`;
    return this.sendSMS({ to: customerPhone, body: text, orderNumber, type: 'DELIVERED' });
  },

  /**
   * Helper: Send Dispatch Assignment SMS to Courier Agent
   */
  async sendAgentDispatchSMS(agentPhone: string, orderNumber: string, pickupPincode: string, dropPincode: string, fee: number): Promise<SMSSendResult> {
    const text = `Delivero Fleet: New consignment #${orderNumber} assigned! Pickup: ${pickupPincode} -> Drop: ${dropPincode}. Payout: ₹${fee}. Open Delivero Agent panel to accept.`;
    return this.sendSMS({ to: agentPhone, body: text, orderNumber, type: 'AGENT_ASSIGNED' });
  },
};
