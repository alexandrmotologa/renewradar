# Telegram bot and Mini App setup

This guide walks through creating a Telegram bot with @BotFather and configuring the Mini App menu button.

---

## 1. Create a bot with @BotFather

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Enter a display name (for example, `RenewRadar Watchdog`).
4. Choose a unique username ending in `bot` (for example, `my_renewradar_bot`).
5. Copy the bot token provided in the confirmation message. It will look like:
   ```
   123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ
   ```
6. Add this token to your `.env` file:
   ```bash
   TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ
   ```

---

## 2. Register bot commands

Send `/setcommands` to [@BotFather], pick your bot, and paste:

```
start - Open RenewRadar and view your dashboard
burn - View monthly burn rate and spending projection
add - Add a subscription (e.g. /add Netflix 14)
trials - List active free trials and expiration status
help - How to use RenewRadar
```

---

## 3. Attach the Mini App to the chat menu button

To make the Mini App accessible via the menu button next to the chat text field:

1. Send `/setmenubutton` to [@BotFather].
2. Select your bot.
3. Choose **Configure menu button**.
4. Enter the button title: `RenewRadar`.
5. Enter your web URL:
   - For local development with tunnels: use your ngrok or localtunnel HTTPS URL.
   - For deployed instances: enter your domain (must support HTTPS).

Note: In local development, you do not need to register a menu button. The bot will automatically provide an inline WebApp button in response to `/start`.

---

## 4. Run the server

Start the application with:

```bash
npm run dev
```

The bot immediately connects to Telegram using long polling and logs:

```
✓ Connected to Telegram as @my_renewradar_bot (Long Polling)
✓ Renewal watchdog running (60s tick interval)
✓ Fastify listening at http://localhost:8080
```

Send `/start` to your bot in Telegram to open your dashboard.
