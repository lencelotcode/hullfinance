import type { AppState, Loan, Debt, Currency } from './types';
import { DEFAULT_STATE } from './types';
import { loadStateFromSupabase, saveStateToSupabase, supabaseClientAvailable } from './supabase';

const KEYS = {
  expenses: 'hull_expenses',
  incomes: 'hull_incomes',
  loans: 'hull_loans',
  debts: 'hull_debts',
  accounts: 'hull_accounts',
  bills: 'hull_bills',
  budgets: 'hull_budgets',
  currency: 'hull_currency',
  exchangeRate: 'hull_exchange_rate',
  filterMonth: 'hull_filter_month',
};

// Only use Supabase if client is available
let useSupabase = supabaseClientAvailable;

export function enableSupabase(enabled: boolean) {
  useSupabase = enabled && supabaseClientAvailable;
}

export async function saveState(state: AppState) {
  if (!useSupabase) {
    // Use localStorage only
    try {
      localStorage.setItem(KEYS.expenses, JSON.stringify(state.expenses));
      localStorage.setItem(KEYS.incomes, JSON.stringify(state.incomes));
      localStorage.setItem(KEYS.loans, JSON.stringify(state.loans));
      localStorage.setItem(KEYS.debts, JSON.stringify(state.debts));
      localStorage.setItem(KEYS.accounts, JSON.stringify(state.accounts));
      localStorage.setItem(KEYS.bills, JSON.stringify(state.bills));
      localStorage.setItem(KEYS.budgets, JSON.stringify(state.budgets));
      localStorage.setItem(KEYS.currency, state.currency);
      localStorage.setItem(KEYS.exchangeRate, String(state.exchangeRate));
      localStorage.setItem(KEYS.filterMonth, state.filterMonth);
    } catch (e) {
      console.error('Failed to save state:', e);
    }
    return;
  }

  // Try Supabase first
  try {
    await saveStateToSupabase(state);
  } catch (e) {
    console.error('Failed to save to Supabase, using localStorage:', e);
    useSupabase = false;
    // Save to localStorage as fallback
    try {
      localStorage.setItem(KEYS.expenses, JSON.stringify(state.expenses));
      localStorage.setItem(KEYS.incomes, JSON.stringify(state.incomes));
      localStorage.setItem(KEYS.loans, JSON.stringify(state.loans));
      localStorage.setItem(KEYS.debts, JSON.stringify(state.debts));
      localStorage.setItem(KEYS.accounts, JSON.stringify(state.accounts));
      localStorage.setItem(KEYS.bills, JSON.stringify(state.bills));
      localStorage.setItem(KEYS.budgets, JSON.stringify(state.budgets));
      localStorage.setItem(KEYS.currency, state.currency);
      localStorage.setItem(KEYS.exchangeRate, String(state.exchangeRate));
      localStorage.setItem(KEYS.filterMonth, state.filterMonth);
    } catch (localError) {
      console.error('Failed to save to localStorage:', localError);
    }
  }
}

export async function loadState(): Promise<AppState> {
  if (!useSupabase) {
    return loadFromLocalStorage();
  }

  try {
    return await loadStateFromSupabase();
  } catch (e) {
    console.error('Failed to load from Supabase, falling back to localStorage:', e);
    useSupabase = false;
    return loadFromLocalStorage();
  }
}

function loadFromLocalStorage(): AppState {
  const state = { ...DEFAULT_STATE };
  try {
    const e = localStorage.getItem(KEYS.expenses);
    const i = localStorage.getItem(KEYS.incomes);
    const l = localStorage.getItem(KEYS.loans);
    const d = localStorage.getItem(KEYS.debts);
    const acc = localStorage.getItem(KEYS.accounts);
    const b = localStorage.getItem(KEYS.bills);
    const bud = localStorage.getItem(KEYS.budgets);
    const c = localStorage.getItem(KEYS.currency);
    const exr = localStorage.getItem(KEYS.exchangeRate);
    const fm = localStorage.getItem(KEYS.filterMonth);

    if (e) state.expenses = JSON.parse(e);
    if (i) state.incomes = JSON.parse(i);
    if (l) state.loans = JSON.parse(l);
    if (d) state.debts = JSON.parse(d);
    if (acc) state.accounts = JSON.parse(acc);
    if (b) state.bills = JSON.parse(b);
    if (bud) state.budgets = JSON.parse(bud);
    if (c) state.currency = c as Currency;
    if (exr) state.exchangeRate = parseFloat(exr);
    if (fm) state.filterMonth = fm;
  } catch (e) {
    console.error('Failed to load state:', e);
  }

  // Migrate loans: add repayments array + interest fields if missing
  state.loans.forEach((l: Loan) => {
    if (!l.repayments) {
      l.repayments = [];
      if (Number((l as any).paid) > 0) {
        l.repayments.push({
          id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
          gbpAmount: Number((l as any).gbpPaid || 0),
          inrAmount: Number((l as any).paid),
          date: l.date || new Date().toISOString().slice(0, 10),
        });
      }
    }
    if (l.interestRate === undefined) l.interestRate = 0;
    if (!l.interestType) l.interestType = 'simple';
    if (!l.utilizations) l.utilizations = [];
  });

  // Migrate debts: add repayments array if missing
  state.debts.forEach((d: Debt) => {
    if (!d.repayments) {
      d.repayments = [];
      if (Number((d as any).paid) > 0) {
        d.repayments.push({
          id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
          gbpAmount: Number((d as any).gbpPaid || 0),
          inrAmount: Number((d as any).paid),
          date: d.date || new Date().toISOString().slice(0, 10),
        });
      }
    }
  });

  return state;
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json);
    return {
      ...DEFAULT_STATE,
      ...parsed,
    };
  } catch {
    return null;
  }
}
