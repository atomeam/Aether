/**
 * @aether/webhook-delivery - Webhook Delivery System
 */

export class WebhookDelivery {
  async deliver(url: string, payload: any): Promise<void> {
    console.log(`[WEBHOOK] Delivering to ${url}`, payload);
  }
}

export const webhookDelivery = new WebhookDelivery();