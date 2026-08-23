/**
 * Twilio SMS Gateway Integration Service for Delivero Last-Mile Logistics
 */

export interface SMSPayload {
  to: string; // Recipient phone number (e.g. +919876543210 or +1234567890)
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

// Default environment credentials or sandbox fallbacks
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+15005550006'; // Twilio test number default

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
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    // Default to India +91 if 10-digit mobile number
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
  },

  /**
   * Send SMS via Twilio REST API with instant fallback simulation for testing
   */
  async sendSMS(payload: SMSPayload): Promise<SMSSendResult> {
    const recipientPhone = this.formatPhoneNumber(payload.to);

    // If Twilio credentials are not set or running in demo sandbox
    if (!this.isConfigured()) {
      console.log(
        `%c[Twilio SMS Simulated Gateway] 📱 To: ${recipientPhone} | Message: "${payload.body}"`,
        'color: #0284c7; font-weight: bold; background: #f0f9ff; padding: 4px 8px; border-radius: 4px;'
      );
      return {
        success: true,
        sid: `SM_sim_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
        simulated: true,
        message: `Simulated SMS dispatched to ${recipientPhone} (Configure VITE_TWILIO_ACCOUNT_SID for live SMS).`,
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const formData = new URLSearchParams();
      formData.append('To', recipientPhone);
      formData.append('From', TWILIO_PHONE_NUMBER);
      formData.append('Body', payload.body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Twilio HTTP Error ${response.status}`);
      }

      console.log(`[Twilio SMS Live] Message sent successfully. SID: ${data.sid}`);
      return {
        success: true,
        sid: data.sid,
        simulated: false,
        message: `SMS delivered via Twilio (SID: ${data.sid})`,
      };
    } catch (err: any) {
      console.warn(`[Twilio SMS Error] Failed to send SMS:`, err);
      return {
        success: false,
        error: err?.message || 'Twilio network request failed.',
      };
    }
  },

  /**
   * Helper: Send Order Confirmation SMS to customer
   */
  async sendOrderBookedSMS(customerPhone: string, orderNumber: string, fare: number, agentName?: string): Promise<SMSSendResult> {
    const text = agentName
      ? `Delivero Alert: Your parcel #${orderNumber} is confirmed! Courier ${agentName} has been assigned. Amount: ₹${fare}. Track live: https://lastmiledelivery-b0bdd.web.app/orders/${orderNumber}`
      : `Delivero Alert: Your order #${orderNumber} is booked successfully! Amount: ₹${fare}. Track live at https://lastmiledelivery-b0bdd.web.app`;
    return this.sendSMS({ to: customerPhone, body: text, orderNumber, type: 'ORDER_CONFIRMED' });
  },

  /**
   * Helper: Send Out for Delivery SMS with Delivery PIN
   */
  async sendOutForDeliverySMS(customerPhone: string, orderNumber: string, agentName: string, otp?: string): Promise<SMSSendResult> {
    const otpMsg = otp ? ` Delivery Security OTP: ${otp}.` : '';
    const text = `Delivero Express: Your package #${orderNumber} is OUT FOR DELIVERY with rider ${agentName}.${otpMsg} Please be available for handover.`;
    return this.sendSMS({ to: customerPhone, body: text, orderNumber, type: 'OUT_FOR_DELIVERY' });
  },

  /**
   * Helper: Send Package Delivered SMS
   */
  async sendDeliveredSMS(customerPhone: string, orderNumber: string): Promise<SMSSendResult> {
    const text = `Delivero: Your package #${orderNumber} has been delivered successfully! Thank you for shipping with Delivero.`;
    return this.sendSMS({ to: customerPhone, body: text, orderNumber, type: 'DELIVERED' });
  },

  /**
   * Helper: Send Dispatch Assignment SMS to Courier Agent
   */
  async sendAgentDispatchSMS(agentPhone: string, orderNumber: string, pickupPincode: string, dropPincode: string, fee: number): Promise<SMSSendResult> {
    const text = `Delivero Fleet: New parcel #${orderNumber} assigned to your queue! Pickup: ${pickupPincode} -> Drop: ${dropPincode}. Payout: ₹${fee}. Open Delivero Agent panel to accept.`;
    return this.sendSMS({ to: agentPhone, body: text, orderNumber, type: 'AGENT_ASSIGNED' });
  },
};
