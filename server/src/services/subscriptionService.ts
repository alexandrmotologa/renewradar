import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database.js';
import {
  Category,
  CreateSubscriptionInput,
  Currency,
  GhostRecommendation,
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
    const status = input.status || 'ACTIVE';
    const sharedWithCount = Math.max(1, input.shared_with_count || 1);
    const platform = input.platform || 'WEB';

    db.prepare(`
      INSERT INTO subscriptions (
        id, telegram_user_id, name, category, amount, currency, billing_cycle,
        next_billing_date, is_free_trial, trial_duration_days, alert_sent,
        cancel_url, cancellation_steps, notes, status, saved_amount,
        shared_with_count, platform, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      input.cancellation_steps || null,
      input.notes || null,
      status,
      0.0,
      sharedWithCount,
      platform,
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
    const cancellationSteps = input.cancellation_steps !== undefined ? input.cancellation_steps : existing.cancellation_steps;
    const notes = input.notes !== undefined ? input.notes : existing.notes;
    const status = input.status !== undefined ? input.status : existing.status;
    const savedAmount = input.saved_amount !== undefined ? input.saved_amount : existing.saved_amount;
    const sharedWithCount = input.shared_with_count !== undefined ? Math.max(1, input.shared_with_count) : (existing.shared_with_count || 1);
    const platform = input.platform !== undefined ? input.platform : (existing.platform || 'WEB');

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
        cancellation_steps = ?,
        notes = ?,
        status = ?,
        saved_amount = ?,
        shared_with_count = ?,
        platform = ?,
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
      cancellationSteps,
      notes,
      status,
      savedAmount,
      sharedWithCount,
      platform,
      now,
      id,
      telegramUserId
    );

    return this.getSubscriptionById(id, telegramUserId);
  }

  /**
   * Cancels a subscription and credits saved amount
   */
  static cancelSubscription(id: string, telegramUserId: number, customSavedAmount?: number): Subscription | null {
    const existing = this.getSubscriptionById(id, telegramUserId);
    if (!existing) return null;

    // Calculate default saved money: 3 months of regular subscription cost
    const monthlyCost = normalizeToMonthly(existing.amount, existing.billing_cycle);
    const savedAmount = customSavedAmount !== undefined ? customSavedAmount : Number((monthlyCost * 3).toFixed(2));

    return this.updateSubscription(id, telegramUserId, {
      status: 'CANCELLED',
      saved_amount: savedAmount,
      is_free_trial: false,
    });
  }

  /**
   * Reactivates a cancelled or paused subscription
   */
  static reactivateSubscription(id: string, telegramUserId: number): Subscription | null {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return this.updateSubscription(id, telegramUserId, {
      status: 'ACTIVE',
      alert_sent: false,
      next_billing_date: now + (30 * dayMs),
    });
  }

  /**
   * Deletes a subscription permanently
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
   * Computes financial burn rate, family split, lifetime savings, and ghost recommendations
   */
  static getStats(telegramUserId: number, targetCurrency: Currency = 'EUR'): StatsResponse {
    const allSubscriptions = this.getSubscriptions(telegramUserId);
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;

    let totalMonthlyBurn = 0;
    let myNetMonthlyBurn = 0;
    let lifetimeSaved = 0;
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
    const activeByCategory: Record<Category, Subscription[]> = {
      AI_TOOLS: [],
      STREAMING: [],
      WORK: [],
      FITNESS: [],
      OTHER: [],
    };

    for (const sub of allSubscriptions) {
      // Sum lifetime savings from cancelled items
      if (sub.status === 'CANCELLED') {
        const convertedSaved = convertCurrency(sub.saved_amount || 0, sub.currency, targetCurrency);
        lifetimeSaved += convertedSaved;
        continue;
      }

      // Only ACTIVE subscriptions contribute to ongoing burn
      if (sub.status === 'ACTIVE') {
        activeByCategory[sub.category].push(sub);

        const monthlyOrigin = normalizeToMonthly(sub.amount, sub.billing_cycle);
        const monthlyConverted = convertCurrency(monthlyOrigin, sub.currency, targetCurrency);
        totalMonthlyBurn += monthlyConverted;

        // Family / shared split calculation
        const splitCount = Math.max(1, sub.shared_with_count || 1);
        const myShareMonthly = monthlyConverted / splitCount;
        myNetMonthlyBurn += myShareMonthly;

        categoryBreakdown[sub.category] = Number(
          ((categoryBreakdown[sub.category] || 0) + monthlyConverted).toFixed(2)
        );

        const diffMs = sub.next_billing_date - now;
        const hoursRemaining = Math.max(0, Math.round(diffMs / hourMs));
        const daysRemaining = Math.max(0, Math.ceil(diffMs / dayMs));

        if (sub.is_free_trial === 1) {
          activeTrialsCount++;
          if (diffMs <= 48 * hourMs && diffMs > 0) {
            expiringTrialsCount++;
          }
        }

        upcomingCharges.push({
          id: sub.id,
          name: sub.name,
          category: sub.category,
          amount: sub.amount,
          my_share_amount: Number((sub.amount / splitCount).toFixed(2)),
          currency: sub.currency,
          next_billing_date: sub.next_billing_date,
          is_free_trial: sub.is_free_trial === 1,
          days_remaining: daysRemaining,
          hours_remaining: hoursRemaining,
          cancel_url: sub.cancel_url,
          cancellation_steps: sub.cancellation_steps,
          platform: sub.platform || 'WEB',
        });
      }
    }

    // Ghost Hunter Redundancy Detection
    const ghostRecommendations: GhostRecommendation[] = [];
    for (const cat of Object.keys(activeByCategory) as Category[]) {
      const list = activeByCategory[cat];
      if (list.length >= 2) {
        let catTotal = 0;
        const names = list.map(s => {
          const m = convertCurrency(normalizeToMonthly(s.amount, s.billing_cycle), s.currency, targetCurrency);
          catTotal += m;
          return s.name;
        });

        // Potential savings if consolidating to just 1
        const cheapest = Math.min(...list.map(s => convertCurrency(normalizeToMonthly(s.amount, s.billing_cycle), s.currency, targetCurrency)));
        const potentialSavings = Number((catTotal - cheapest).toFixed(2));

        const catName = cat === 'AI_TOOLS' ? 'AI Tools' : cat === 'STREAMING' ? 'Streaming' : cat;
        ghostRecommendations.push({
          category: cat,
          services: names,
          total_monthly_cost: Number(catTotal.toFixed(2)),
          potential_savings: potentialSavings,
          message: `You have ${list.length} active subscriptions in ${catName} (${catTotal.toFixed(2)} ${targetCurrency}/mo). Consolidating could save you ${potentialSavings.toFixed(2)} ${targetCurrency}/month.`,
        });
      }
    }

    const roundedMonthlyBurn = Number(totalMonthlyBurn.toFixed(2));
    const roundedMyNetBurn = Number(myNetMonthlyBurn.toFixed(2));

    return {
      currency: targetCurrency,
      total_monthly_burn: roundedMonthlyBurn,
      my_net_monthly_burn: roundedMyNetBurn,
      total_yearly_burn: calculateYearlyProjection(roundedMonthlyBurn),
      my_net_yearly_burn: calculateYearlyProjection(roundedMyNetBurn),
      lifetime_saved: Number(lifetimeSaved.toFixed(2)),
      subscription_count: allSubscriptions.filter(s => s.status === 'ACTIVE').length,
      active_trials_count: activeTrialsCount,
      expiring_trials_count: expiringTrialsCount,
      category_breakdown: categoryBreakdown,
      upcoming_charges: upcomingCharges,
      ghost_recommendations: ghostRecommendations,
    };
  }

  /**
   * Generates standard RFC 5545 iCalendar stream
   */
  static generateIcsCalendar(telegramUserId: number): string {
    const subscriptions = this.getSubscriptions(telegramUserId).filter(s => s.status === 'ACTIVE');
    const now = new Date();
    const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const events: string[] = [];

    for (const sub of subscriptions) {
      const d = new Date(sub.next_billing_date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const dtStart = `${year}${month}${day}`;

      const cycleFreq = sub.billing_cycle === 'YEARLY' ? 'YEARLY' : sub.billing_cycle === 'WEEKLY' ? 'WEEKLY' : 'MONTHLY';
      const trialNotice = sub.is_free_trial ? ' [TRIAL EXPIRY]' : '';

      events.push(`BEGIN:VEVENT
UID:${sub.id}@renewradar
DTSTAMP:${dtStamp}
DTSTART;VALUE=DATE:${dtStart}
RRULE:FREQ=${cycleFreq}
SUMMARY:Renew: ${sub.name}${trialNotice} (${sub.amount.toFixed(2)} ${sub.currency})
DESCRIPTION:RenewRadar automated reminder for ${sub.name}. Billing amount: ${sub.amount.toFixed(2)} ${sub.currency}. Notes: ${sub.notes || 'None'}. Cancel here: ${sub.cancel_url || 'N/A'}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:RenewRadar Reminder: ${sub.name} renews tomorrow!
END:VALARM
END:VEVENT`);
    }

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RenewRadar//Subscription Watchdog//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:RenewRadar Subscriptions
X-WR-TIMEZONE:UTC
${events.join('\n')}
END:VCALENDAR`;
  }

  /**
   * Returns preset templates with direct cancellation advice
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
        cancellationSteps: '1. Click Profile icon -> My Plan\n2. Select Manage My Subscription\n3. Click Cancel Plan (skip the retention discount screen)',
        platform: 'WEB',
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
        cancellationSteps: '1. Open Claude Settings -> Billing\n2. Click Cancel Subscription\n3. Confirm on Stripe checkout portal',
        platform: 'WEB',
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
        cancellationSteps: '1. Open Account Overview\n2. Click Finish Cancellation\n3. Your account remains active until the end of billing period',
        platform: 'WEB',
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
        cancellationSteps: '1. Log in to account overview\n2. Under Your Plan, click Change Plan\n3. Scroll to Cancel Spotify and confirm',
        platform: 'WEB',
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
        cancellationSteps: '1. Open GitHub Settings -> Billing and plans\n2. Locate Copilot and select Cancel',
        platform: 'WEB',
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
        cancellationSteps: '1. Open Paid Memberships\n2. Click Manage Membership\n3. Choose Deactivate -> Pause or Cancel',
        platform: 'GOOGLE',
        iconName: 'PlaySquare',
      },
      {
        id: 'preset_icloud',
        name: 'iCloud+',
        category: 'WORK',
        defaultAmount: 3.0,
        defaultCurrency: 'EUR',
        defaultCycle: 'MONTHLY',
        cancelUrl: 'itms-apps://apps.apple.com/account/subscriptions',
        cancellationSteps: '1. Open iPhone Settings -> Tap your name\n2. Tap Subscriptions\n3. Select iCloud+ and choose Downgrade Options',
        platform: 'APPLE',
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
        cancellationSteps: 'Submit cancellation notice 14-30 days before billing cycle to avoid automated direct debit.',
        platform: 'OTHER',
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
      const headers = ['name', 'category', 'amount', 'currency', 'billing_cycle', 'next_billing_date', 'is_free_trial', 'status', 'shared_with', 'cancel_url', 'cancellation_steps', 'notes'];
      const rows = subscriptions.map(sub => [
        `"${sub.name.replace(/"/g, '""')}"`,
        sub.category,
        sub.amount,
        sub.currency,
        sub.billing_cycle,
        new Date(sub.next_billing_date).toISOString().split('T')[0],
        sub.is_free_trial ? 'Yes' : 'No',
        sub.status,
        sub.shared_with_count || 1,
        `"${(sub.cancel_url || '').replace(/"/g, '""')}"`,
        `"${(sub.cancellation_steps || '').replace(/"/g, '""')}"`,
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
