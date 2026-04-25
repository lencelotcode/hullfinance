import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { AppState, Currency, Expense, Income, Loan, Debt, Account, Bill, Budget, Tab } from '@/lib/types';
import { DEFAULT_STATE } from '@/lib/types';
import { loadState, saveState } from '@/lib/data';
import { calculateLoanWithInterest, getDebtSummary, convertGBPtoINR } from '@/lib/finance';
import { uid, today } from '@/lib/finance';

interface FinanceContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  loading: boolean;
  error: string | null;
  filteredExpenses: Expense[];
  filteredIncomes: Income[];
  totalExpenses: number;
  totalIncome: number;
  netBalance: number;
  loanSummaries: ReturnType<typeof calculateLoanWithInterest>[];
  debtSummaries: ReturnType<typeof getDebtSummary>[];
  totalBorrowed: number;
  totalLoanPaid: number;
  totalLoanOwed: number;
  totalDebtOwed: number;
  totalAccountBalance: number;
  upcomingBillsTotal: number;
  catTotals: Record<string, number>;
  topCats: [string, number][];
}

type Action =
  | { type: 'SET_TAB'; payload: Tab }
  | { type: 'SET_MONTH'; payload: string }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_EXCHANGE_RATE'; payload: number }
  | { type: 'ADD_EXPENSE'; payload: Omit<Expense, 'id'> }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_INCOME'; payload: Omit<Income, 'id'> }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'ADD_LOAN'; payload: Omit<Loan, 'id'> }
  | { type: 'DELETE_LOAN'; payload: string }
  | { type: 'REPAY_LOAN'; payload: { loanId: string; gbpAmount: number } }
  | { type: 'DELETE_REPAYMENT'; payload: { loanId: string; repaymentId: string } }
  | { type: 'EDIT_REPAYMENT'; payload: { loanId: string; repaymentId: string; newGbpAmount: number } }
  | { type: 'ADD_UTILIZATION'; payload: { loanId: string; description: string; gbpAmount: number; date: string } }
  | { type: 'DELETE_UTILIZATION'; payload: { loanId: string; utilId: string } }
  | { type: 'ADD_DEBT'; payload: Omit<Debt, 'id'> }
  | { type: 'DELETE_DEBT'; payload: string }
  | { type: 'REPAY_DEBT'; payload: { debtId: string; gbpAmount: number } }
  | { type: 'DELETE_DEBT_REPAYMENT'; payload: { debtId: string; repaymentId: string } }
  | { type: 'EDIT_DEBT_REPAYMENT'; payload: { debtId: string; repaymentId: string; newGbpAmount: number } }
  | { type: 'ADD_ACCOUNT'; payload: Omit<Account, 'id'> }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; payload: { id: string; delta: number } }
  | { type: 'EDIT_ACCOUNT'; payload: { id: string; updates: Partial<Account> } }
  | { type: 'ADD_BILL'; payload: Omit<Bill, 'id' | 'status' | 'paidDate'> }
  | { type: 'PAY_BILL'; payload: string }
  | { type: 'DELETE_BILL'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Omit<Budget, 'id'> }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_EXPENSE_CATEGORY'; payload: string }
  | { type: 'DELETE_EXPENSE_CATEGORY'; payload: string }
  | { type: 'ADD_INCOME_CATEGORY'; payload: string }
  | { type: 'DELETE_INCOME_CATEGORY'; payload: string }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RESET_STATE' };

