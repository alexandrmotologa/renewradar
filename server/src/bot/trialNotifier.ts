import { Bot, InlineKeyboard } from 'grammy';
import { Subscription } from '../types/index.js';

export async function dispatchTrialAlert(
  bot: Bot | null,
  subscription: Subscription
): Promise<boolean> {
  const now = Date.now();
  const diffMs = subscription.next_billing_date - now;
  const hoursRemaining = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));

  const text = 
`⚠️ *[TRIAL EXPIRING SOON]*
Your free trial for *${escapeMarkdown(subscription.name)}* ends in *${hoursRemaining} hours*\\!
You will be charged *${subscription.amount.toFixed(2)} ${subscription.currency}* unless cancelled\\.`;

  const keyboard = new InlineKeyboard();

  if (subscription.cancel_url && subscription.cancel_url.startsWith('http')) {
    keyboard.url('❌ How to Cancel', subscription.cancel_url);
  } else {
    keyboard.text('❌ How to Cancel', `cancel:${subscription.id}`);
  }

  keyboard.text('✅ Keep Subscription', `keep:${subscription.id}`);
  keyboard.row();
  keyboard.text('⏱️ Snooze 12h', `snooze:${subscription.id}`);

  if (bot && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'mock_token') {
    try {
      await bot.api.sendMessage(subscription.telegram_user_id, text, {
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard,
      });
      console.log(`✓ Dispatched Telegram trial alert to user ${subscription.telegram_user_id} for ${subscription.name}`);
      return true;
    } catch (err: any) {
      console.error(`Failed to send Telegram alert to user ${subscription.telegram_user_id}:`, err.message);
      return false;
    }
  }

  // Console output simulation when running without active bot token in demo mode
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│ [WATCHDOG SIMULATION ALERT]                                │
│ To: Telegram User ${subscription.telegram_user_id}                              │
│ Service: ${subscription.name} (${subscription.amount.toFixed(2)} ${subscription.currency})                  │
│ Trial Ends In: ${hoursRemaining} hours                                  │
│ Actions: [❌ How to Cancel] [✅ Keep] [⏱️ Snooze 12h]      │
└─────────────────────────────────────────────────────────────┘
  `);
  return true;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
