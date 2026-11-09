export const inr = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
export const indianNumber = (value: number): string =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(
    Number.isFinite(value) ? value : 0,
  );
export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  schedule: {
    month: number;
    opening: number;
    emi: number;
    principal: number;
    interest: number;
    closing: number;
  }[];
}
export function calculateEMI(principal: number, annualRate: number, months: number): EmiResult {
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRate) ||
    !Number.isInteger(months) ||
    principal < 10000 ||
    principal > 100000000 ||
    annualRate < 1 ||
    annualRate > 36 ||
    months < 1 ||
    months > 360
  )
    throw new Error('Enter valid principal, rate and tenure within the allowed ranges.');
  const r = annualRate / 1200;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  let balance = principal;
  const schedule = Array.from({ length: months }, (_, i) => {
    const interest = balance * r;
    const paid = Math.min(balance, emi - interest);
    const closing = Math.max(0, balance - paid);
    const row = {
      month: i + 1,
      opening: balance,
      emi: paid + interest,
      principal: paid,
      interest,
      closing,
    };
    balance = closing;
    return row;
  });
  const totalPayment = emi * months;
  return { emi, totalInterest: totalPayment - principal, totalPayment, schedule };
}
export interface SipResult {
  futureValue: number;
  invested: number;
  wealthGained: number;
  yearly: { year: number; invested: number; futureValue: number; wealthGained: number }[];
}
export function calculateSIP(monthly: number, annualRate: number, years: number): SipResult {
  if (
    !Number.isFinite(monthly) ||
    !Number.isFinite(annualRate) ||
    !Number.isInteger(years) ||
    monthly < 500 ||
    monthly > 1000000 ||
    annualRate < 1 ||
    annualRate > 30 ||
    years < 1 ||
    years > 40
  )
    throw new Error('Enter valid SIP values within the allowed ranges.');
  const r = annualRate / 1200;
  const fv = (n: number) => ((monthly * (Math.pow(1 + r, n) - 1)) / r) * (1 + r);
  const invested = monthly * years * 12;
  const futureValue = fv(years * 12);
  const yearly = Array.from({ length: years }, (_, i) => {
    const n = (i + 1) * 12;
    const inv = monthly * n;
    const value = fv(n);
    return { year: i + 1, invested: inv, futureValue: value, wealthGained: value - inv };
  });
  return { futureValue, invested, wealthGained: futureValue - invested, yearly };
}
export function calculateCompound(
  principal: number,
  annualRate: number,
  years: number,
  frequency: 1 | 4 | 2 | 12,
): number {
  if (
    principal <= 0 ||
    annualRate < 0 ||
    years <= 0 ||
    !Number.isFinite(principal + annualRate + years)
  )
    throw new Error('Enter positive principal and duration, and a non-negative rate.');
  return principal * Math.pow(1 + annualRate / 100 / frequency, frequency * years);
}
export function compoundSeries(
  principal: number,
  rate: number,
  years: number,
  frequency: 1 | 2 | 4 | 12,
): { year: number; value: number }[] {
  return Array.from({ length: years }, (_, i) => ({
    year: i + 1,
    value: calculateCompound(principal, rate, i + 1, frequency),
  }));
}
export function scoreQuiz(
  selected: number[],
  correct: number[],
  points: number,
  partial = false,
): number {
  if (!correct.length || points < 0) return 0;
  const hit = selected.filter((x) => correct.includes(x)).length;
  const wrong = selected.filter((x) => !correct.includes(x)).length;
  if (!partial) return hit === correct.length && wrong === 0 ? points : 0;
  return Math.max(0, (points * (hit - wrong)) / correct.length);
}
export function filterBlockTypes<T extends {
  type: string;
  label: string;
  keywords: string[];
}>(
  query: string,
  items: readonly T[]
): T[] {
  const q = query.trim().toLowerCase();

  if (!q) {
    return [...items];
  }

  return items.filter((item) =>
    `${item.label} ${item.type} ${item.keywords.join(' ')}`
      .toLowerCase()
      .includes(q)
  );
}
