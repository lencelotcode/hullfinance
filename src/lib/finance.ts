import type { Loan, Debt, Currency, LoanSummary, DebtSummary } from './types';
import { CURRENCIES } from './types';
export { CURRENCIES };
export type { Currency };

export function convertGBPtoINR(gbp: number, rate: number): number {
  return Number(gbp) * rate;
}

export function convertINRtoGBP(inr: number, rate: number): number {
  return Number(inr) / rate;
}

export function fmt(n: number, currency: Currency): string {
  const cur = CURRENCIES[currency];
  const abs = Math.abs(Number(n) || 0);
  return cur.symbol + abs.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtGBP(n: number): string {
  const abs = Math.abs(Number(n) || 0);
  return '£' + abs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtINR(n: number): string {
  const abs = Math.abs(Number(n) || 0);
  return '₹' + abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtBoth(inrAmount: number, rate: number): string {
  const inr = Number(inrAmount) || 0;
  const gbp = convertINRtoGBP(inr, rate);
  return fmtINR(inr) + ' (' + fmtGBP(gbp) + ')';
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthLabel(m: string): string {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function calculateLoanWithInterest(loan: Loan, exchangeRate: number): LoanSummary {
  const principal = Number(loan.amount);
  const rate = Number(loan.interestRate || 0) / 100;
  const isCompound = loan.interestType === 'compound';

  const repayments = (loan.repayments || []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const loanDate = new Date(loan.date);
  const now = new Date();

  let balance = principal;
  let totalInterestAccrued = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let totalGbpPaid = 0;
  let prevDate = loanDate;

  repayments.forEach((r) => {
    const rDate = new Date(r.date);
    const daysDiff = (rDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 0 && balance > 0 && rate > 0) {
      let interest;
      if (isCompound) {
        const months = daysDiff / 30.44;
        interest = balance * (Math.pow(1 + rate / 12, months) - 1);
      } else {
        const years = daysDiff / 365;
        interest = balance * rate * years;
      }
      totalInterestAccrued += interest;
    }

    const payment = Number(r.inrAmount);
    let remaining = payment;

    const unpaidInterest = totalInterestAccrued - totalInterestPaid;
    if (unpaidInterest > 0) {
      const interestPayment = Math.min(unpaidInterest, remaining);
      totalInterestPaid += interestPayment;
      remaining -= interestPayment;
    }

    if (remaining > 0) {
      const principalPayment = Math.min(balance, remaining);
      balance -= principalPayment;
      totalPrincipalPaid += principalPayment;
    }

    totalGbpPaid += Number(r.gbpAmount);
    prevDate = rDate;
  });

  const daysToNow = (now.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysToNow > 0 && balance > 0 && rate > 0) {
    let interest;
    if (isCompound) {
      const months = daysToNow / 30.44;
      interest = balance * (Math.pow(1 + rate / 12, months) - 1);
    } else {
      const years = daysToNow / 365;
      interest = balance * rate * years;
    }
    totalInterestAccrued += interest;
  }

  const interestUnpaid = totalInterestAccrued - totalInterestPaid;
  const totalOwed = balance + interestUnpaid;
  const hasInterest = rate > 0;
  const totalPaid = totalPrincipalPaid + totalInterestPaid;

  const gbpPaid = totalGbpPaid;
  const remainingGBP = convertINRtoGBP(Math.max(0, totalOwed), exchangeRate);
  const status = totalOwed <= 0.01 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
  const statusLabel = totalOwed <= 0.01
    ? 'Fully paid'
    : hasInterest
      ? `${fmtINR(totalOwed)} owed`
      : `${fmtINR(Math.max(0, balance))} left`;
  const pct = Math.min(100, Math.round((totalPaid / principal) * 100));

  const utilizations = loan.utilizations || [];
  const totalUtilizedINR = utilizations.reduce((s, u) => s + Number(u.inrAmount), 0);
  const remainingFundsINR = principal - totalUtilizedINR;
  const utilizedPct = Math.min(100, Math.round((totalUtilizedINR / principal) * 100));

  return {
    originalPrincipal: principal,
    principalPaid: totalPrincipalPaid,
    principalRemaining: Math.max(0, balance),
    interestAccrued: totalInterestAccrued,
    interestPaid: totalInterestPaid,
    interestUnpaid: Math.max(0, interestUnpaid),
    totalOwed: Math.max(0, totalOwed),
    totalPaid,
    totalGbpPaid,
    hasInterest,
    gbpPaid,
    remainingGBP,
    status,
    statusLabel,
    pct,
    totalUtilizedINR,
    remainingFundsINR,
    utilizedPct,
    utilizations,
  };
}

export function getDebtSummary(debt: Debt, exchangeRate: number): DebtSummary {
  const repayments = debt.repayments || [];
  const totalPaidINR = repayments.reduce((s, r) => s + Number(r.inrAmount), 0);
  const totalPaidGBP = repayments.reduce((s, r) => s + Number(r.gbpAmount), 0);
  const remaining = Number(debt.amount) - totalPaidINR;
  const remainingGBP = convertINRtoGBP(Math.max(0, remaining), exchangeRate);
  const status = remaining <= 0 ? 'paid' : totalPaidINR > 0 ? 'partial' : 'unpaid';
  const statusLabel = remaining <= 0 ? 'Fully paid' : totalPaidINR > 0 ? `${fmt(Math.max(0, remaining), 'INR')} left` : 'Unpaid';
  const pct = Math.min(100, Math.round((totalPaidINR / Number(debt.amount)) * 100));

  return { totalPaidINR, totalPaidGBP, remaining: Math.max(0, remaining), remainingGBP, status, statusLabel, pct };
}
