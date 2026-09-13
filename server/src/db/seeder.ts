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

  // 6 subscriptions totaling exactly 85.00 EUR/month
  const demoSubscriptions = [
    {
      id: 'demo_chatgpt_plus',
      telegram_user_id: DEMO_TELEGRAM_USER_ID,
      name: 'ChatGPT Plus',
      category: 'AI_TOOLS',
      amount: 20.0,
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: now + (36 * hourMs), // Expiring in 36 hours (triggers <= 48h watchdog alert)
      is_free_trial: 1,
      trial_duration_days: 14,
      alert_sent: 0,
      cancel_url: 'https://chatgpt.com/#settings',
      notes: 'Evaluate Claude vs GPT before trial renewal',
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
      notes: 'Primary coding assistant',
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
      notes: 'Family profile account',
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
      notes: 'Music & podcast streaming',
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
      cancel_url: 'https://appleid.apple.com',
      notes: 'Photo backup and cloud drive',
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
      notes: 'Gym access and pool membership',
      created_at: now - (60 * dayMs),
      updated_at: now - (15 * dayMs),
    },
  ];

  const insertStmt = db.prepare(`
    INSERT INTO subscriptions (
      id, telegram_user_id, name, category, amount, currency, billing_cycle,
      next_billing_date, is_free_trial, trial_duration_days, alert_sent,
      cancel_url, notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
      sub.notes,
      sub.created_at,
      sub.updated_at
    );
  }

  // Also seed user settings
  db.prepare(`
    INSERT OR IGNORE INTO user_settings (
      telegram_user_id, preferred_currency, alert_threshold_hours, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(DEMO_TELEGRAM_USER_ID, 'EUR', 48, now, now);

  console.log(`✓ Seeded ${demoSubscriptions.length} subscriptions in DEMO_MODE ($85.00/mo burn rate)`);
}
