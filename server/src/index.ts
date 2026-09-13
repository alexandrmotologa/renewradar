import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { getDatabase, closeDatabase } from './db/database.js';
import { seedDemoData } from './db/seeder.js';
import { subscriptionRoutes } from './routes/subscriptionApi.js';
import { statsRoutes } from './routes/statsApi.js';
import { portabilityRoutes } from './routes/portabilityApi.js';
import { setupBot } from './bot/bot.js';
import { startWatchdog, stopWatchdog } from './watchdog/renewalChecker.js';

// Load environment variables
dotenv.config();

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.HOST || '0.0.0.0';
const isDemoMode = process.env.DEMO_MODE === 'true';

async function bootstrap() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🛡️  RenewRadar Server — Autonomous Subscription Watchdog  ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Initialize SQLite Database
  const db = getDatabase();

  // Seed demo subscriptions if DEMO_MODE=true
  if (isDemoMode) {
    seedDemoData(db);
  }

  // Setup Telegram Bot
  const bot = setupBot();
  if (bot) {
    bot.start({
      onStart: (botInfo) => {
        console.log(`✓ Connected to Telegram as @${botInfo.username} (Long Polling)`);
      },
    }).catch((err) => {
      console.warn('Telegram long polling error:', err.message);
    });
  }

  // Start Renewal Watchdog
  startWatchdog(bot);

  // Initialize Fastify Web Server
  const fastify = Fastify({
    logger: false,
  });

  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register API routes
  await fastify.register(subscriptionRoutes);
  await fastify.register(statsRoutes);
  await fastify.register(portabilityRoutes);

  // Health check endpoint
  fastify.get('/health', async (_req, reply) => {
    return reply.send({
      status: 'healthy',
      app: 'RenewRadar',
      uptime: process.uptime(),
      demoMode: isDemoMode,
    });
  });

  // Serve static files from web/dist if directory exists
  const possiblePaths = [
    path.resolve(__dirname, '../../web/dist'),
    path.resolve(process.cwd(), 'web/dist'),
    path.resolve(process.cwd(), '../web/dist'),
  ];
  const webDistPath = possiblePaths.find(p => fs.existsSync(p));

  if (webDistPath) {
    await fastify.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
    });

    // Fallback all non-API routes to index.html for client-side routing
    fastify.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) {
        return reply.status(404).send({ error: 'Endpoint not found' });
      }
      return reply.sendFile('index.html');
    });
    console.log(`✓ Serving static frontend from ${webDistPath}`);
  } else {
    fastify.get('/', async (_req, reply) => {
      return reply.send({
        app: 'RenewRadar API Server',
        status: 'running',
        demoMode: isDemoMode,
        endpoints: [
          '/api/stats',
          '/api/subscriptions',
          '/api/presets',
          '/api/export',
          '/health',
        ],
      });
    });
  }

  // Start Listening
  try {
    const address = await fastify.listen({ port, host });
    console.log(`✓ Fastify listening at ${address}`);
    console.log(`✓ DEMO_MODE: ${isDemoMode ? 'ENABLED (Pre-seeded $85/mo burn rate)' : 'DISABLED'}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    stopWatchdog();
    if (bot) {
      bot.stop();
    }
    await fastify.close();
    closeDatabase();
    console.log('✓ RenewRadar exited cleanly');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
