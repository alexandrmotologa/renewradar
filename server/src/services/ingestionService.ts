import { Category, CreateSubscriptionInput, Currency } from '../types/index.js';

export interface ParsedReceipt {
  name: string;
  amount: number;
  currency: Currency;
  is_free_trial: boolean;
  trial_duration_days: number;
  category: Category;
  confidence: number;
  raw_match: string;
}

export class IngestionService {
  /**
   * Attempts to parse a receipt, confirmation email snippet, or subscription text
   */
  static parseText(text: string): ParsedReceipt | null {
    if (!text || text.trim().length < 5) {
      return null;
    }

    const clean = text.replace(/\r?\n/g, ' ');

    // 1. Detect Currency
    let currency: Currency = 'EUR';
    if (/\$|USD/i.test(clean)) currency = 'USD';
    else if (/£|GBP/i.test(clean)) currency = 'GBP';
    else if (/RON|lei/i.test(clean)) currency = 'RON';
    else if (/€|EUR/i.test(clean)) currency = 'EUR';

    // 2. Detect Amount: e.g. $19.99, 14.00 EUR, € 20, 15.50
    const amountRegex = /(?:[$€£]\s*(\d+(?:[.,]\d{1,2})?))|(?:(\d+(?:[.,]\d{1,2})?)\s*(?:EUR|USD|RON|GBP|lei|€|\$|£))/i;
    const amountMatch = clean.match(amountRegex);
    let amount = 0;
    if (amountMatch) {
      const valStr = amountMatch[1] || amountMatch[2];
      amount = parseFloat(valStr.replace(',', '.'));
    }

    // 3. Detect Free Trial & Duration
    const isTrial = /trial|free\s+trial|test\s+period/i.test(clean);
    let trialDays = isTrial ? 14 : 0;
    const daysMatch = clean.match(/(\d+)[ -]?(?:day|zile)/i);
    if (daysMatch) {
      trialDays = parseInt(daysMatch[1], 10);
    }

    // 4. Detect Service Name & Category
    const serviceMap: Record<string, { name: string; category: Category }> = {
      netflix: { name: 'Netflix', category: 'STREAMING' },
      spotify: { name: 'Spotify', category: 'STREAMING' },
      chatgpt: { name: 'ChatGPT Plus', category: 'AI_TOOLS' },
      openai: { name: 'ChatGPT Plus', category: 'AI_TOOLS' },
      claude: { name: 'Claude Pro', category: 'AI_TOOLS' },
      anthropic: { name: 'Claude Pro', category: 'AI_TOOLS' },
      midjourney: { name: 'Midjourney', category: 'AI_TOOLS' },
      copilot: { name: 'GitHub Copilot', category: 'WORK' },
      github: { name: 'GitHub', category: 'WORK' },
      apple: { name: 'Apple Services', category: 'WORK' },
      icloud: { name: 'iCloud+', category: 'WORK' },
      youtube: { name: 'YouTube Premium', category: 'STREAMING' },
      adobe: { name: 'Adobe Creative Cloud', category: 'WORK' },
      gym: { name: 'Fitness Club', category: 'FITNESS' },
      fit: { name: 'Fitness Club', category: 'FITNESS' },
    };

    let matchedService: { name: string; category: Category } | null = null;
    for (const [kw, svc] of Object.entries(serviceMap)) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(clean)) {
        matchedService = svc;
        break;
      }
    }

    if (!matchedService && !amount) {
      return null;
    }

    // Fallback extraction for service name if not in map
    let name = matchedService?.name || 'New Subscription';
    if (!matchedService) {
      const trialOfMatch = clean.match(/(?:trial of|subscription to|welcome to|subscribed to)\s+([A-Za-z0-9\s+]+?)(?:\.|\s+is|\s+has|\s+for|\s+at|$)/i);
      if (trialOfMatch && trialOfMatch[1].trim().length > 2) {
        name = trialOfMatch[1].trim();
      }
    }

    const category: Category = matchedService?.category || (isTrial ? 'AI_TOOLS' : 'OTHER');

    return {
      name,
      amount: amount || (isTrial ? 20.0 : 9.99),
      currency,
      is_free_trial: isTrial,
      trial_duration_days: trialDays,
      category,
      confidence: matchedService && amount ? 0.95 : 0.7,
      raw_match: clean.slice(0, 100),
    };
  }

  /**
   * Converts a parsed receipt into a subscription input object
   */
  static toSubscriptionInput(receipt: ParsedReceipt): CreateSubscriptionInput {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const duration = receipt.is_free_trial ? (receipt.trial_duration_days || 14) : 30;

    return {
      name: receipt.name,
      category: receipt.category,
      amount: receipt.amount,
      currency: receipt.currency,
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (duration * dayMs),
      is_free_trial: receipt.is_free_trial,
      trial_duration_days: receipt.trial_duration_days,
      platform: 'WEB',
    };
  }
}
