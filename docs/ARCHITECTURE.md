# RenewRadar architecture

This document explains the technical architecture, data model, and operational flow of RenewRadar.

## System design principles

RenewRadar follows three constraints:

1. **Local and private execution**: The software runs self-hosted and never transmits credentials to banking aggregators.
2. **Zero external domain requirement**: The bot uses Telegram long polling so users can run it on home servers, Raspberry Pis, or local laptops without opening inbound router ports or acquiring SSL certificates.
3. **Low resource footprint**: The entire stack runs on Node.js and SQLite in WAL mode, requiring under 80 MB of RAM.

---

## Component interaction

```
+-------------------------------------------------------------+
|                      Telegram Cloud                         |
+------------------------------+------------------------------+
                               |
            Long Polling       |   HTTPS POST (Alerts)
           (getUpdates)        |   (sendMessage)
                               v
+-------------------------------------------------------------+
|                 RenewRadar Server Process                   |
|                                                             |
|  +-----------------------+     +-------------------------+  |
|  |   grammY Bot Layer    |     |    Fastify Web Server   |  |
|  | - Command parsers     |     | - REST API routes       |  |
|  | - Inline callbacks    |     | - Static assets (SPA)   |  |
|  +-----------+-----------+     +------------+------------+  |
|              |                              |               |
|              +--------------+---------------+               |
|                             |                               |
|                             v                               |
|              +------------------------------+               |
|              |     Core Service Layer       |               |
|              | - Burn rate normalizer       |               |
|              | - Currency converter         |               |
|              +--------------+---------------+               |
|                             |                               |
|                             v                               |
|              +------------------------------+               |
|              |     SQLite Database (WAL)    |               |
|              | - subscriptions              |               |
|              | - user_settings              |               |
|              +------------------------------+               |
|                             ^                               |
|                             | 60-second polling             |
|              +--------------+---------------+               |
|              |       Renewal Watchdog       |               |
|              | - 48h trial expiry scanner   |               |
|              | - Dispatcher with debounce   |               |
|              +------------------------------+               |
+-------------------------------------------------------------+
```

---

## Data model

The SQLite database uses two primary tables.

### Subscriptions table

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  telegram_user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  billing_cycle TEXT NOT NULL,
  next_billing_date INTEGER NOT NULL,
  is_free_trial INTEGER DEFAULT 0,
  trial_duration_days INTEGER DEFAULT 0,
  alert_sent INTEGER DEFAULT 0,
  cancel_url TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user 
  ON subscriptions(telegram_user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_watchdog 
  ON subscriptions(is_free_trial, alert_sent, next_billing_date);
```

### Fields

- `id`: UUID string identifying the subscription.
- `telegram_user_id`: Numeric Telegram ID owning the record.
- `name`: Human-readable service name (such as "Netflix" or "ChatGPT Plus").
- `category`: Categorization enum (`AI_TOOLS`, `STREAMING`, `WORK`, `FITNESS`, `OTHER`).
- `amount`: Numeric price per billing cycle.
- `currency`: ISO code (`EUR`, `USD`, `RON`, `GBP`).
- `billing_cycle`: Cycle frequency (`MONTHLY`, `YEARLY`, `WEEKLY`).
- `next_billing_date`: Milliseconds since UNIX epoch for the upcoming renewal.
- `is_free_trial`: Boolean integer (1 if currently in trial mode, 0 if standard subscription).
- `alert_sent`: Boolean integer tracking whether an expiration warning has been sent to avoid duplicate spam.

### User settings table

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  telegram_user_id INTEGER PRIMARY KEY,
  preferred_currency TEXT DEFAULT 'EUR',
  alert_threshold_hours INTEGER DEFAULT 48,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## The renewal watchdog

The watchdog is an in-process worker instantiated upon server boot. It operates as follows:

1. Wakes up on a 60-second timer interval.
2. Evaluates the current epoch timestamp `now`.
3. Queries SQLite for subscriptions meeting the alert condition:
   ```sql
   SELECT * FROM subscriptions
   WHERE is_free_trial = 1
     AND alert_sent = 0
     AND next_billing_date - ? <= 172800000 -- 48 hours in milliseconds
     AND next_billing_date > ?;
   ```
4. For each expiring record, builds an alert message containing the service name, cost, and hours remaining.
5. Sends the message to the user with three inline keyboard actions:
   - **Cancellation guide**: Provides cancellation steps or URL.
   - **Keep subscription**: Sets `is_free_trial = 0` and marks the subscription active.
   - **Snooze 12 hours**: Resets the threshold so another warning fires closer to the deadline.
6. Updates `alert_sent = 1` in the database to prevent duplicate notifications.

---

## Burn rate calculations and currency normalization

To display a single unified financial dashboard, the server normalizes all active subscriptions to a monthly amount in the user's preferred currency.

### Cycle conversion formulas

- **Weekly**: `monthly_amount = weekly_amount * 4.3333`
- **Monthly**: `monthly_amount = amount`
- **Yearly**: `monthly_amount = yearly_amount / 12.0`

### Currency conversion

Exchange rates are stored in a conversion matrix and updated periodically:

- `1 EUR = 1.08 USD`
- `1 EUR = 4.97 RON`
- `1 EUR = 0.85 GBP`

When calculating totals, each item's converted monthly cost is added to the user's monthly burn rate total. The yearly projection is simply `monthly_burn * 12`.

---

## Telegram authentication

When accessed inside the Telegram client, the Mini App sends `window.Telegram.WebApp.initData` to the backend. The backend validates the cryptographic HMAC signature using the bot token according to Telegram's WebApp authentication protocol.

When running in local desktop development or `DEMO_MODE=true`, requests without `initData` are assigned a default sandbox profile (`telegram_user_id = 999999999`) to allow full testing in standard desktop browsers.
