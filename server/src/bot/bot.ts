import { Bot, InlineKeyboard } from 'grammy';
import { SubscriptionService } from '../services/subscriptionService.js';
import { IngestionService } from '../services/ingestionService.js';
import { getDatabase } from '../db/database.js';

export function setupBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'mock_token') {
    console.log('ℹ Running without active Telegram bot token (Demo / Local Mode)');
    return null;
  }

  const bot = new Bot(token);
  const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:8085';

  // /start command
  bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'there';
    const text = 
`👋 *Welcome to RenewRadar, ${escapeMarkdown(firstName)}\\!*

RenewRadar tracks recurring subscriptions and protects you from accidental trial renewals without requesting bank credentials\\.

🔥 *What you can do:*
• Tap the button below to launch the Mini App
• Send /burn to see your monthly burn rate
• Send /digest for this week's renewals
• Forward an email receipt or screenshot text here to auto\\-track
• Send /add <name> <price> to register an expense
• Send /trials to inspect active free trials`;

    const keyboard = new InlineKeyboard().webApp('🚀 Open RenewRadar', webAppUrl);

    await ctx.reply(text, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard,
    });
  });

  // /burn command
  bot.command('burn', async (ctx) => {
    const userId = ctx.from?.id || 0;
    const stats = SubscriptionService.getStats(userId, 'EUR');

    if (stats.subscription_count === 0) {
      await ctx.reply('You have no active subscriptions tracked yet. Use /add to start tracking, or launch the Mini App.');
      return;
    }

    const netNotice = stats.my_net_monthly_burn < stats.total_monthly_burn
      ? `\n• *My Net Share:* ${stats.my_net_monthly_burn.toFixed(2)} ${stats.currency} _(after family splits)_`
      : '';

    const text = 
`🔥 *Your Subscription Burn Rate*

• *Monthly Burn:* ${stats.total_monthly_burn.toFixed(2)} ${stats.currency}${netNotice}
• *Yearly Spend:* ${stats.total_yearly_burn.toFixed(2)} ${stats.currency}
• *Active Services:* ${stats.subscription_count}
• *Trials Active:* ${stats.active_trials_count} ${stats.expiring_trials_count > 0 ? `⚠️ (${stats.expiring_trials_count} expiring soon!)` : ''}
• *🎉 Lifetime Saved:* ${stats.lifetime_saved.toFixed(2)} ${stats.currency}`;

    await ctx.reply(text, { parse_mode: 'MarkdownV2' });
  });

  // /digest command: weekly renewal digest
  bot.command('digest', async (ctx) => {
    const userId = ctx.from?.id || 0;
    const subscriptions = SubscriptionService.getSubscriptions(userId).filter(s => s.status === 'ACTIVE');
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const thisWeek = subscriptions.filter(s => {
      const diff = s.next_billing_date - now;
      return diff >= 0 && diff <= sevenDaysMs;
    });

    if (thisWeek.length === 0) {
      await ctx.reply('✨ No renewals scheduled in the upcoming 7 days!');
      return;
    }

    let totalDue = 0;
    let text = '📅 *Renewals Coming Up This Week:*\n\n';

    for (const sub of thisWeek) {
      totalDue += sub.amount;
      const diffMs = sub.next_billing_date - now;
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
      const trialBadge = sub.is_free_trial ? ' ⚠️ [TRIAL]' : '';

      text += `• *${escapeMarkdown(sub.name)}*${trialBadge}: ${sub.amount.toFixed(2)} ${sub.currency}\n`;
      text += `  Due in: ${daysRemaining === 0 ? 'Today!' : `${daysRemaining} days`}\n`;
    }

    text += `\n*Total Due This Week:* ${totalDue.toFixed(2)} EUR`;
    await ctx.reply(text, { parse_mode: 'MarkdownV2' });
  });

  // /trials command
  bot.command('trials', async (ctx) => {
    const userId = ctx.from?.id || 0;
    const subscriptions = SubscriptionService.getSubscriptions(userId);
    const trials = subscriptions.filter(s => s.is_free_trial === 1 && s.status === 'ACTIVE');

    if (trials.length === 0) {
      await ctx.reply('✅ You have no active free trials right now.');
      return;
    }

    const now = Date.now();
    let text = '⚠️ *Active Free Trials:*\n\n';

    for (const trial of trials) {
      const diffMs = trial.next_billing_date - now;
      const hoursRemaining = Math.max(0, Math.round(diffMs / (60 * 60 * 1000)));
      const daysRemaining = Math.ceil(hoursRemaining / 24);

      text += `• *${escapeMarkdown(trial.name)}* — ${trial.amount.toFixed(2)} ${trial.currency}\n`;
      text += `  Renews in: *${hoursRemaining}h* (~${daysRemaining} days)\n`;
      if (trial.cancel_url) {
        text += `  [Cancel Here](${trial.cancel_url})\n`;
      }
      text += '\n';
    }

    await ctx.reply(text, { 
      parse_mode: 'MarkdownV2', 
      link_preview_options: { is_disabled: true } 
    });
  });

  // /add command
  bot.command('add', async (ctx) => {
    const userId = ctx.from?.id || 0;
    const text = ctx.message?.text || '';
    const parts = text.split(/\s+/).slice(1);

    if (parts.length < 2) {
      await ctx.reply('Usage: /add <name> <price> [trial]\nExample: /add Netflix 14\nExample: /add ChatGPT 20 trial');
      return;
    }

    const name = parts[0];
    const amount = parseFloat(parts[1]);

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Please provide a valid numeric price. Example: /add Netflix 14');
      return;
    }

    const isTrial = parts.length >= 3 && parts[2].toLowerCase() === 'trial';
    const now = Date.now();
    const nextDate = isTrial ? now + (14 * 24 * 60 * 60 * 1000) : now + (30 * 24 * 60 * 60 * 1000);

    SubscriptionService.createSubscription(userId, {
      name,
      amount,
      category: 'OTHER',
      currency: 'EUR',
      billing_cycle: 'MONTHLY',
      next_billing_date: nextDate,
      is_free_trial: isTrial,
      trial_duration_days: isTrial ? 14 : 0,
    });

    const replyMsg = isTrial
      ? `✓ Added *${escapeMarkdown(name)}* as a free trial (${amount.toFixed(2)} EUR/mo). Watchdog alert set for 48h before renewal.`
      : `✓ Added *${escapeMarkdown(name)}* at ${amount.toFixed(2)} EUR/month.`;

    await ctx.reply(replyMsg, { parse_mode: 'MarkdownV2' });
  });

  // /help command
  bot.command('help', async (ctx) => {
    const text = 
`🛡️ *RenewRadar Bot Commands*

• /start — Welcome message and Mini App launcher
• /burn — Summary of your monthly and annual burn rate
• /digest — Upcoming renewals for this week
• /add <name> <price> [trial] — Quick-add a subscription
• /trials — View all active trials and hours remaining
• /help — Show this reference

💡 *Tip:* You can forward subscription confirmation emails or paste receipt text here, and RenewRadar will automatically detect and parse it!`;

    await ctx.reply(text, { parse_mode: 'MarkdownV2' });
  });

  // Receipt / Text Ingestion Parser Listener
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return; // Ignore commands

    const receipt = IngestionService.parseText(text);
    if (!receipt || receipt.confidence < 0.7) {
      return; // Not a recognized subscription receipt
    }

    const trialNotice = receipt.is_free_trial ? `Free Trial (${receipt.trial_duration_days} days)` : 'Monthly Subscription';

    const card = 
