import crypto from 'node:crypto';

export interface RazorpayOrderOptions {
  amount: number; // in INR (will be converted to paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface SignatureVerificationInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class RazorpayService {
  private static getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  }

  private static getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || '';
  }

  static isConfigured(): boolean {
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    return Boolean(keyId && keySecret);
  }

  static getClientKeyId(): string {
    return this.getKeyId();
  }

  /**
   * Create an official Razorpay Order via REST API
   */
  static async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResult> {
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();

    if (!keyId || !keySecret) {
      throw new Error(
        'Razorpay payment gateway credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in .env'
      );
    }

    const amountInPaise = Math.round(options.amount * 100);
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes || {},
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.description || `Razorpay order creation failed (HTTP ${res.status})`);
    }

    const orderData = await res.json();
    return {
      id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      status: orderData.status,
    };
  }

  /**
   * Cryptographically verify the payment signature using HMAC SHA-256
   */
  static verifyPaymentSignature(input: SignatureVerificationInput): boolean {
    const keySecret = this.getKeySecret();
    if (!keySecret) return false;

    const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === input.razorpaySignature;
  }
}
