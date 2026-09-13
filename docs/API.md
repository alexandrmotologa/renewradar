# REST API reference

All API endpoints are served under the `/api` prefix. Requests originating from the Telegram Mini App provide credentials via the `Authorization: tma <initData>` header. In development or demo mode, missing authorization defaults to the sandbox user profile.

---

## Subscriptions

### List subscriptions
- **Route**: `GET /api/subscriptions`
- **Description**: Returns all subscriptions belonging to the authenticated user.
- **Response**:
  ```json
  [
    {
      "id": "sub_chatgpt_plus",
      "telegram_user_id": 999999999,
      "name": "ChatGPT Plus",
      "category": "AI_TOOLS",
      "amount": 20.0,
      "currency": "EUR",
      "billing_cycle": "MONTHLY",
      "next_billing_date": 1773600000000,
      "is_free_trial": 1,
      "trial_duration_days": 14,
      "alert_sent": 0,
      "cancel_url": "https://chatgpt.com/#settings",
      "notes": "Cancel before renewal",
      "created_at": 1773400000000
    }
  ]
  ```

### Create subscription
- **Route**: `POST /api/subscriptions`
- **Body**:
  ```json
  {
    "name": "Netflix Standard",
    "category": "STREAMING",
    "amount": 14.0,
    "currency": "EUR",
    "billing_cycle": "MONTHLY",
    "next_billing_date": 1775000000000,
    "is_free_trial": 0,
    "trial_duration_days": 0,
    "cancel_url": "https://netflix.com/youraccount",
    "notes": "Family plan"
  }
  ```
- **Response**: Created subscription object with HTTP 201.

### Update subscription
- **Route**: `PUT /api/subscriptions/:id`
- **Description**: Modifies fields of an existing subscription.
- **Body**: Partial subscription object.
- **Response**: Updated subscription object.

### Delete subscription
- **Route**: `DELETE /api/subscriptions/:id`
- **Description**: Permanently removes a subscription.
- **Response**: `{ "success": true, "id": "sub_id" }`

---

## Analytics and statistics

### Get user financial summary
- **Route**: `GET /api/stats`
- **Description**: Computes monthly burn rate, annual spend projection, category breakdown, and upcoming trial alerts.
- **Query parameters**:
  - `currency` (optional): Override display currency (`EUR`, `USD`, `RON`, `GBP`).
- **Response**:
  ```json
  {
    "currency": "EUR",
    "total_monthly_burn": 85.0,
    "total_yearly_burn": 1020.0,
    "subscription_count": 6,
    "active_trials_count": 1,
    "expiring_trials_count": 1,
    "category_breakdown": {
      "AI_TOOLS": 40.0,
      "STREAMING": 25.0,
      "WORK": 3.0,
      "FITNESS": 17.0,
      "OTHER": 0.0
    },
    "upcoming_charges": [
      {
        "id": "sub_chatgpt_plus",
        "name": "ChatGPT Plus",
        "amount": 20.0,
        "currency": "EUR",
        "next_billing_date": 1773600000000,
        "is_free_trial": 1,
        "days_remaining": 1
      }
    ]
  }
  ```

---

## Presets and templates

### Get common service presets
- **Route**: `GET /api/presets`
- **Description**: Returns quick-add templates for popular subscriptions (ChatGPT, Netflix, Spotify, Claude, GitHub Copilot, iCloud, YouTube Premium) with default price, category, and direct cancellation URL.

---

## Data portability

### Export subscriptions
- **Route**: `GET /api/export`
- **Query parameters**:
  - `format`: `json` (default) or `csv`.
- **Response**: File download or JSON payload of all recorded subscriptions.

### Import subscriptions
- **Route**: `POST /api/import`
- **Description**: Restores or merges subscriptions from a previously exported JSON backup.
- **Body**:
  ```json
  {
    "subscriptions": [...]
  }
  ```
- **Response**: `{ "imported": 6, "errors": [] }`
