# Demo mode walkthrough

When starting RenewRadar with `DEMO_MODE=true`, the server pre-seeds six recurring subscriptions and prepares a simulated trial expiration alert.

---

## Pre-seeded data breakdown

The demo profile belongs to sandbox user ID `999999999`:

| Service | Category | Amount | Cycle | Monthly Normalized | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ChatGPT Plus** | AI Tools | 20.00 EUR | Monthly | 20.00 EUR | Free Trial (expiring in 36h) |
| **Claude Pro** | AI Tools | 20.00 EUR | Monthly | 20.00 EUR | Standard active |
| **Netflix Standard** | Streaming | 14.00 EUR | Monthly | 14.00 EUR | Standard active |
| **Spotify Premium** | Streaming | 11.00 EUR | Monthly | 11.00 EUR | Standard active |
| **iCloud+ 200GB** | Work & Cloud | 3.00 EUR | Monthly | 3.00 EUR | Standard active |
| **Local Fitness Club** | Fitness | 17.00 EUR | Monthly | 17.00 EUR | Standard active |

### Financial summary calculation

- **Total monthly burn rate**: 20 + 20 + 14 + 11 + 3 + 17 = **85.00 EUR / month**
- **Annual spend projection**: 85.00 * 12 = **1,020.00 EUR / year**
- **Category share**:
  - AI Tools: 40.00 EUR (47.1%)
  - Streaming: 25.00 EUR (29.4%)
  - Fitness: 17.00 EUR (20.0%)
  - Work: 3.00 EUR (3.5%)

---

## Verifying demo mode via API

Start the server and test with curl:

```bash
curl http://localhost:8080/api/stats
```

Expected output:

```json
{
  "currency": "EUR",
  "total_monthly_burn": 85,
  "total_yearly_burn": 1020,
  "subscription_count": 6,
  "active_trials_count": 1,
  "expiring_trials_count": 1,
  "category_breakdown": {
    "AI_TOOLS": 40,
    "STREAMING": 25,
    "WORK": 3,
    "FITNESS": 17,
    "OTHER": 0
  }
}
```

---

## Testing trial watchdog alerts in demo mode

The watchdog detects that **ChatGPT Plus** is a free trial scheduled to renew in 36 hours (which is under the 48-hour alert window).

1. In demo mode, the alert dispatcher prints the formatted message to the server log:
   ```
   [WATCHDOG DEMO ALERT] -> Telegram User 999999999:
   ⚠️ TRIAL EXPIRING SOON
   Your free trial for ChatGPT Plus ends in 36 hours!
   You will be charged 20.00 EUR unless cancelled.
   [ ❌ How to Cancel ]  [ ✅ Keep Subscription ]  [ ⏱️ Snooze 12h ]
   ```
2. If a valid `TELEGRAM_BOT_TOKEN` is configured, the bot also sends this message directly to your Telegram chat.
3. The database updates `alert_sent = 1` so the alert is not resent on subsequent watchdog ticks.
