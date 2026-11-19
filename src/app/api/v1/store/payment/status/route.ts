import { apiSuccess } from '@/lib/api-envelope';
import { RazorpayService } from '@/services/RazorpayService';

export async function GET() {
  return apiSuccess({
    isConfigured: RazorpayService.isConfigured(),
    keyId: RazorpayService.isConfigured() ? RazorpayService.getClientKeyId() : null,
    provider: 'Razorpay (India UPI, Cards, NetBanking)',
    supportedMethods: [
      { id: 'cod', name: 'Cash on Delivery (Pay at Farm Gate)', active: true },
      {
        id: 'razorpay',
        name: 'Razorpay Online (UPI, Google Pay, PhonePe, Cards, Netbanking)',
        active: RazorpayService.isConfigured(),
        requiresCredentials: !RazorpayService.isConfigured(),
      },
    ],
  });
}
