import { BillingCycle, Currency } from '../types/index.js';

// Base currency is EUR
const EUR_RATES: Record<Currency, number> = {
  EUR: 1.0,
  USD: 1.08,
  RON: 4.97,
  GBP: 0.85,
};

/**
 * Converts an amount from one currency to another via EUR base
 */
export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) {
    return Number(amount.toFixed(2));
  }

  // Convert from origin to EUR
  const rateFrom = EUR_RATES[from] || 1.0;
  const amountInEur = amount / rateFrom;

  // Convert from EUR to destination
  const rateTo = EUR_RATES[to] || 1.0;
  const converted = amountInEur * rateTo;

  return Number(converted.toFixed(2));
}

/**
 * Normalizes any billing cycle amount to an exact monthly cost
 */
export function normalizeToMonthly(amount: number, cycle: BillingCycle): number {
  let monthly = 0;

  switch (cycle) {
    case 'WEEKLY':
      // Average 4.3333 weeks per month
      monthly = amount * 4.3333;
      break;
    case 'YEARLY':
      monthly = amount / 12.0;
      break;
    case 'MONTHLY':
    default:
      monthly = amount;
      break;
  }

  return Number(monthly.toFixed(2));
}

/**
 * Calculates annual projection from monthly burn rate
 */
export function calculateYearlyProjection(monthlyBurn: number): number {
  return Number((monthlyBurn * 12.0).toFixed(2));
}
