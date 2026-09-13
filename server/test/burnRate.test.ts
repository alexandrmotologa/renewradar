import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { convertCurrency, normalizeToMonthly, calculateYearlyProjection } from '../src/services/currencyService.js';
import { getDatabase, closeDatabase } from '../src/db/database.js';
import { seedDemoData, DEMO_TELEGRAM_USER_ID } from '../src/db/seeder.js';
import { SubscriptionService } from '../src/services/subscriptionService.js';
import { IngestionService } from '../src/services/ingestionService.js';

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
    expect(normalizeToMonthly(10, 'WEEKLY')).toBe(43.33);
    expect(normalizeToMonthly(5, 'WEEKLY')).toBe(21.67);
  });

  it('calculates yearly projection from monthly burn', () => {
    expect(calculateYearlyProjection(85)).toBe(1020);
    expect(calculateYearlyProjection(100)).toBe(1200);
  });

  it('converts currencies correctly via EUR base', () => {
    expect(convertCurrency(100, 'EUR', 'USD')).toBe(108);
    expect(convertCurrency(108, 'USD', 'EUR')).toBe(100);
    expect(convertCurrency(10, 'EUR', 'RON')).toBe(49.7);
    expect(convertCurrency(100, 'EUR', 'GBP')).toBe(85);
    expect(convertCurrency(50, 'EUR', 'EUR')).toBe(50);
  });
});

describe('Database & Demo Seeder Advanced Features', () => {
  beforeEach(() => {
    closeDatabase();
    process.env.DATABASE_PATH = ':memory:';
  });

  afterEach(() => {
    closeDatabase();
  });

  it('seeds active subscriptions totaling exactly 85 EUR/month burn rate and 1020 EUR/year', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

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

  it('correctly calculates my_net_monthly_burn with family split', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

    const stats = SubscriptionService.getStats(DEMO_TELEGRAM_USER_ID, 'EUR');
    // Netflix is 14 EUR split 2 ways -> personal share is 7 EUR (7 EUR discount from 85)
    // 85 - 7 = 78 EUR net burn
    expect(stats.my_net_monthly_burn).toBe(78.0);
    expect(stats.my_net_yearly_burn).toBe(936.0);
  });

  it('calculates lifetime money saved from cancelled trials', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

    const stats = SubscriptionService.getStats(DEMO_TELEGRAM_USER_ID, 'EUR');
    // Adobe Creative Cloud was cancelled saving 105 EUR
    expect(stats.lifetime_saved).toBe(105.0);
  });

  it('identifies redundant subscriptions with Ghost Hunter', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

    const stats = SubscriptionService.getStats(DEMO_TELEGRAM_USER_ID, 'EUR');
    const aiRec = stats.ghost_recommendations.find(r => r.category === 'AI_TOOLS');
    expect(aiRec).toBeDefined();
    expect(aiRec?.services).toContain('ChatGPT Plus');
    expect(aiRec?.services).toContain('Claude Pro');
    expect(aiRec?.total_monthly_cost).toBe(40.0);
    expect(aiRec?.potential_savings).toBe(20.0);
  });

  it('generates valid RFC 5545 iCalendar stream with VEVENT and VALARM', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

    const ics = SubscriptionService.generateIcsCalendar(DEMO_TELEGRAM_USER_ID);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//RenewRadar//Subscription Watchdog//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Renew: Netflix Standard');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('cancels trial and credits saved amount', () => {
    const db = getDatabase(':memory:');
    seedDemoData(db);

    // Cancel ChatGPT Plus
    const cancelled = SubscriptionService.cancelSubscription('demo_chatgpt_plus', DEMO_TELEGRAM_USER_ID);
    expect(cancelled).toBeDefined();
    expect(cancelled?.status).toBe('CANCELLED');
    expect(cancelled?.saved_amount).toBe(60.0); // 20 * 3 months

    const stats = SubscriptionService.getStats(DEMO_TELEGRAM_USER_ID, 'EUR');
    // 105 (Adobe) + 60 (ChatGPT) = 165.0
    expect(stats.lifetime_saved).toBe(165.0);
    // Active monthly burn decreases from 85 to 65
    expect(stats.total_monthly_burn).toBe(65.0);
  });
});

describe('Smart Ingestion Parser', () => {
  it('parses trial confirmation text', () => {
    const text = 'Your 14-day free trial of Midjourney has started. You will be billed $30/month starting Oct 15.';
    const parsed = IngestionService.parseText(text);

    expect(parsed).toBeDefined();
    expect(parsed?.name).toBe('Midjourney');
    expect(parsed?.amount).toBe(30.0);
    expect(parsed?.currency).toBe('USD');
    expect(parsed?.is_free_trial).toBe(true);
    expect(parsed?.trial_duration_days).toBe(14);
  });

  it('parses Netflix receipt with EUR currency', () => {
    const text = 'Thanks for your payment to Netflix. Monthly membership is € 14.99 billed on your card.';
    const parsed = IngestionService.parseText(text);

    expect(parsed).toBeDefined();
    expect(parsed?.name).toBe('Netflix');
    expect(parsed?.amount).toBe(14.99);
    expect(parsed?.currency).toBe('EUR');
    expect(parsed?.is_free_trial).toBe(false);
  });
});
