import crypto from 'node:crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { DEMO_TELEGRAM_USER_ID } from '../db/seeder.js';

export interface AuthenticatedUser {
  id: number;
  firstName?: string;
  username?: string;
  languageCode?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Validates Telegram Mini App initData according to official HMAC-SHA256 specification
 */
export function validateTelegramInitData(initDataRaw: string, botToken: string): AuthenticatedUser | null {
  if (!initDataRaw || !botToken) {
    return null;
  }

  try {
    const urlParams = new URLSearchParams(initDataRaw);
    const hash = urlParams.get('hash');
    if (!hash) {
      return null;
    }

    urlParams.delete('hash');

    // Sort keys alphabetically
    const params: string[] = [];
    urlParams.forEach((val, key) => {
      params.push(`${key}=${val}`);
    });
    params.sort();

    const dataCheckString = params.join('\n');

    // Secret key = HMAC_SHA256('WebAppData', botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculated hash = HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return null;
    }

    // Parse user object from initData
    const userJson = urlParams.get('user');
    if (!userJson) {
      return null;
    }

    const parsedUser = JSON.parse(userJson);
    return {
      id: parsedUser.id,
      firstName: parsedUser.first_name,
      username: parsedUser.username,
      languageCode: parsedUser.language_code,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Fastify preHandler hook for authenticating requests
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

  if (authHeader && authHeader.startsWith('tma ')) {
    const initDataRaw = authHeader.slice(4).trim();
    if (botToken && botToken !== 'mock_token') {
      const user = validateTelegramInitData(initDataRaw, botToken);
      if (user) {
        request.user = user;
        return;
      }
    }
  }

  // Fallback for demo mode or desktop browser testing
  if (isDemoMode) {
    request.user = {
      id: DEMO_TELEGRAM_USER_ID,
      firstName: 'Demo',
      username: 'demouser',
    };
    return;
  }

  reply.status(401).send({ error: 'Unauthorized: Valid Telegram initData required' });
}
