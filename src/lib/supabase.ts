import { createClient } from '@supabase/supabase-js';
import type { AppState } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are properly configured
const isValidUrl = supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('dummy');

const isValidKey = supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  !supabaseAnonKey.includes('dummy');

// Only create client if we have valid credentials
export const supabaseClientAvailable = isValidUrl && isValidKey;

export const supabase = supabaseClientAvailable 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

/**
 * Checks if the Supabase project is reachable.
 * Returns true if reachable, false otherwise.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Try a simple health check or fetch
    const { error } = await supabase.from('settings').select('id').limit(1).maybeSingle();
    // If we get a 401, it means the project is there but we're not auth'd yet (expected)
    // If we get a 404, it might mean the table doesn't exist (expected if not migrated)
    // We mainly want to catch network errors / CORS issues here.
    if (error && (error as any).message === 'Load failed') return false;
    return true;
  } catch (err) {
    return false;
  }
}

// Database types for Supabase
export interface DbExpense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  currency: string;
  source: string;
  user_id?: string;
  created_at?: string;
}

export interface DbIncome {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  currency: string;
  source?: string;
  user_id?: string;
  created_at?: string;
}

export interface DbRepayment {
  id: string;
  gbpAmount: number;
  inrAmount: number;
  date: string;
  loan_id?: string;
  debt_id?: string;
  user_id?: string;
  created_at?: string;
}

export interface DbUtilization {
  id: string;
  description: string;
  gbpAmount: number;
  inrAmount: number;
  date: string;
  loan_id: string;
  user_id?: string;
  created_at?: string;
}

export interface DbLoan {
  id: string;
  person: string;
  amount: number;
  date: string;
  note: string;
  currency: string;
  interestRate: number;
  interestType: string;
  repayments?: DbRepayment[];
  utilizations?: DbUtilization[];
  user_id?: string;
  created_at?: string;
}

export interface DbDebt {
  id: string;
  person: string;
  amount: number;
  date: string;
  note: string;
  currency: string;
  repayments?: DbRepayment[];
  user_id?: string;
  created_at?: string;
}

export interface DbAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  user_id?: string;
  created_at?: string;
}

export interface DbBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
  note: string;
  status: string;
  paidDate?: string;
  currency: string;
  user_id?: string;
  created_at?: string;
}

export interface DbBudget {
  id: string;
  category: string;
  budget_limit: number;
  month: string;
  currency: string;
  user_id?: string;
  created_at?: string;
}

export interface DbSettings {
  user_id?: string;
  filterMonth: string;
  currency: string;
  exchangeRate: number;
  exchangeRateUSD: number;
  customExpenseCategories?: string[];
  customIncomeCategories?: string[];
  created_at?: string;
}

// Helper functions to convert between DB format and app format
export function dbExpenseToApp(db: DbExpense) {
  return {
    id: db.id,
    amount: db.amount,
    category: db.category,
    date: db.date,
    note: db.note,
    currency: db.currency as 'GBP' | 'INR' | 'USD',
    exchangeRateAtTime: (db as any).exchangeRateAtTime,
    exchangeRateUSDAtTime: (db as any).exchangeRateUSDAtTime,
    source: db.source,
  };
}

export function dbIncomeToApp(db: DbIncome) {
  return {
    id: db.id,
    amount: db.amount,
    category: db.category,
    date: db.date,
    note: db.note,
    currency: db.currency as 'GBP' | 'INR' | 'USD',
    exchangeRateAtTime: (db as any).exchangeRateAtTime,
    exchangeRateUSDAtTime: (db as any).exchangeRateUSDAtTime,
    source: db.source || '',
  };
}

export function dbLoanToApp(db: DbLoan) {
  return {
    id: db.id,
    person: db.person,
    amount: db.amount,
    date: db.date,
    note: db.note,
    currency: db.currency as 'GBP' | 'INR' | 'USD',
    exchangeRateAtTime: (db as any).exchangeRateAtTime,
    exchangeRateUSDAtTime: (db as any).exchangeRateUSDAtTime,
    interestRate: db.interestRate,
    interestType: db.interestType as 'simple' | 'compound',
    repayments: db.repayments || [],
    utilizations: db.utilizations || [],
  };
}

export function dbDebtToApp(db: DbDebt) {
  return {
    id: db.id,
    person: db.person,
    amount: db.amount,
    date: db.date,
    note: db.note,
    currency: db.currency as 'GBP' | 'INR' | 'USD',
    exchangeRateAtTime: (db as any).exchangeRateAtTime,
    exchangeRateUSDAtTime: (db as any).exchangeRateUSDAtTime,
    repayments: db.repayments || [],
  };
}

export function dbAccountToApp(db: DbAccount) {
  return {
    id: db.id,
    name: db.name,
    type: db.type,
    balance: db.balance,
    currency: db.currency as 'GBP' | 'INR' | 'USD',
    exchangeRateAtTime: (db as any).exchangeRateAtTime,
    exchangeRateUSDAtTime: (db as any).exchangeRateUSDAtTime,
  };
}

export function dbBillToApp(db: DbBill) {
  return {
    id: db.id,
    name: db.name,
    amount: db.amount,
    dueDate: db.dueDate,
    frequency: db.frequency as 'once' | 'monthly' | 'weekly' | 'yearly',
    note: db.note,
    status: db.status as 'pending' | 'paid',
    paidDate: db.paidDate,
    currency: db.currency as 'GBP' | 'INR' | 'USD',
    exchangeRateAtTime: (db as any).exchangeRateAtTime,
    exchangeRateUSDAtTime: (db as any).exchangeRateUSDAtTime,
  };
}

export function dbBudgetToApp(db: DbBudget) {
  return {
    id: db.id,
    category: db.category,
    limit: db.budget_limit,
    month: db.month,
    currency: db.currency as 'GBP' | 'INR' | 'USD',
    exchangeRateAtTime: (db as any).exchangeRateAtTime,
    exchangeRateUSDAtTime: (db as any).exchangeRateUSDAtTime,
  };
}

// Load all state from Supabase
export async function loadStateFromSupabase(): Promise<AppState> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const [
      { data: expenses },
      { data: incomes },
      { data: loans },
      { data: debts },
      { data: accounts },
      { data: bills },
      { data: budgets },
      { data: settings },
    ] = await Promise.all([
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('incomes').select('*').order('date', { ascending: false }),
      supabase.from('loans').select('*, repayments(*), utilizations(*)').order('date', { ascending: false }),
      supabase.from('debts').select('*, repayments(*)').order('date', { ascending: false }),
      supabase.from('accounts').select('*').order('name', { ascending: true }),
      supabase.from('bills').select('*').order('dueDate', { ascending: true }),
      supabase.from('budgets').select('*').order('month', { ascending: false }),
      supabase.from('settings').select('*').maybeSingle(),
    ]);

    const userSettings = settings;

    return {
      remittances: [],
      expenses: (expenses || []).map(dbExpenseToApp),
      incomes: (incomes || []).map(dbIncomeToApp),
      loans: (loans || []).map(dbLoanToApp),
      debts: (debts || []).map(dbDebtToApp),
      accounts: (accounts || []).map(dbAccountToApp),
      bills: (bills || []).map(dbBillToApp),
      budgets: (budgets || []).map(dbBudgetToApp),
      filterMonth: userSettings?.filterMonth || new Date().toISOString().slice(0, 7),
      currency: (userSettings?.currency || 'INR') as 'GBP' | 'INR' | 'USD',
      exchangeRate: userSettings?.exchangeRate || 110,
      exchangeRateUSD: userSettings?.exchangeRateUSD || 83,
      customExpenseCategories: (userSettings as any)?.customExpenseCategories || [],
      customIncomeCategories: (userSettings as any)?.customIncomeCategories || [],
    };
  } catch (error) {
    console.error('Failed to load state from Supabase:', error);
    // Fallback to empty state
      return {
        remittances: [],
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
      exchangeRateUSD: 83,
      customExpenseCategories: [],
      customIncomeCategories: [],
    };
  }
}

// Save entire state to Supabase (for initial sync or reset)
export async function saveStateToSupabase(state: AppState): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Clear existing data for THIS user
    await Promise.all([
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase.from('incomes').delete().eq('user_id', user.id),
      supabase.from('loans').delete().eq('user_id', user.id),
      supabase.from('debts').delete().eq('user_id', user.id),
      supabase.from('accounts').delete().eq('user_id', user.id),
      supabase.from('bills').delete().eq('user_id', user.id),
      supabase.from('budgets').delete().eq('user_id', user.id),
    ]);

    // Map expenses
    const expenses = state.expenses.map(e => ({ id: e.id, amount: e.amount, category: e.category, date: e.date, note: e.note, currency: e.currency, source: e.source || null, user_id: user.id }));
    
    // Map incomes
    const incomes = state.incomes.map(i => ({ id: i.id, amount: i.amount, category: i.category, date: i.date, note: i.note, currency: i.currency, source: i.source || null, user_id: user.id }));
    
    // Map accounts
    const accounts = state.accounts.map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.balance, currency: a.currency, user_id: user.id }));
    
    // Map bills
    const bills = state.bills.map(b => ({ id: b.id, name: b.name, amount: b.amount, dueDate: b.dueDate, frequency: b.frequency, note: b.note, status: b.status, paidDate: b.paidDate || null, currency: b.currency, user_id: user.id }));
    
    // Map budgets
    const budgets = state.budgets.map(b => ({ id: b.id, category: b.category, budget_limit: b.limit, month: b.month, currency: b.currency, user_id: user.id }));

    // Map loans, debts, repayments, and utilizations
    const loans: any[] = [];
    const debts: any[] = [];
    const repayments: any[] = [];
    const utilizations: any[] = [];

    state.loans.forEach(l => {
      loans.push({ id: l.id, person: l.person, amount: l.amount, date: l.date, note: l.note || null, currency: l.currency, interestRate: l.interestRate, interestType: l.interestType, user_id: user.id });
      if (l.repayments) {
        l.repayments.forEach(r => repayments.push({ id: r.id, gbpAmount: r.gbpAmount, inrAmount: r.inrAmount, date: r.date, loan_id: l.id, user_id: user.id }));
      }
      if (l.utilizations) {
        l.utilizations.forEach(u => utilizations.push({ id: u.id, description: u.description, gbpAmount: u.gbpAmount, inrAmount: u.inrAmount, date: u.date, loan_id: l.id, user_id: user.id }));
      }
    });

    state.debts.forEach(d => {
      debts.push({ id: d.id, person: d.person, amount: d.amount, date: d.date, note: d.note || null, currency: d.currency, user_id: user.id });
      if (d.repayments) {
        d.repayments.forEach(r => repayments.push({ id: r.id, gbpAmount: r.gbpAmount, inrAmount: r.inrAmount, date: r.date, debt_id: d.id, user_id: user.id }));
      }
    });

    // We must wait for main tables to insert before inserting repayments and utilizations (due to foreign keys)
    await Promise.all([
      expenses.length > 0 ? supabase.from('expenses').insert(expenses) : Promise.resolve(),
      incomes.length > 0 ? supabase.from('incomes').insert(incomes) : Promise.resolve(),
      accounts.length > 0 ? supabase.from('accounts').insert(accounts) : Promise.resolve(),
      bills.length > 0 ? supabase.from('bills').insert(bills) : Promise.resolve(),
      budgets.length > 0 ? supabase.from('budgets').insert(budgets) : Promise.resolve(),
      loans.length > 0 ? supabase.from('loans').insert(loans) : Promise.resolve(),
      debts.length > 0 ? supabase.from('debts').insert(debts) : Promise.resolve(),
      supabase.from('settings').upsert({
        user_id: user.id,
        filterMonth: state.filterMonth,
        currency: state.currency,
        exchangeRate: state.exchangeRate,
        exchangeRateUSD: state.exchangeRateUSD || 83,
        customExpenseCategories: state.customExpenseCategories,
        customIncomeCategories: state.customIncomeCategories,
      }),
    ]);

    // Insert dependent data
    await Promise.all([
      repayments.length > 0 ? supabase.from('repayments').insert(repayments) : Promise.resolve(),
      utilizations.length > 0 ? supabase.from('utilizations').insert(utilizations) : Promise.resolve(),
    ]);
  } catch (error) {
    console.error('Failed to save state to Supabase:', error);
    throw error;
  }
}

// Individual CRUD operations for real-time updates
export async function addExpenseToSupabase(expense: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('expenses').insert({ ...expense, user_id: user?.id });
  if (error) throw error;
}

export async function deleteExpenseFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function addIncomeToSupabase(income: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('incomes').insert({ ...income, user_id: user?.id });
  if (error) throw error;
}

export async function deleteIncomeFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) throw error;
}

export async function addLoanToSupabase(loan: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('loans').insert({ ...loan, user_id: user?.id });
  if (error) throw error;
}

export async function deleteLoanFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw error;
}

export async function addDebtToSupabase(debt: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('debts').insert({ ...debt, user_id: user?.id });
  if (error) throw error;
}

export async function deleteDebtFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('debts').delete().eq('id', id);
  if (error) throw error;
}

export async function addAccountToSupabase(account: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('accounts').insert({ ...account, user_id: user?.id });
  if (error) throw error;
}

export async function deleteAccountFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

export async function addBillToSupabase(bill: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('bills').insert({ ...bill, user_id: user?.id });
  if (error) throw error;
}

export async function deleteBillFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
}

export async function addBudgetToSupabase(budget: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('budgets').insert({ ...budget, user_id: user?.id });
  if (error) throw error;
}

export async function deleteBudgetFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSettingsInSupabase(settings: Partial<AppState>): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('settings').upsert({
    user_id: user.id,
    ...settings,
  });
  if (error) throw error;
}
