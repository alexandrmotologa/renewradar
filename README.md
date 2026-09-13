<p align="center">
  <img src="docs/images/logo.png?raw=true" alt="RenewRadar Logo" width="130" style="border-radius: 24px;" />
</p>

<h1 align="center">RenewRadar</h1>

<p align="center">
  A self-hosted Telegram Mini App and watchdog bot that tracks recurring subscription burn rates and alerts you before free trials expire, with zero banking credentials.
</p>

<p align="center">
  <a href="#quickstart"><img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20+" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/Fastify-5.x-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" /></a>
</p>

---

## Why RenewRadar exists

Many online services offer free 7-day or 30-day trials that automatically turn into recurring paid plans if not cancelled in time. Commercial subscription trackers often ask for read access to your bank account via Open Banking or Plaid, exposing sensitive transaction history to third parties.

RenewRadar handles subscription monitoring without connecting to any financial institution. You record your recurring services and free trials in a clean interface inside Telegram. A background watchdog service inspects your renewal dates every 60 seconds and sends direct alert notifications before any trial ends.

The project mascot is the **Radar Owl**, representing nocturnal vigilance and acute sensory focus. It catches renewal signals before money leaves your balance.

---

## Core capabilities

### Monthly burn rate cockpit
The interface calculates your exact recurring expenses per month and projects your annual spending across all active services. Subscriptions in different currencies (EUR, USD, RON, GBP) are normalized into your preferred currency using live exchange ratios.

### Free trial watchdog
An internal scheduler runs continuously in the background. When a free trial has 48 hours or 24 hours remaining, the bot sends an urgent notification directly to your Telegram chat with one-tap action buttons to review cancellation instructions or mark the service as kept.

### Zero-domain execution
You do not need a public domain, reverse proxy, or SSL certificate to run the application. The bot communicates using Telegram long polling (`getUpdates`). For local desktop development and testing, the Mini App includes an automatic fallback that provides mock Telegram user data.

### Quick chat commands
Add recurring expenses directly from chat without opening the graphical interface. Typing `/add Netflix 12` registers a monthly subscription in seconds. You can also run `/burn` for an immediate financial summary or `/trials` to inspect upcoming trial dates.

### Data ownership and export
Your data stays in a local SQLite file stored in write-ahead logging (WAL) mode. You can export your subscriptions at any time as JSON or CSV from the settings panel.

---

## Architecture overview

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
│  │ - Inline buttons  │        │ - /api/export       │  │
│  └─────────┬─────────┘        └──────────┬──────────┘  │
│            │                             │             │
│            ▼                             ▼             │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │  Renewal Watchdog │        │  SQLite Database    │  │
│  │  (60s tick loop)  ├───────►│  (WAL mode)         │  │
│  └───────────────────┘        └─────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

The system combines three parts:

1. **Fastify application server**: Serves REST endpoints for subscription management, calculates burn rate statistics, and serves the static production build of the React frontend.
2. **grammY Telegram bot**: Runs long polling to process incoming chat commands and dispatches outgoing trial alert messages.
3. **Renewal watchdog**: An in-process background worker that runs every 60 seconds to detect subscriptions expiring within 48 hours.

---

## Quickstart

### Prerequisites
- Node.js 20.0 or higher
- npm 10.0 or higher
- A Telegram bot token from [@BotFather](https://t.me/BotFather) (optional for demo mode)

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

If you do not have a Telegram bot token yet, you can leave `DEMO_MODE=true`. The server will run with mock data and full local UI capabilities.

### 3. Install dependencies and start development servers
You can start both backend and frontend concurrently:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../web
npm install

# Start both services
cd ..
npm run dev
```

The web interface will be available at `http://localhost:5173` (Vite dev server) or `http://localhost:8080` (Fastify integrated server).

---

## Demo mode

When `DEMO_MODE=true` is enabled, RenewRadar pre-populates your database with six common subscriptions totaling 85.00 EUR per month:

| Service | Category | Amount | Billing Cycle | Trial Status |
| :--- | :--- | :--- | :--- | :--- |
| **ChatGPT Plus** | AI Tools | 20.00 EUR | Monthly | Free Trial (expiring in 36h) |
| **Claude Pro** | AI Tools | 20.00 EUR | Monthly | Active |
| **Netflix Standard** | Streaming | 14.00 EUR | Monthly | Active |
| **Spotify Premium** | Streaming | 11.00 EUR | Monthly | Active |
| **iCloud+ 200GB** | Work & Cloud | 3.00 EUR | Monthly | Active |
| **Local Fitness Club** | Fitness | 17.00 EUR | Monthly | Active |

The watchdog automatically triggers a simulated trial expiration alert for ChatGPT Plus during demo mode.

---

## Running with Docker

Run RenewRadar with a single Docker Compose command:

```bash
docker compose up -d --build
```

The service will start on port 8080. SQLite database records persist in the `renewradar_data` volume.

---

## Telegram Bot commands

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/start` | None | Welcomes the user, explains privacy model, and opens the Mini App |
| `/burn` | None | Displays current monthly burn rate and annual spending projection |
| `/add` | `<name> <price> [trial]` | Quickly adds a new subscription (e.g. `/add Netflix 14`) |
| `/trials` | None | Lists all active free trials and remaining hours until renewal |
| `/help` | None | Shows command manual and configuration instructions |

---

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md): Database schemas, watchdog logic, and Telegram auth verification.
- [REST API Reference](docs/API.md): Endpoints for subscription CRUD, analytics, and export.
- [Telegram Setup Guide](docs/TELEGRAM_SETUP.md): Step-by-step instructions for BotFather, WebApp menus, and long polling.
- [Demo Walkthrough](docs/DEMO.md): Guide to verifying demo subscriptions and trial alerts.

---

## License

RenewRadar is open source software released under the [MIT License](LICENSE).
