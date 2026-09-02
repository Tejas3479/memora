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
      await prisma.subscription.create({
        data: {
          userId,
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
    // Process subscription events
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