`🧾 *Detected Subscription Receipt*

• *Service:* *${escapeMarkdown(receipt.name)}*
• *Price:* ${receipt.amount.toFixed(2)} ${receipt.currency}
• *Type:* ${escapeMarkdown(trialNotice)}
• *Category:* ${receipt.category}

Would you like to track this in RenewRadar?`;

    // Encode data in callback
    const callbackData = `ingest:${encodeURIComponent(receipt.name)}:${receipt.amount}:${receipt.currency}:${receipt.is_free_trial ? 1 : 0}:${receipt.trial_duration_days}`;
    
    // Trim if needed to comply with 64 byte callback limit
    const safeCallback = callbackData.length <= 64 
      ? callbackData 
      : `ingest:${encodeURIComponent(receipt.name.slice(0, 15))}:${receipt.amount}:${receipt.currency}:${receipt.is_free_trial ? 1 : 0}:${receipt.trial_duration_days}`;

    const keyboard = new InlineKeyboard().text('➕ Add to RenewRadar', safeCallback);

    await ctx.reply(card, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard,
    });
  });

  // Callback query handling
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    if (data.startsWith('ingest:')) {
      const parts = data.split(':');
      const name = decodeURIComponent(parts[1] || 'Service');
      const amount = parseFloat(parts[2] || '10');
      const currency = (parts[3] || 'EUR') as any;
      const isTrial = parts[4] === '1';
      const trialDays = parseInt(parts[5] || '14', 10);

      const now = Date.now();
      const nextDate = now + ((isTrial ? trialDays : 30) * 24 * 60 * 60 * 1000);

      SubscriptionService.createSubscription(userId, {
        name,
        amount,
        currency,
        category: 'OTHER',
        billing_cycle: 'MONTHLY',
        next_billing_date: nextDate,
        is_free_trial: isTrial,
        trial_duration_days: trialDays,
      });

      await ctx.answerCallbackQuery({ text: `✓ ${name} added to RenewRadar!` });
      await ctx.editMessageText(`✅ Successfully tracked *${escapeMarkdown(name)}* (${amount.toFixed(2)} ${currency}). Watchdog is active.`, {
        parse_mode: 'MarkdownV2',
      });
    } else if (data.startsWith('keep:')) {
      const subId = data.slice(5);
      const sub = SubscriptionService.getSubscriptionById(subId, userId);
      if (sub) {
        SubscriptionService.updateSubscription(subId, userId, {
          is_free_trial: false,
          alert_sent: false,
        });
        await ctx.answerCallbackQuery({ text: '✓ Subscription marked as kept!' });
        await ctx.editMessageText(`✅ Free trial for *${escapeMarkdown(sub.name)}* converted to an active monthly subscription.`, {
          parse_mode: 'MarkdownV2',
        });
      }
    } else if (data.startsWith('snooze:')) {
      const subId = data.slice(7);
      const db = getDatabase();
      db.prepare(`UPDATE subscriptions SET alert_sent = 0 WHERE id = ? AND telegram_user_id = ?`).run(subId, userId);
      await ctx.answerCallbackQuery({ text: '⏱️ Alert snoozed. You will be reminded again.' });
    } else if (data.startsWith('cancel:')) {
      const subId = data.slice(7);
      const sub = SubscriptionService.getSubscriptionById(subId, userId);
      if (sub) {
        await ctx.answerCallbackQuery();
        let reply = `❌ *Cancellation Guide for ${escapeMarkdown(sub.name)}:*\n\n`;
        if (sub.cancellation_steps) {
          reply += `${escapeMarkdown(sub.cancellation_steps)}\n\n`;
        }
        if (sub.cancel_url) {
          reply += `[Direct Cancellation Link](${sub.cancel_url})`;
        }
        await ctx.reply(reply, { parse_mode: 'MarkdownV2', link_preview_options: { is_disabled: true } });
      } else {
        await ctx.answerCallbackQuery({ text: 'Subscription not found.' });
      }
    }
  });

  return bot;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