function reducer(state: AppState, action: Action): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'SET_TAB':
      return { ...state };
    case 'SET_MONTH':
      newState = { ...state, filterMonth: action.payload };
      saveState(newState);
      return newState;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      saveState(newState);
      return newState;
    case 'SET_EXCHANGE_RATE':
      newState = { ...state, exchangeRate: action.payload };
      saveState(newState);
      return newState;
    case 'ADD_EXPENSE':
      newState = { ...state, expenses: [...state.expenses, { ...action.payload, id: uid() }] };
      saveState(newState);
      return newState;
    case 'DELETE_EXPENSE':
      newState = { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) };
      saveState(newState);
      return newState;
    case 'ADD_INCOME':
      newState = { ...state, incomes: [...state.incomes, { ...action.payload, id: uid() }] };
      saveState(newState);
      return newState;
    case 'DELETE_INCOME':
      newState = { ...state, incomes: state.incomes.filter((i) => i.id !== action.payload) };
      saveState(newState);
      return newState;
    case 'ADD_LOAN':
      newState = { ...state, loans: [...state.loans, { ...action.payload, id: uid() }] };
      saveState(newState);
      return newState;
    case 'DELETE_LOAN':
      newState = { ...state, loans: state.loans.filter((l) => l.id !== action.payload) };
      saveState(newState);
      return newState;
    case 'REPAY_LOAN': {
      const loans = state.loans.map((l) => {
        if (l.id !== action.payload.loanId) return l;
        const inrPayment = convertGBPtoINR(action.payload.gbpAmount, state.exchangeRate);
        return {
          ...l,
          repayments: [
            ...l.repayments,
            { id: uid(), gbpAmount: action.payload.gbpAmount, inrAmount: inrPayment, date: today() },
          ],
        };
      });
      newState = { ...state, loans };
      saveState(newState);
      return newState;
    }
    case 'DELETE_REPAYMENT': {
      const loans = state.loans.map((l) => {
        if (l.id !== action.payload.loanId) return l;
        return { ...l, repayments: l.repayments.filter((r) => r.id !== action.payload.repaymentId) };
      });
      newState = { ...state, loans };
      saveState(newState);
      return newState;
    }
    case 'EDIT_REPAYMENT': {
      const loans = state.loans.map((l) => {
        if (l.id !== action.payload.loanId) return l;
        return {
          ...l,
          repayments: l.repayments.map((r) =>
            r.id === action.payload.repaymentId
              ? { ...r, gbpAmount: action.payload.newGbpAmount, inrAmount: convertGBPtoINR(action.payload.newGbpAmount, state.exchangeRate) }
              : r
          ),
        };
      });
      newState = { ...state, loans };
      saveState(newState);
      return newState;
    }
    case 'ADD_UTILIZATION': {
      const loans = state.loans.map((l) => {
        if (l.id !== action.payload.loanId) return l;
        const inrAmount = convertGBPtoINR(action.payload.gbpAmount, state.exchangeRate);
        return {
          ...l,
          utilizations: [
            ...l.utilizations,
            { id: uid(), description: action.payload.description, gbpAmount: action.payload.gbpAmount, inrAmount, date: action.payload.date },
          ],
        };
      });
      newState = { ...state, loans };
      saveState(newState);
      return newState;
    }
    case 'DELETE_UTILIZATION': {
      const loans = state.loans.map((l) => {
        if (l.id !== action.payload.loanId) return l;
        return { ...l, utilizations: l.utilizations.filter((u) => u.id !== action.payload.utilId) };
      });
      newState = { ...state, loans };
      saveState(newState);
      return newState;
    }
    case 'ADD_DEBT':
      newState = { ...state, debts: [...state.debts, { ...action.payload, id: uid() }] };
      saveState(newState);
      return newState;
    case 'DELETE_DEBT':
      newState = { ...state, debts: state.debts.filter((d) => d.id !== action.payload) };
      saveState(newState);
      return newState;
    case 'REPAY_DEBT': {
      const debts = state.debts.map((d) => {
        if (d.id !== action.payload.debtId) return d;
        const inrPayment = convertGBPtoINR(action.payload.gbpAmount, state.exchangeRate);
        return {
          ...d,
          repayments: [
            ...d.repayments,
            { id: uid(), gbpAmount: action.payload.gbpAmount, inrAmount: inrPayment, date: today() },
          ],
        };
      });
      newState = { ...state, debts };
      saveState(newState);
      return newState;
    }
    case 'DELETE_DEBT_REPAYMENT': {
      const debts = state.debts.map((d) => {
        if (d.id !== action.payload.debtId) return d;
        return { ...d, repayments: d.repayments.filter((r) => r.id !== action.payload.repaymentId) };
      });
      newState = { ...state, debts };
      saveState(newState);
      return newState;
    }
    case 'EDIT_DEBT_REPAYMENT': {
      const debts = state.debts.map((d) => {
        if (d.id !== action.payload.debtId) return d;
        return {
          ...d,
          repayments: d.repayments.map((r) =>
            r.id === action.payload.repaymentId
              ? { ...r, gbpAmount: action.payload.newGbpAmount, inrAmount: convertGBPtoINR(action.payload.newGbpAmount, state.exchangeRate) }
              : r
          ),
        };
      });
      newState = { ...state, debts };
      saveState(newState);
      return newState;
    }
    case 'ADD_ACCOUNT':
      newState = { ...state, accounts: [...state.accounts, { ...action.payload, id: uid() }] };
      saveState(newState);
      return newState;
    case 'DELETE_ACCOUNT':
      newState = { ...state, accounts: state.accounts.filter((a) => a.id !== action.payload) };
      saveState(newState);
      return newState;
    case 'UPDATE_ACCOUNT_BALANCE': {
      const accounts = state.accounts.map((a) =>
        a.id === action.payload.id ? { ...a, balance: a.balance + action.payload.delta } : a
      );
      newState = { ...state, accounts };
      saveState(newState);
      return newState;
    }
    case 'EDIT_ACCOUNT': {
      const accounts = state.accounts.map((a) =>
        a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
      );
      newState = { ...state, accounts };
      saveState(newState);
      return newState;
    }
    case 'ADD_BILL':
      newState = { ...state, bills: [...state.bills, { ...action.payload, id: uid(), status: 'pending' }] };
      saveState(newState);
      return newState;
    case 'PAY_BILL': {
      const bill = state.bills.find((b) => b.id === action.payload);
      const updatedBills = state.bills.map((b) =>
        b.id === action.payload ? { ...b, status: 'paid' as const, paidDate: today() } : b
      );
      if (bill && bill.frequency !== 'once') {
        const nextDue = new Date(bill.dueDate);
        if (bill.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
        else if (bill.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        else if (bill.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
        updatedBills.push({
          ...bill,
          id: uid(),
          dueDate: nextDue.toISOString().slice(0, 10),
          status: 'pending' as const,
          paidDate: undefined,
        });
      }
      newState = { ...state, bills: updatedBills };
      saveState(newState);
      return newState;
    }
    case 'DELETE_BILL':
      newState = { ...state, bills: state.bills.filter((b) => b.id !== action.payload) };
      saveState(newState);
      return newState;
    case 'ADD_BUDGET':
      newState = { ...state, budgets: [...state.budgets, { ...action.payload, id: uid() }] };
      saveState(newState);
      return newState;
    case 'DELETE_BUDGET':
      newState = { ...state, budgets: state.budgets.filter((b) => b.id !== action.payload) };
      saveState(newState);
      return newState;
    case 'ADD_EXPENSE_CATEGORY':
      if (state.customExpenseCategories.includes(action.payload)) return state;
      newState = { ...state, customExpenseCategories: [...state.customExpenseCategories, action.payload] };
      saveState(newState);
      return newState;
    case 'DELETE_EXPENSE_CATEGORY':
      newState = { ...state, customExpenseCategories: state.customExpenseCategories.filter((c) => c !== action.payload) };
      saveState(newState);
      return newState;
    case 'ADD_INCOME_CATEGORY':
      if (state.customIncomeCategories.includes(action.payload)) return state;
      newState = { ...state, customIncomeCategories: [...state.customIncomeCategories, action.payload] };
      saveState(newState);
      return newState;
    case 'DELETE_INCOME_CATEGORY':
      newState = { ...state, customIncomeCategories: state.customIncomeCategories.filter((c) => c !== action.payload) };
      saveState(newState);
      return newState;
    case 'LOAD_STATE':
      return action.payload;
    case 'RESET_STATE':
      newState = { ...DEFAULT_STATE };
      saveState(newState);
      return newState;
    default:
      return state;
  }
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...DEFAULT_STATE });
  const [activeTab, setActiveTabRaw] = React.useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('FinanceProvider initializing...');

  // Load state from Supabase on mount
  useEffect(() => {
    async function initState() {
      try {
        console.log('Loading state...');
        const loadedState = await loadState();
        console.log('State loaded:', loadedState);
        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      } catch (error) {
        console.error('Failed to load initial state:', error);
        setError(error instanceof Error ? error.message : 'Failed to load state');
      } finally {
        setLoading(false);
      }
    }
    initState();
  }, []);

  const setActiveTab = useCallback((tab: Tab) => {
    setActiveTabRaw(tab);
  }, []);

  const filteredExpenses = state.expenses.filter(
    (e) => e.date.startsWith(state.filterMonth) && e.currency === state.currency
  );
  const filteredIncomes = state.incomes.filter(
    (i) => i.date.startsWith(state.filterMonth) && i.currency === state.currency
  );

  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = filteredIncomes.reduce((s, i) => s + Number(i.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  const loanSummaries = state.loans
    .filter((l) => l.currency === state.currency)
    .map((l) => calculateLoanWithInterest(l, state.exchangeRate));

  const debtSummaries = state.debts
    .filter((d) => d.currency === state.currency)
    .map((d) => getDebtSummary(d, state.exchangeRate));

  const totalBorrowed = state.loans
    .filter((l) => l.currency === state.currency)
    .reduce((s, l) => s + Number(l.amount), 0);
  const totalLoanPaid = loanSummaries.reduce((s, ls) => s + ls.totalPaid, 0);
  const totalLoanOwed = loanSummaries.reduce((s, ls) => s + ls.totalOwed, 0);
  const totalDebtOwed = debtSummaries.reduce((s, ds) => s + ds.remaining, 0);

  const totalAccountBalance = state.accounts
    .filter((a) => a.currency === state.currency)
    .reduce((s, a) => s + Number(a.balance), 0);

  const upcomingBillsTotal = state.bills
    .filter((b) => b.currency === state.currency && b.status === 'pending')
    .reduce((s, b) => s + Number(b.amount), 0);

  const catTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
  });
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <FinanceContext.Provider
      value={{
        state,
        dispatch,
        activeTab,
        setActiveTab,
        loading,
        error,
        filteredExpenses,
        filteredIncomes,
        totalExpenses,
        totalIncome,
        netBalance,
        loanSummaries,
        debtSummaries,
        totalBorrowed,
        totalLoanPaid,
        totalLoanOwed,
        totalDebtOwed,
        totalAccountBalance,
        upcomingBillsTotal,
        catTotals,
        topCats,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
