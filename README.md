<p align="center">
  <img src="docs/images/logo.png?raw=true" alt="RenewRadar Logo" width="130" style="border-radius: 24px;" />
</p>

<h1 align="center">RenewRadar</h1>

<p align="center">
  A self-hosted Telegram Mini App and watchdog bot that tracks recurring subscription burn rates, detects redundant services, and shields you from auto-renewals with zero banking credentials.
</p>

<p align="center">
  <a href="#quickstart"><img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20+" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/Fastify-5.x-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" /></a>
</p>

<p align="center">
  <img src="docs/images/demo.gif?raw=true" alt="RenewRadar Interactive Demo" width="380" style="border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7);" />
</p>

---

## Why RenewRadar exists

Many modern subscription businesses depend on forgetfulness: you register for a 7-day or 14-day free trial, forget the renewal date, and get billed for an entire year. Commercial subscription management apps often demand read permissions on your personal bank account via Plaid or Open Banking, storing sensitive financial transaction records on remote cloud servers.

RenewRadar takes a privacy-first approach. You run your own watchdog inside Telegram. You register your recurring subscriptions and active free trials in a clean interface. A lightweight background worker evaluates renewal deadlines every 60 seconds and notifies you directly before money leaves your account.

The official brand mascot is the **Radar Owl**, chosen for its parabolic acoustic facial discs and night vision. It scans subscription horizons continuously so that unexpected charges never catch you off guard.

---

## Visual Tour

<table>
  <tr>
    <td width="50%" align="center">
      <b>Cockpit, Lifetime Saved & Ghost Hunter</b><br/>
      <img src="docs/images/screenshot_dashboard.png?raw=true" alt="Dashboard View" width="360" style="border-radius: 14px; margin-top: 8px;" />
    </td>
    <td width="50%" align="center">
      <b>Anti-Dark-Pattern Cancellation Shield</b><br/>
      <img src="docs/images/screenshot_detail_shield.png?raw=true" alt="Cancellation Shield" width="360" style="border-radius: 14px; margin-top: 8px;" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <b>Quick Add, Platforms & Family Split</b><br/>
      <img src="docs/images/screenshot_add_subscription.png?raw=true" alt="Add Subscription Modal" width="360" style="border-radius: 14px; margin-top: 8px;" />
    </td>
    <td width="50%" align="center">
      <b>Monthly Renewal Calendar</b><br/>
      <img src="docs/images/screenshot_calendar_view.png?raw=true" alt="Renewal Calendar View" width="360" style="border-radius: 14px; margin-top: 8px;" />
    </td>
  </tr>
</table>

---

## Core Capabilities

### 1. Monthly Burn Rate Cockpit & Family Split
Calculates your exact recurring burn rate per month and projects your annual expenses. If you share a plan with family members or roommates, toggle between **Total Billed** and **My Share** to monitor your true individual commitment. Live exchange rates normalize costs across EUR, USD, RON, and GBP.

### 2. Free Trial Watchdog & Timely Alerts
An internal 60-second scanning loop tracks expiring trials. When a service approaches its renewal deadline (such as 48 hours or 24 hours out), the bot dispatches a high-priority alert directly to your Telegram chat with one-tap action buttons.

### 3. Ghost Hunter & Redundancy Detection
Scans your active catalog for overlapping tools in the same category. If you pay for two concurrent AI coding companions or multiple streaming services, Ghost Hunter quantifies the exact monthly consolidation savings and highlights them on your dashboard.

### 4. Anti-Dark-Pattern Cancellation Shield
Subscription vendors often hide cancellation pages behind multi-step confirmation quizzes. The Cancellation Shield provides direct native deep-links (`itms-apps://` for Apple App Store, Google Play subscriptions, Stripe customer portals) alongside step-by-step cheat-sheets to bypass retention traps.

### 5. Lifetime Money Saved Tracker
When you cancel an expiring trial or trim an unused subscription, RenewRadar credits the avoided charges to your lifetime savings counter. The dashboard displays the cumulative cash preserved by active monitoring.

### 6. Apple & Google Calendar Sync (`.ics`)
Subscribing once to your private RFC 5545 feed (`/api/calendar.ics`) places renewal dates and customizable alert reminders directly onto your native phone or desktop calendar.

### 7. Smart Receipt Ingestion
Forward payment confirmations, invoice emails, or plain text to the Telegram bot. An ingestion parser extracts the provider name, cost, billing frequency, and renewal schedule automatically.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Telegram Client                      │
│   (Bot Commands, Direct Alerts, Mini App Webview)      │
└────────────────────────┬───────────────────────────────┘
                         │ Long Polling / WebApp InitData
                         ▼
