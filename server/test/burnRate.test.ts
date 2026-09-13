import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { convertCurrency, normalizeToMonthly, calculateYearlyProjection } from '../src/services/currencyService.js';
import { getDatabase, closeDatabase } from '../src/db/database.js';
import { seedDemoData, DEMO_TELEGRAM_USER_ID } from '../src/db/seeder.js';
import { SubscriptionService } from '../src/services/subscriptionService.js';

describe('Burn Rate & Currency Math', () => {
  it('normalizes monthly billing cycle directly', () => {
    expect(normalizeToMonthly(20, 'MONTHLY')).toBe(20);
    expect(normalizeToMonthly(14.99, 'MONTHLY')).toBe(14.99);
  });

  it('normalizes yearly subscriptions by dividing by 12', () => {
    expect(normalizeToMonthly(120, 'YEARLY')).toBe(10);
    expect(normalizeToMonthly(96, 'YEARLY')).toBe(8);
  });

  it('normalizes weekly subscriptions by multiplying by 4.3333', () => {
    // 10 * 4.3333 = 43.333 -> 43.33
    expect(normalizeToMonthly(10, 'WEEKLY')).toBe(43.33);
    // 5 * 4.3333 = 21.6665 -> 21.67
    expect(normalizeToMonthly(5, 'WEEKLY')).toBe(21.67);
  });

  it('calculates yearly projection from monthly burn', () => {
    expect(calculateYearlyProjection(85)).toBe(1020);
    expect(calculateYearlyProjection(100)).toBe(1200);
  });

  it('converts currencies correctly via EUR base', () => {
    // EUR -> USD (1 EUR = 1.08 USD)
    expect(convertCurrency(100, 'EUR', 'USD')).toBe(108);

    // USD -> EUR (108 USD = 100 EUR)
    expect(convertCurrency(108, 'USD', 'EUR')).toBe(100);

    // EUR -> RON (1 EUR = 4.97 RON)
    expect(convertCurrency(10, 'EUR', 'RON')).toBe(49.7);

    // EUR -> GBP (1 EUR = 0.85 GBP)
    expect(convertCurrency(100, 'EUR', 'GBP')).toBe(85);

    // Identity
    expect(convertCurrency(50, 'EUR', 'EUR')).toBe(50);
  });
});

describe('Database & Demo Seeder Stats', () => {
  beforeEach(() => {
    closeDatabase();
    process.env.DATABASE_PATH = ':memory:';
  });

  afterEach(() => {
    closeDatabase();
  });

  it('seeds 6 subscriptions totaling exactly 85 EUR/month burn rate and 1020 EUR/year', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

    const subscriptions = SubscriptionService.getSubscriptions(DEMO_TELEGRAM_USER_ID);
    expect(subscriptions.length).toBe(6);

    const stats = SubscriptionService.getStats(DEMO_TELEGRAM_USER_ID, 'EUR');
    expect(stats.total_monthly_burn).toBe(85.0);
    expect(stats.total_yearly_burn).toBe(1020.0);
    expect(stats.active_trials_count).toBe(1);
    expect(stats.expiring_trials_count).toBe(1);

    // Category breakdown check
    expect(stats.category_breakdown.AI_TOOLS).toBe(40.0); // 20 (ChatGPT) + 20 (Claude)
    expect(stats.category_breakdown.STREAMING).toBe(25.0); // 14 (Netflix) + 11 (Spotify)
    expect(stats.category_breakdown.WORK).toBe(3.0); // 3 (iCloud)
    expect(stats.category_breakdown.FITNESS).toBe(17.0); // 17 (Gym)
  });

  it('correctly detects trial expiration within 48 hours', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

    const stats = SubscriptionService.getStats(DEMO_TELEGRAM_USER_ID, 'EUR');
    const chatGpt = stats.upcoming_charges.find(c => c.name === 'ChatGPT Plus');

    expect(chatGpt).toBeDefined();
    expect(chatGpt?.is_free_trial).toBe(true);
    expect(chatGpt?.hours_remaining).toBeGreaterThan(0);
    expect(chatGpt?.hours_remaining).toBeLessThanOrEqual(48);
  });
});
