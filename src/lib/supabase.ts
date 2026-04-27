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

// Database types for Supabase
export interface DbExpense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  currency: string;
  source: string;
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
  created_at?: string;
}

export interface DbRepayment {
  id: string;
  gbpAmount: number;
  inrAmount: number;
  date: string;
  loan_id?: string;
  debt_id?: string;
  created_at?: string;
}

export interface DbUtilization {
  id: string;
  description: string;
  gbpAmount: number;
  inrAmount: number;
  date: string;
  loan_id: string;
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
  created_at?: string;
}

export interface DbAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
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
  created_at?: string;
}

export interface DbBudget {
  id: string;
  category: string;
  budget_limit: number;
  month: string;
  currency: string;
  created_at?: string;
}

export interface DbSettings {
  id?: string;
  filterMonth: string;
  currency: string;
  exchangeRate: number;
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
    currency: db.currency as 'GBP' | 'INR',
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
    currency: db.currency as 'GBP' | 'INR',
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
    currency: db.currency as 'GBP' | 'INR',
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
    currency: db.currency as 'GBP' | 'INR',
    repayments: db.repayments || [],
  };
}

export function dbAccountToApp(db: DbAccount) {
  return {
    id: db.id,
    name: db.name,
    type: db.type,
    balance: db.balance,
    currency: db.currency as 'GBP' | 'INR',
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
    currency: db.currency as 'GBP' | 'INR',
  };
}

export function dbBudgetToApp(db: DbBudget) {
  return {
    id: db.id,
    category: db.category,
    limit: db.budget_limit,
    month: db.month,
    currency: db.currency as 'GBP' | 'INR',
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
      supabase.from('settings').select('*').single(),
    ]);

    return {
      remittances: [],
      expenses: (expenses || []).map(dbExpenseToApp),
      incomes: (incomes || []).map(dbIncomeToApp),
      loans: (loans || []).map(dbLoanToApp),
      debts: (debts || []).map(dbDebtToApp),
      accounts: (accounts || []).map(dbAccountToApp),
      bills: (bills || []).map(dbBillToApp),
      budgets: (budgets || []).map(dbBudgetToApp),
      filterMonth: settings?.filterMonth || new Date().toISOString().slice(0, 7),
      currency: (settings?.currency || 'INR') as 'GBP' | 'INR',
      exchangeRate: settings?.exchangeRate || 110,
      customExpenseCategories: settings?.customExpenseCategories || [],
      customIncomeCategories: settings?.customIncomeCategories || [],
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

  try {
    // Clear existing data
    await Promise.all([
      supabase.from('expenses').delete().neq('id', ''),
      supabase.from('incomes').delete().neq('id', ''),
      supabase.from('loans').delete().neq('id', ''),
      supabase.from('debts').delete().neq('id', ''),
      supabase.from('accounts').delete().neq('id', ''),
      supabase.from('bills').delete().neq('id', ''),
      supabase.from('budgets').delete().neq('id', ''),
    ]);

    // Insert all data
    await Promise.all([
      supabase.from('expenses').insert(state.expenses),
      supabase.from('incomes').insert(state.incomes),
      supabase.from('loans').insert(state.loans),
      supabase.from('debts').insert(state.debts),
      supabase.from('accounts').insert(state.accounts),
      supabase.from('bills').insert(state.bills),
      supabase.from('budgets').insert(state.budgets),
      supabase.from('settings').upsert({
        id: 'app_settings',
        filterMonth: state.filterMonth,
        currency: state.currency,
        exchangeRate: state.exchangeRate,
      }),
    ]);
  } catch (error) {
    console.error('Failed to save state to Supabase:', error);
    throw error;
  }
}

// Individual CRUD operations for real-time updates
export async function addExpenseToSupabase(expense: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('expenses').insert(expense);
  if (error) throw error;
}

export async function deleteExpenseFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function addIncomeToSupabase(income: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('incomes').insert(income);
  if (error) throw error;
}

export async function deleteIncomeFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) throw error;
}

export async function addLoanToSupabase(loan: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('loans').insert(loan);
  if (error) throw error;
}

export async function deleteLoanFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw error;
}

export async function addDebtToSupabase(debt: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('debts').insert(debt);
  if (error) throw error;
}

export async function deleteDebtFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('debts').delete().eq('id', id);
  if (error) throw error;
}

export async function addAccountToSupabase(account: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('accounts').insert(account);
  if (error) throw error;
}

export async function deleteAccountFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

export async function addBillToSupabase(bill: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('bills').insert(bill);
  if (error) throw error;
}

export async function deleteBillFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
}

export async function addBudgetToSupabase(budget: any): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('budgets').insert(budget);
  if (error) throw error;
}

export async function deleteBudgetFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSettingsInSupabase(settings: Partial<AppState>): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('settings').upsert({
    id: 'app_settings',
    ...settings,
  });
  if (error) throw error;
}
