export const DEMO_TELEGRAM_USER_ID = 999999999;

export function seedDemoData(db: any): void {
  // Check if subscriptions already exist for demo user
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM subscriptions WHERE telegram_user_id = ?')
    .get(DEMO_TELEGRAM_USER_ID) as { cnt: number } | undefined;

  if (countRow && countRow.cnt > 0) {
    return;
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  // 6 active subscriptions totaling exactly 85.00 EUR/month, plus 1 saved trial
  const demoSubscriptions = [
    {
      id: 'demo_chatgpt_plus',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'ChatGPT Plus',
      category: 'AI_TOOLS',
      amount: 20.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (36 * hourMs), // Expiring in 36 hours
      is_free_trial: 1,
      trial_duration_days: 14,
      alert_sent: 0,
      cancel_url: 'https://chatgpt.com/#settings',
      cancellation_steps: '1. Click Profile icon -> My Plan\n2. Select Manage My Subscription\n3. Click Cancel Plan (skip the retention offers)',
      notes: 'Evaluate Claude vs GPT before trial renewal',
      status: 'ACTIVE',
      saved_amount: 0.0,
      shared_with_count: 1,
      platform: 'WEB',
      created_at: now - (12 * dayMs),
      updated_at: now - (12 * dayMs),
    },
    {
      id: 'demo_claude_pro',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'Claude Pro',
      category: 'AI_TOOLS',
      amount: 20.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (18 * dayMs),
      is_free_trial: 0,
      trial_duration_days: 0,
      alert_sent: 0,
      cancel_url: 'https://claude.ai/settings/billing',
      cancellation_steps: '1. Open Claude Settings -> Billing\n2. Click Cancel Subscription\n3. Confirm on Stripe checkout portal',
      notes: 'Primary coding assistant',
      status: 'ACTIVE',
      saved_amount: 0.0,
      shared_with_count: 1,
      platform: 'WEB',
      created_at: now - (40 * dayMs),
      updated_at: now - (10 * dayMs),
    },
    {
      id: 'demo_netflix',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'Netflix Standard',
      category: 'STREAMING',
      amount: 14.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (12 * dayMs),
      is_free_trial: 0,
      trial_duration_days: 0,
      alert_sent: 0,
      cancel_url: 'https://www.netflix.com/youraccount',
      cancellation_steps: '1. Navigate to Account Settings\n2. Click Cancel Membership button\n3. Confirm cancellation',
      notes: 'Shared with roommate (split 50/50)',
      status: 'ACTIVE',
      saved_amount: 0.0,
      shared_with_count: 2, // Shared 2 ways -> 7 EUR net
      platform: 'WEB',
      created_at: now - (90 * dayMs),
      updated_at: now - (18 * dayMs),
    },
    {
      id: 'demo_spotify',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'Spotify Premium',
      category: 'STREAMING',
      amount: 11.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (7 * dayMs),
      is_free_trial: 0,
      trial_duration_days: 0,
      alert_sent: 0,
      cancel_url: 'https://www.spotify.com/account/overview',
      cancellation_steps: '1. Log in to account overview\n2. Under Your Plan, click Change Plan\n3. Scroll to Cancel Spotify and confirm',
      notes: 'Music & podcast streaming',
      status: 'ACTIVE',
      saved_amount: 0.0,
      shared_with_count: 1,
      platform: 'WEB',
      created_at: now - (180 * dayMs),
      updated_at: now - (23 * dayMs),
    },
    {
      id: 'demo_icloud',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'iCloud+ 200GB',
      category: 'WORK',
      amount: 3.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (24 * dayMs),
      is_free_trial: 0,
      trial_duration_days: 0,
      alert_sent: 0,
      cancel_url: 'itms-apps://apps.apple.com/account/subscriptions',
      cancellation_steps: '1. Open iPhone Settings -> Tap your name\n2. Tap Subscriptions\n3. Select iCloud+ and choose Downgrade Options',
      notes: 'Apple Family storage',
      status: 'ACTIVE',
      saved_amount: 0.0,
      shared_with_count: 1,
      platform: 'APPLE',
      created_at: now - (365 * dayMs),
      updated_at: now - (6 * dayMs),
    },
    {
      id: 'demo_gym',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'Local Fitness Club',
      category: 'FITNESS',
      amount: 17.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (15 * dayMs),
      is_free_trial: 0,
      trial_duration_days: 0,
      alert_sent: 0,
      cancel_url: 'https://gym.example.com/membership',
      cancellation_steps: 'Send written notice to contact@gym.example.com 14 days before billing date',
      notes: 'Gym access and pool membership',
      status: 'ACTIVE',
      saved_amount: 0.0,
      shared_with_count: 1,
      platform: 'WEB',
      created_at: now - (60 * dayMs),
      updated_at: now - (15 * dayMs),
    },
    // Previously cancelled trial to illustrate Lifetime Money Saved counter
    {
      id: 'demo_adobe_cancelled',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'Adobe Creative Cloud',
      category: 'WORK',
      amount: 35.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now - (45 * dayMs),
      is_free_trial: 0,
      trial_duration_days: 7,
      alert_sent: 1,
      cancel_url: 'https://account.adobe.com/plans',
      cancellation_steps: 'Manage plan -> Cancel before day 7 to avoid early termination fee',
      notes: 'Trial cancelled on time with RenewRadar alert',
      status: 'CANCELLED',
      saved_amount: 105.0, // 3 months of saved expense = 105 EUR
      shared_with_count: 1,
      platform: 'WEB',
      created_at: now - (60 * dayMs),
      updated_at: now - (45 * dayMs),
    },
  ];

  const insertStmt = db.prepare(`
    INSERT INTO subscriptions (
      id, telegram_user_id, name, category, amount, currency, billing_cycle,
      next_billing_date, is_free_trial, trial_duration_days, alert_sent,
      cancel_url, cancellation_steps, notes, status, saved_amount,
      shared_with_count, platform, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const sub of demoSubscriptions) {
    insertStmt.run(
      sub.id,
      sub.telegram_user_id,
      sub.name,
      sub.category,
      sub.amount,
      sub.currency,
      sub.billing_cycle,
      sub.next_billing_date,
      sub.is_free_trial,
      sub.trial_duration_days,
      sub.alert_sent,
      sub.cancel_url,
      sub.cancellation_steps,
      sub.notes,
      sub.status,
      sub.saved_amount,
      sub.shared_with_count,
      sub.platform,
      sub.created_at,
      sub.updated_at
    );
  }

  // Also seed user settings
  db.prepare(`
    INSERT OR IGNORE INTO user_settings (
      telegram_user_id, preferred_currency, alert_threshold_hours, alert_thresholds, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(DEMO_TELEGRAM_USER_ID, 'EUR', 48, '[168, 48, 24, 2]', now, now);

  console.log(`✓ Seeded demo subscriptions with cancellation steps & saved counters ($85.00/mo burn rate)`);
}
