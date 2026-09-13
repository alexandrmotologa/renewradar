import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionService } from '../services/subscriptionService.js';
import { authenticateRequest } from '../security/auth.js';
import { Currency } from '../types/index.js';

export async function statsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/stats
  fastify.get<{ Querystring: { currency?: string } }>(
    '/api/stats',
    { preHandler: authenticateRequest },
    async (request: FastifyRequest<{ Querystring: { currency?: string } }>, reply: FastifyReply) => {
      const userId = request.user!.id;
      const targetCurrency = (request.query.currency?.toUpperCase() || 'EUR') as Currency;
      const stats = SubscriptionService.getStats(userId, targetCurrency);
      return reply.send(stats);
    }
  );

  // GET /api/presets (Public template presets)
  fastify.get('/api/presets', async (_request, reply) => {
    const presets = SubscriptionService.getPresets();
    return reply.send(presets);
  });
}
