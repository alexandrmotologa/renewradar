export type Category = 'AI_TOOLS' | 'STREAMING' | 'WORK' | 'FITNESS' | 'OTHER';

export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'WEEKLY';

export type Currency = 'EUR' | 'USD' | 'RON' | 'GBP';

export interface Subscription {
  id: string;
  telegram_user_id: number;
  name: string;
  category: Category;
  amount: number;
  currency: Currency;
  billing_cycle: BillingCycle;
  next_billing_date: number; // epoch ms
  is_free_trial: number; // 0 or 1
  trial_duration_days: number;
  alert_sent: number; // 0 or 1
  cancel_url?: string | null;
  notes?: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateSubscriptionInput {
  name: string;
  category: Category;
  amount: number;
  currency?: Currency;
  billing_cycle?: BillingCycle;
  next_billing_date: number;
  is_free_trial?: boolean;
  trial_duration_days?: number;
  cancel_url?: string;
  notes?: string;
}

export interface UpdateSubscriptionInput {
  name?: string;
  category?: Category;
  amount?: number;
  currency?: Currency;
  billing_cycle?: BillingCycle;
  next_billing_date?: number;
  is_free_trial?: boolean;
  trial_duration_days?: number;
  alert_sent?: boolean;
  cancel_url?: string;
  notes?: string;
}

export interface UpcomingCharge {
  id: string;
  name: string;
  category: Category;
  amount: number;
  currency: Currency;
  next_billing_date: number;
  is_free_trial: boolean;
  days_remaining: number;
  hours_remaining: number;
  cancel_url?: string | null;
}

export interface StatsResponse {
  currency: Currency;
  total_monthly_burn: number;
  total_yearly_burn: number;
  subscription_count: number;
  active_trials_count: number;
  expiring_trials_count: number;
  category_breakdown: Record<Category, number>;
  upcoming_charges: UpcomingCharge[];
}

export interface PresetTemplate {
  id: string;
  name: string;
  category: Category;
  defaultAmount: number;
  defaultCurrency: Currency;
  defaultCycle: BillingCycle;
  cancelUrl: string;
  iconName: string;
}

export interface UserSettings {
  telegram_user_id: number;
  preferred_currency: Currency;
  alert_threshold_hours: number;
  created_at: number;
  updated_at: number;
}
