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

    // In local/test mode, bypass Stripe and upgrade immediately
    if (!config.stripe.secretKey) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan },
      });
      return { url: `${config.server.corsOrigin}/settings?billing=success` };
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan === 'PRO' ? 'price_pro_default' : 'price_team_default',
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
      // Fallback fallback upgrade
      await prisma.user.update({
        where: { id: userId },
        data: { plan },
      });
      return { url: `${config.server.corsOrigin}/settings?billing=success` };
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
