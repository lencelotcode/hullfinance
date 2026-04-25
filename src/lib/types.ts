export type Currency = 'GBP' | 'INR';

export interface CurrencyConfig {
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  GBP: { symbol: '£', label: 'GBP', locale: 'en-GB' },
  INR: { symbol: '₹', label: 'INR', locale: 'en-IN' },
};

export const EXPENSE_CATS = [
  'Rent', 'Food & Groceries', 'Transport', 'Utilities', 'Entertainment',
  'Healthcare', 'Education', 'Clothing', 'Eating Out', 'Coffee',
  'Books & Supplies', 'Travel', 'Phone & Internet', 'Gym', 'Other'
];

export const INCOME_CATS = [
  'Part-time Job', 'Family Support', 'Scholarship', 'Student Loan',
  'Freelance', 'Internship', 'Gift', 'Other'
];

export const ACCOUNT_TYPES = [
  'Current', 'Savings', 'Credit Card', 'Cash', 'Investment'
];

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  currency: Currency;
  source?: string;
}

export interface Expense extends Transaction {
  source: string;
}

export interface Income extends Transaction {}

export interface Repayment {
  id: string;
  gbpAmount: number;
  inrAmount: number;
  date: string;
}

export interface Utilization {
  id: string;
  description: string;
  gbpAmount: number;
  inrAmount: number;
  date: string;
}

export interface Loan {
  id: string;
  person: string;
  amount: number;
  date: string;
  note: string;
  currency: Currency;
  interestRate: number;
  interestType: 'simple' | 'compound';
  repayments: Repayment[];
  utilizations: Utilization[];
}

export interface Debt {
  id: string;
  person: string;
  amount: number;
  date: string;
  note: string;
  currency: Currency;
  repayments: Repayment[];
}

export interface Account {
  id: string;
  name: string;
  bank?: string;
  type: string;
  last4?: string;
  balance: number;
  currency: Currency;
  updatedAt?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: 'once' | 'monthly' | 'weekly' | 'yearly';
  note: string;
  status: 'pending' | 'paid';
  paidDate?: string;
  currency: Currency;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
  currency: Currency;
}

export interface AppState {
  expenses: Expense[];
  incomes: Income[];
  loans: Loan[];
  debts: Debt[];
  accounts: Account[];
  bills: Bill[];
  budgets: Budget[];
  filterMonth: string;
  currency: Currency;
  exchangeRate: number;
  customExpenseCategories: string[];
  customIncomeCategories: string[];
}

export const DEFAULT_STATE: AppState = {
  expenses: [],
  incomes: [],
  loans: [],
  debts: [],
  accounts: [],
  bills: [],
  budgets: [],
  filterMonth: new Date().toISOString().slice(0, 7),
  currency: 'INR',
  exchangeRate: 110,
  customExpenseCategories: [],
  customIncomeCategories: [],
};

export type Tab = 'dashboard' | 'expenses' | 'income' | 'accounts' | 'bills' | 'loans' | 'debts' | 'budget' | 'analytics' | 'settings';

export interface LoanSummary {
  originalPrincipal: number;
  principalPaid: number;
  principalRemaining: number;
  interestAccrued: number;
  interestPaid: number;
  interestUnpaid: number;
  totalOwed: number;
  totalPaid: number;
  totalGbpPaid: number;
  hasInterest: boolean;
  gbpPaid: number;
  remainingGBP: number;
  status: string;
  statusLabel: string;
  pct: number;
  totalUtilizedINR: number;
  remainingFundsINR: number;
  utilizedPct: number;
  utilizations: Utilization[];
}

export interface DebtSummary {
  totalPaidINR: number;
  totalPaidGBP: number;
  remaining: number;
  remainingGBP: number;
  status: string;
  statusLabel: string;
  pct: number;
}
