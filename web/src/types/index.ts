export type Category = 'AI_TOOLS' | 'STREAMING' | 'WORK' | 'FITNESS' | 'OTHER';

export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'WEEKLY';

export type Currency = 'EUR' | 'USD' | 'RON' | 'GBP';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAUSED';

export type Platform = 'WEB' | 'APPLE' | 'GOOGLE' | 'OTHER';

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
  alert_sent: number;
  cancel_url?: string | null;
  cancellation_steps?: string | null;
  notes?: string | null;
  status: SubscriptionStatus;
  saved_amount: number;
  shared_with_count: number;
  platform: Platform;
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
  cancellation_steps?: string;
  notes?: string;
  status?: SubscriptionStatus;
  shared_with_count?: number;
  platform?: Platform;
}

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput> & {
  alert_sent?: boolean;
  saved_amount?: number;
};

export interface UpcomingCharge {
  id: string;
  name: string;
  category: Category;
  amount: number;
  my_share_amount: number;
  currency: Currency;
  next_billing_date: number;
  is_free_trial: boolean;
  days_remaining: number;
  hours_remaining: number;
  cancel_url?: string | null;
  cancellation_steps?: string | null;
  platform: Platform;
}

export interface GhostRecommendation {
  category: Category;
  services: string[];
  total_monthly_cost: number;
  potential_savings: number;
  message: string;
}

export interface StatsResponse {
  currency: Currency;
  total_monthly_burn: number;
  my_net_monthly_burn: number;
  total_yearly_burn: number;
  my_net_yearly_burn: number;
  lifetime_saved: number;
  subscription_count: number;
  active_trials_count: number;
  expiring_trials_count: number;
  category_breakdown: Record<Category, number>;
  upcoming_charges: UpcomingCharge[];
  ghost_recommendations: GhostRecommendation[];
}

export interface PresetTemplate {
  id: string;
  name: string;
  category: Category;
  defaultAmount: number;
  defaultCurrency: Currency;
  defaultCycle: BillingCycle;
  cancelUrl: string;
  cancellationSteps: string;
  platform: Platform;
  iconName: string;
}
