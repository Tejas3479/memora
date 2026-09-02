import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import Stripe from 'stripe';
import { config } from '../config.js';

const stripe = new Stripe(config.stripe.secretKey || 'mock_stripe_key', {
  apiVersion: '2024-06-20' as any,
});

export default async function billingRoutes(fastify: FastifyInstance) {
  fastify.post('/api/billing/checkout', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { plan } = request.body as any;

    if (!['PRO', 'TEAM'].includes(plan)) {
      return reply.status(400).send({ error: 'Invalid plan selected' });
    }

    // In local development without Stripe keys, simulate upgrade with active subscription record
    if (!config.stripe.secretKey) {
      if (process.env.NODE_ENV === 'production') {
        return reply.status(503).send({ error: 'Billing provider is not configured' });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { plan },
      });
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return { url: `${config.server.corsOrigin}/settings?billing=success` };
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan === 'PRO' ? (process.env.STRIPE_PRICE_PRO || 'price_pro_default') : (process.env.STRIPE_PRICE_TEAM || 'price_team_default'),
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${config.server.corsOrigin}/settings?billing=success`,
        cancel_url: `${config.server.corsOrigin}/settings?billing=cancelled`,
        metadata: { userId, plan },
      });

      return { url: session.url };
    } catch (err) {
      console.error('[Stripe Checkout Error]', err);
      return reply.status(502).send({ error: 'Failed to create payment checkout session. Please try again later.' });
    }
  });

  fastify.get('/api/billing/portal', { preHandler: authMiddleware }, async (request) => {
    return { url: `${config.server.corsOrigin}/settings` };
  });

  fastify.post('/stripe/webhook', async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    let event: any;

    if (config.stripe.webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(request.body as any, sig, config.stripe.webhookSecret);
      } catch (err) {
        console.error('[Stripe Webhook Signature Verification Failed]', err);
        return reply.status(400).send({ error: 'Invalid webhook signature' });
      }
    } else {
      event = request.body as any;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data?.object;
          const userId = session?.metadata?.userId;
          const plan = session?.metadata?.plan;
          if (userId && plan) {
            await prisma.user.update({
              where: { id: userId },
              data: { plan },
            });
            await prisma.subscription.upsert({
              where: { userId },
              create: {
                userId,
                plan,
                status: 'active',
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
              update: {
                plan,
                status: 'active',
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data?.object;
          if (subscription?.id) {
            const existingSub = await prisma.subscription.findFirst({
              where: { stripeSubscriptionId: subscription.id },
            });
            if (existingSub) {
              await prisma.user.update({
                where: { id: existingSub.userId },
                data: { plan: 'FREE' },
              });
              await prisma.subscription.update({
                where: { id: existingSub.id },
                data: { status: 'canceled' },
              });
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('[Stripe Webhook Processing Error]', err);
      return reply.status(500).send({ error: 'Webhook processing failed' });
    }

    return { received: true };
  });

  fastify.get('/api/billing/status', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const sub = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return sub || { plan: 'FREE', status: 'active' };
  });
}
