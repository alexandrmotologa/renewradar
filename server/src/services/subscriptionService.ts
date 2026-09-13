import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database.js';
import {
  Category,
  CreateSubscriptionInput,
  Currency,
  PresetTemplate,
  StatsResponse,
  Subscription,
  UpcomingCharge,
  UpdateSubscriptionInput,
} from '../types/index.js';
import { calculateYearlyProjection, convertCurrency, normalizeToMonthly } from './currencyService.js';

export class SubscriptionService {
  /**
   * Retrieves all subscriptions for a user sorted by next renewal date
   */
  static getSubscriptions(telegramUserId: number): Subscription[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE telegram_user_id = ? 
      ORDER BY next_billing_date ASC
    `).all(telegramUserId) as unknown as Subscription[];

    return rows;
  }

  /**
   * Retrieves a single subscription by id
   */
  static getSubscriptionById(id: string, telegramUserId: number): Subscription | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE id = ? AND telegram_user_id = ?
    `).get(id, telegramUserId) as unknown as Subscription | undefined;

    return row || null;
  }

  /**
   * Creates a new subscription
   */
  static createSubscription(telegramUserId: number, input: CreateSubscriptionInput): Subscription {
    const db = getDatabase();
    const now = Date.now();
    const id = `sub_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const currency = input.currency || 'EUR';
    const billingCycle = input.billing_cycle || 'MONTHLY';
    const isFreeTrial = input.is_free_trial ? 1 : 0;
    const trialDurationDays = input.trial_duration_days || 0;

    db.prepare(`
      INSERT INTO subscriptions (
        id, telegram_user_id, name, category, amount, currency, billing_cycle,
        next_billing_date, is_free_trial, trial_duration_days, alert_sent,
        cancel_url, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      telegramUserId,
      input.name,
      input.category,
      input.amount,
      currency,
      billingCycle,
      input.next_billing_date,
      isFreeTrial,
      trialDurationDays,
      0,
      input.cancel_url || null,
      input.notes || null,
      now,
      now
    );

    return this.getSubscriptionById(id, telegramUserId)!;
  }

  /**
   * Updates an existing subscription
   */
  static updateSubscription(
    id: string,
    telegramUserId: number,
    input: UpdateSubscriptionInput
  ): Subscription | null {
    const db = getDatabase();
    const existing = this.getSubscriptionById(id, telegramUserId);
    if (!existing) {
      return null;
    }

    const now = Date.now();
    const name = input.name !== undefined ? input.name : existing.name;
    const category = input.category !== undefined ? input.category : existing.category;
    const amount = input.amount !== undefined ? input.amount : existing.amount;
    const currency = input.currency !== undefined ? input.currency : existing.currency;
    const billingCycle = input.billing_cycle !== undefined ? input.billing_cycle : existing.billing_cycle;
    const nextBillingDate = input.next_billing_date !== undefined ? input.next_billing_date : existing.next_billing_date;
    const isFreeTrial = input.is_free_trial !== undefined ? (input.is_free_trial ? 1 : 0) : existing.is_free_trial;
    const trialDurationDays = input.trial_duration_days !== undefined ? input.trial_duration_days : existing.trial_duration_days;
    const alertSent = input.alert_sent !== undefined ? (input.alert_sent ? 1 : 0) : existing.alert_sent;
    const cancelUrl = input.cancel_url !== undefined ? input.cancel_url : existing.cancel_url;
    const notes = input.notes !== undefined ? input.notes : existing.notes;

    db.prepare(`
      UPDATE subscriptions SET
        name = ?,
        category = ?,
        amount = ?,
        currency = ?,
        billing_cycle = ?,
        next_billing_date = ?,
        is_free_trial = ?,
        trial_duration_days = ?,
        alert_sent = ?,
        cancel_url = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ? AND telegram_user_id = ?
    `).run(
      name,
      category,
      amount,
      currency,
      billingCycle,
      nextBillingDate,
      isFreeTrial,
      trialDurationDays,
      alertSent,
      cancelUrl,
      notes,
      now,
      id,
      telegramUserId
    );

    return this.getSubscriptionById(id, telegramUserId);
  }

  /**
   * Deletes a subscription
   */
  static deleteSubscription(id: string, telegramUserId: number): boolean {
    const db = getDatabase();
    const result = db.prepare(`
      DELETE FROM subscriptions 
      WHERE id = ? AND telegram_user_id = ?
    `).run(id, telegramUserId);

    return result.changes > 0;
  }

  /**
   * Computes financial burn rate, category breakdowns, and upcoming trial alerts
   */
  static getStats(telegramUserId: number, targetCurrency: Currency = 'EUR'): StatsResponse {
    const subscriptions = this.getSubscriptions(telegramUserId);
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;

    let totalMonthlyBurn = 0;
    let activeTrialsCount = 0;
    let expiringTrialsCount = 0;

    const categoryBreakdown: Record<Category, number> = {
      AI_TOOLS: 0,
      STREAMING: 0,
      WORK: 0,
      FITNESS: 0,
      OTHER: 0,
    };

    const upcomingCharges: UpcomingCharge[] = [];

    for (const sub of subscriptions) {
      // Calculate normalized monthly amount in target currency
      const monthlyOrigin = normalizeToMonthly(sub.amount, sub.billing_cycle);
      const monthlyConverted = convertCurrency(monthlyOrigin, sub.currency, targetCurrency);

      totalMonthlyBurn += monthlyConverted;
      categoryBreakdown[sub.category] = Number(
        ((categoryBreakdown[sub.category] || 0) + monthlyConverted).toFixed(2)
      );

      const diffMs = sub.next_billing_date - now;
      const hoursRemaining = Math.max(0, Math.round(diffMs / hourMs));
      const daysRemaining = Math.max(0, Math.ceil(diffMs / dayMs));

      if (sub.is_free_trial === 1) {
        activeTrialsCount++;
        // Expiring if within 48 hours
        if (diffMs <= 48 * hourMs && diffMs > 0) {
          expiringTrialsCount++;
        }
      }

      upcomingCharges.push({
        id: sub.id,
        name: sub.name,
        category: sub.category,
        amount: sub.amount,
        currency: sub.currency,
        next_billing_date: sub.next_billing_date,
        is_free_trial: sub.is_free_trial === 1,
        days_remaining: daysRemaining,
        hours_remaining: hoursRemaining,
        cancel_url: sub.cancel_url,
      });
    }

    const roundedMonthlyBurn = Number(totalMonthlyBurn.toFixed(2));
    const yearlyBurn = calculateYearlyProjection(roundedMonthlyBurn);

    return {
      currency: targetCurrency,
      total_monthly_burn: roundedMonthlyBurn,
      total_yearly_burn: yearlyBurn,
      subscription_count: subscriptions.length,
      active_trials_count: activeTrialsCount,
      expiring_trials_count: expiringTrialsCount,
      category_breakdown: categoryBreakdown,
      upcoming_charges: upcomingCharges,
    };
  }

  /**
   * Returns preset templates for quick subscription creation
   */
  static getPresets(): PresetTemplate[] {
    return [
      {
        id: 'preset_chatgpt',
        name: 'ChatGPT Plus',
        category: 'AI_TOOLS',
        defaultAmount: 20.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'https://chatgpt.com/#settings',
        iconName: 'Bot',
      },
      {
        id: 'preset_claude',
        name: 'Claude Pro',
        category: 'AI_TOOLS',
        defaultAmount: 20.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'https://claude.ai/settings/billing',
        iconName: 'Sparkles',
      },
      {
        id: 'preset_netflix',
        name: 'Netflix',
        category: 'STREAMING',
        defaultAmount: 14.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'https://www.netflix.com/youraccount',
        iconName: 'Tv',
      },
      {
        id: 'preset_spotify',
        name: 'Spotify',
        category: 'STREAMING',
        defaultAmount: 11.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'https://www.spotify.com/account/overview',
        iconName: 'Music',
      },
      {
        id: 'preset_copilot',
        name: 'GitHub Copilot',
        category: 'WORK',
        defaultAmount: 10.0,
        defaultCurrency: 'USD',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'https://github.com/settings/billing',
        iconName: 'Code',
      },
      {
        id: 'preset_youtube',
        name: 'YouTube Premium',
        category: 'STREAMING',
        defaultAmount: 13.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'https://www.youtube.com/paid_memberships',
        iconName: 'PlaySquare',
      },
      {
        id: 'preset_icloud',
        name: 'iCloud+',
        category: 'WORK',
        defaultAmount: 3.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'https://appleid.apple.com',
        iconName: 'Cloud',
      },
      {
        id: 'preset_fitness',
        name: 'Gym Membership',
        category: 'FITNESS',
        defaultAmount: 25.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: '',
        iconName: 'Dumbbell',
      },
    ];
  }

  /**
   * Exports all subscriptions as JSON or CSV
   */
  static exportSubscriptions(telegramUserId: number, format: 'json' | 'csv' = 'json'): string {
    const subscriptions = this.getSubscriptions(telegramUserId);

    if (format === 'csv') {
      const headers = ['name', 'category', 'amount', 'currency', 'billing_cycle', 'next_billing_date', 'is_free_trial', 'cancel_url', 'notes'];
      const rows = subscriptions.map(sub => [
        `"${sub.name.replace(/"/g, '""')}"`,
        sub.category,
        sub.amount,
        sub.currency,
        sub.billing_cycle,
        new Date(sub.next_billing_date).toISOString().split('T')[0],
        sub.is_free_trial ? 'Yes' : 'No',
        `"${(sub.cancel_url || '').replace(/"/g, '""')}"`,
        `"${(sub.notes || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return JSON.stringify({ subscriptions }, null, 2);
  }

  /**
   * Imports a list of subscriptions
   */
  static importSubscriptions(telegramUserId: number, items: CreateSubscriptionInput[]): { imported: number; errors: string[] } {
    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.name || !item.amount || !item.category) {
          errors.push(`Row ${i + 1}: Missing required fields (name, amount, category)`);
          continue;
        }
        this.createSubscription(telegramUserId, item);
        imported++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return { imported, errors };
  }
}
