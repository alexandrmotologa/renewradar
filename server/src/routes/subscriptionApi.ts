import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionService } from '../services/subscriptionService.js';
import { authenticateRequest } from '../security/auth.js';
import { CreateSubscriptionInput, UpdateSubscriptionInput } from '../types/index.js';

export async function subscriptionRoutes(fastify: FastifyInstance): Promise<void> {
  // PreHandler for all routes in this plugin
  fastify.addHook('preHandler', authenticateRequest);

  // GET /api/subscriptions
  fastify.get('/api/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const subscriptions = SubscriptionService.getSubscriptions(userId);
    return reply.send(subscriptions);
  });

  // GET /api/subscriptions/:id
  fastify.get<{ Params: { id: string } }>(
    '/api/subscriptions/:id',
    async (request, reply) => {
      const userId = request.user!.id;
      const sub = SubscriptionService.getSubscriptionById(request.params.id, userId);
      if (!sub) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }
      return reply.send(sub);
    }
  );

  // POST /api/subscriptions
  fastify.post<{ Body: CreateSubscriptionInput }>(
    '/api/subscriptions',
    async (request, reply) => {
      const userId = request.user!.id;
      const body = request.body;

      if (!body.name || body.amount === undefined || !body.category || !body.next_billing_date) {
        return reply.status(400).send({
          error: 'Missing required fields: name, amount, category, next_billing_date',
        });
      }

      const created = SubscriptionService.createSubscription(userId, body);
      return reply.status(201).send(created);
    }
  );

  // PUT /api/subscriptions/:id
  fastify.put<{ Params: { id: string }; Body: UpdateSubscriptionInput }>(
    '/api/subscriptions/:id',
    async (request, reply) => {
      const userId = request.user!.id;
      const updated = SubscriptionService.updateSubscription(request.params.id, userId, request.body);
      if (!updated) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }
      return reply.send(updated);
    }
  );

  // POST /api/subscriptions/:id/cancel
  fastify.post<{ Params: { id: string }; Body: { saved_amount?: number } }>(
    '/api/subscriptions/:id/cancel',
    async (request, reply) => {
      const userId = request.user!.id;
      const cancelled = SubscriptionService.cancelSubscription(
        request.params.id,
        userId,
        request.body?.saved_amount
      );
      if (!cancelled) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }
      return reply.send(cancelled);
    }
  );

  // POST /api/subscriptions/:id/reactivate
  fastify.post<{ Params: { id: string } }>(
    '/api/subscriptions/:id/reactivate',
    async (request, reply) => {
      const userId = request.user!.id;
      const reactivated = SubscriptionService.reactivateSubscription(request.params.id, userId);
      if (!reactivated) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }
      return reply.send(reactivated);
    }
  );

  // DELETE /api/subscriptions/:id
  fastify.delete<{ Params: { id: string } }>(
    '/api/subscriptions/:id',
    async (request, reply) => {
      const userId = request.user!.id;
      const deleted = SubscriptionService.deleteSubscription(request.params.id, userId);
      if (!deleted) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }
      return reply.send({ success: true, id: request.params.id });
    }
  );
}
