import { Bot } from 'grammy';
import { getDatabase } from '../db/database.js';
import { Subscription } from '../types/index.js';
import { dispatchTrialAlert } from '../bot/trialNotifier.js';

let intervalTimer: NodeJS.Timeout | null = null;

export function startWatchdog(bot: Bot | null): void {
  const intervalMs = parseInt(process.env.WATCHDOG_INTERVAL_MS || '60000', 10);

  console.log(`✓ Renewal Watchdog initialized (Scanning every ${intervalMs / 1000}s)`);

  // Run initial scan on startup
  runScan(bot);

  intervalTimer = setInterval(() => {
    runScan(bot);
  }, intervalMs);
}

export function stopWatchdog(): void {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('✓ Renewal Watchdog stopped');
  }
}

export async function runScan(bot: Bot | null): Promise<number> {
  const db = getDatabase();
  const now = Date.now();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  // Find expiring free trials <= 48 hours where alert hasn't been sent
  const expiringTrials = db.prepare(`
    SELECT * FROM subscriptions
    WHERE is_free_trial = 1
      AND alert_sent = 0
      AND (next_billing_date - ?) <= ?
      AND next_billing_date > ?
  `).all(now, fortyEightHoursMs, now) as unknown as Subscription[];

  let alertsDispatched = 0;

  for (const sub of expiringTrials) {
    const success = await dispatchTrialAlert(bot, sub);
    if (success) {
      // Mark alert_sent = 1
      db.prepare(`
        UPDATE subscriptions 
        SET alert_sent = 1, updated_at = ? 
        WHERE id = ?
      `).run(Date.now(), sub.id);
      alertsDispatched++;
    }
  }

  return alertsDispatched;
}
