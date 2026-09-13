import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionService } from '../services/subscriptionService.js';
import { authenticateRequest } from '../security/auth.js';
import { CreateSubscriptionInput } from '../types/index.js';

export async function portabilityRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticateRequest);

  // GET /api/export
  fastify.get<{ Querystring: { format?: 'json' | 'csv' } }>(
    '/api/export',
    async (request: FastifyRequest<{ Querystring: { format?: 'json' | 'csv' } }>, reply: FastifyReply) => {
      const userId = request.user!.id;
      const format = request.query.format === 'csv' ? 'csv' : 'json';
      const output = SubscriptionService.exportSubscriptions(userId, format);

      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename="renewradar_subscriptions.csv"');
        return reply.send(output);
      }

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', 'attachment; filename="renewradar_subscriptions.json"');
      return reply.send(output);
    }
  );

  // GET /api/calendar.ics - Standard iCalendar RFC 5545 feed
  fastify.get('/api/calendar.ics', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const icsContent = SubscriptionService.generateIcsCalendar(userId);

    reply.header('Content-Type', 'text/calendar; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="renewradar.ics"');
    return reply.send(icsContent);
  });

  // POST /api/import
  fastify.post<{ Body: { subscriptions: CreateSubscriptionInput[] } }>(
    '/api/import',
    async (request, reply) => {
      const userId = request.user!.id;
      const items = request.body?.subscriptions;

      if (!Array.isArray(items)) {
        return reply.status(400).send({ error: 'Payload must contain a "subscriptions" array' });
      }

      const result = SubscriptionService.importSubscriptions(userId, items);
      return reply.send(result);
    }
  );
}