┌────────────────────────────────────────────────────────┐
│               RenewRadar Fastify Server                │
│                                                        │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │   grammY Bot      │        │   REST API Routes   │  │
│  │ - /start, /burn   │        │ - /api/subscriptions│  │
│  │ - /add, /trials   │        │ - /api/stats        │  │
│  │ - /digest, /cancel│        │ - /api/calendar.ics │  │
│  └─────────┬─────────┘        └──────────┬──────────┘  │
│            │                             │             │
│            ▼                             ▼             │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │  Renewal Watchdog │        │  SQLite Database    │  │
│  │  (60s tick loop)  ├───────►│  (WAL mode)         │  │
│  └───────────────────┘        └─────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

The system combines three foundational layers:

1. **Fastify Application Server**: Serves REST endpoints for subscription management, generates dynamic `.ics` calendar streams, computes burn rate metrics, and serves the production React frontend bundle.
2. **grammY Telegram Bot**: Operates via long polling to process incoming chat commands, inline button callbacks, and receipt forward parsing.
3. **Autonomous Renewal Watchdog**: In-process background scheduler that scans renewal deadlines every 60 seconds and dispatches warning notifications.

---

## Quickstart

### Prerequisites
- Node.js 20.0 or higher
- npm 10.0 or higher
- A Telegram bot token from [@BotFather](https://t.me/BotFather) (optional when running in demo mode)

### 1. Clone the repository
```bash
git clone https://github.com/alexandrmotologa/renewradar.git
cd renewradar
```

### 2. Configure environment variables
Copy the example environment file:
```bash
cp .env.example .env
```

If you do not have a Telegram bot token yet, you can leave `DEMO_MODE=true`. The server will run with pre-seeded data and full browser UI capabilities.

### 3. Install dependencies and build
```bash
# Install root dependencies
npm install

# Build backend and frontend
npm run build
```

### 4. Start the application
```bash
npm run start
```

The web interface will be available at `http://localhost:8085`.

---

## Demo Mode

When `DEMO_MODE=true` is enabled, RenewRadar pre-populates your database with realistic subscriptions totaling 85.00 EUR per month:

| Service | Category | Amount | Split | Platform | Trial Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ChatGPT Plus** | AI Tools | 20.00 EUR | 1 person | Web Portal | Free Trial (expires in 36h) |
| **Claude Pro** | AI Tools | 20.00 EUR | 1 person | Web Portal | Active |
| **Netflix Standard** | Streaming | 14.00 EUR | 2 people | Web Portal | Active (7.00 EUR net share) |
| **Spotify Premium** | Streaming | 11.00 EUR | 1 person | Web Portal | Active |
| **Local Fitness Club** | Fitness | 17.00 EUR | 1 person | Web Portal | Active |
| **iCloud+ 200GB** | Work & Cloud | 3.00 EUR | 1 person | Apple Store | Active |
| **Adobe Creative Cloud** | Work & Cloud | 35.00 EUR | 1 person | Web Portal | Cancelled (105.00 EUR saved) |

The watchdog automatically triggers a simulated trial expiration alert for ChatGPT Plus during demo mode.

---

## Running with Docker

Run RenewRadar with Docker Compose:

```bash
docker compose up -d --build
```

The service will start on port 8085. SQLite database records persist in the `renewradar_data` volume.

---

## Telegram Bot Commands

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/start` | None | Welcomes the user, explains privacy model, and opens the Mini App |
| `/burn` | None | Displays current monthly burn rate, family split, and annual projection |
| `/digest` | None | Summarizes active subscriptions, expiring trials, and Ghost Hunter warnings |
| `/add` | `<text or forwarded receipt>` | Adds a subscription via natural text or email forward |
| `/trials` | None | Lists all active free trials and countdown hours |
| `/help` | None | Shows command manual and configuration instructions |

---

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md): Database schemas, watchdog logic, and Telegram auth verification.
- [REST API Reference](docs/API.md): Endpoints for subscription CRUD, iCalendar feed, and export.
- [Telegram Setup Guide](docs/TELEGRAM_SETUP.md): Instructions for BotFather, WebApp menus, and long polling.
- [Demo Walkthrough](docs/DEMO.md): Guide to verifying demo subscriptions and trial alerts.

---

## License

RenewRadar is open source software released under the [MIT License](LICENSE).
