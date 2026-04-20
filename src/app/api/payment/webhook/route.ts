import { Webhook } from '@creem_io/nextjs';
import { db } from '@/core/db';
import { user, order } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { grantCreditsForUser } from '@/shared/models/credit';
import { getUuid } from '@/shared/lib/hash';

// Credit packages configuration - Simple model: Single or 10-pack
const CREDIT_PACKAGES: Record<string, { credits: number; validDays: number; amount: number; name: string }> = {
  // Single credit - 1 video generation
  [process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_SINGLE || process.env.CREEM_PRODUCT_ID_SINGLE || '']: {
    credits: 1,
    validDays: 30,
    amount: 199, // $1.99 in cents
    name: 'Single Credit',
  },
  // 10-pack - 10 video generations
  [process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_10PACK || process.env.CREEM_PRODUCT_ID_10PACK || '']: {
    credits: 10,
    validDays: 90,
    amount: 999, // $9.99 in cents
    name: '10 Credits Pack',
  },
};

function getCreditPackage(productId?: string) {
  if (!productId) return null;
  return CREDIT_PACKAGES[productId] || null;
}

export const POST = Webhook({
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,

  onCheckoutCompleted: async (data) => {
    const userId = data.metadata?.referenceId as string | undefined;

    if (!userId) {
      console.error('[Creem Webhook] No referenceId in metadata', {
        checkoutId: data.id,
        customerEmail: data.customer?.email,
      });
      return;
    }

    // Verify user exists before crediting
    const userRecord = await db().query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userRecord) {
      console.error(`[Creem Webhook] User not found: ${userId}`);
      return;
    }

    // Determine credits based on product
    const productId = data.product?.id;
    const providerOrderId = data.order?.id || data.id;
    const creditPackage = getCreditPackage(productId);

    if (!creditPackage) {
      console.error(`[Creem Webhook] Unknown product ID: ${productId}`);
      return;
    }

    const orderId = getUuid();

    // Create order record (simplified structure matching old Animaker)
    try {
      const insertedOrder = await db().insert(order).values({
        id: orderId,
        userId,
        provider: 'creem',
        providerOrderId: providerOrderId,
        plan:
          productId ===
          (process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_SINGLE ||
            process.env.CREEM_PRODUCT_ID_SINGLE)
            ? 'single'
            : '10pack',
        credits: creditPackage.credits,
        amount: data.order?.amount || creditPackage.amount,
        currency: (data.order?.currency?.toUpperCase() === 'CNY' ? 'CNY' : 'USD'),
        status: 'paid',
        paidAt: new Date(),
      }).onConflictDoNothing().returning({ id: order.id });

      if (insertedOrder.length === 0) {
        console.log(`[Creem Webhook] Duplicate checkout.completed ignored: order=${providerOrderId}`);
        return;
      }

      // Grant credits using ShipAny credit system
      await grantCreditsForUser({
        user: userRecord,
        credits: creditPackage.credits,
        validDays: creditPackage.validDays,
        description: `Purchase: ${creditPackage.name} (Order: ${orderId})`,
      });

      console.log(`[Creem Webhook] checkout.completed: user=${userId}, +${creditPackage.credits} credits (valid ${creditPackage.validDays} days), order=${orderId}`);
    } catch (error) {
      console.error(`[Creem Webhook] Failed to process payment:`, error);
      // Try to mark order as failed if it was created
      try {
        await db().update(order)
          .set({ status: 'failed' })
          .where(eq(order.id, orderId));
      } catch (updateError) {
        console.error(`[Creem Webhook] Failed to update order status:`, updateError);
      }
    }
  },

  onSubscriptionActive: async (data) => {
    const userId = data.metadata?.referenceId as string | undefined;
    if (userId) {
      console.log(`[Creem Webhook] subscription.active: user=${userId}`);
      // TODO: Handle subscription activation if needed in the future
    }
  },

  onSubscriptionCanceled: async (data) => {
    const userId = data.metadata?.referenceId as string | undefined;
    if (userId) {
      console.log(`[Creem Webhook] subscription.canceled: user=${userId}`);
      // TODO: Handle subscription cancellation if needed in the future
    }
  },
});
