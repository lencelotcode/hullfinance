import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Receipt,
  CreditCard,
  HandCoins,
  PiggyBank,
  BarChart3,
  Settings,
} from 'lucide-react';
import Dashboard from '@/pages/Dashboard';
import ExpensesPage from '@/pages/ExpensesPage';
import IncomePage from '@/pages/IncomePage';
import AccountsPage from '@/pages/AccountsPage';
import BillsPage from '@/pages/BillsPage';
import LoansPage from '@/pages/LoansPage';
import DebtsPage from '@/pages/DebtsPage';
import BudgetPage from '@/pages/BudgetPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SettingsPage from '@/pages/SettingsPage';
import { monthLabel } from '@/lib/finance';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'expenses', label: 'Expenses', icon: ArrowDownRight },
  { key: 'income', label: 'Income', icon: ArrowUpRight },
  { key: 'accounts', label: 'Accounts', icon: Landmark },
  { key: 'bills', label: 'Bills', icon: Receipt },
  { key: 'loans', label: 'Borrowed', icon: CreditCard },
  { key: 'debts', label: 'Owed', icon: HandCoins },
  { key: 'budget', label: 'Budget', icon: PiggyBank },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

function getMonthOptions() {
const months: string[] = [];
  const now = new Date();
  for (let i = -2; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = d.toISOString().slice(0, 7);
    months.push(val);
  }
  return months;
}

export default function App() {
  const { state, dispatch, activeTab, setActiveTab, loading, error } = useFinance();

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <p className="text-zinc-500 text-sm">The app will use localStorage instead</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-600 border-t-zinc-200 mb-4"></div>
          <p className="text-zinc-400">Loading your finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Hull Finance Tracker</h1>
              <p className="text-xs text-zinc-500">UK Masters Student Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
              <span className="text-xs text-zinc-500">1 GBP =</span>
              <InputInline
                value={state.exchangeRate}
                onChange={(v) => dispatch({ type: 'SET_EXCHANGE_RATE', payload: v })}
              />
              <span className="text-xs text-zinc-500">INR</span>
            </div>
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1">
              <button
                onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'GBP' })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${state.currency === 'GBP' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                £ GBP
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'INR' })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${state.currency === 'INR' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                ₹ INR
              </button>
            </div>
          </div>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
            <span className="text-xs text-zinc-500 font-medium">Month</span>
            <Select
              value={state.filterMonth}
              onValueChange={(v) => dispatch({ type: 'SET_MONTH', payload: v })}
            >
              <SelectTrigger className="bg-transparent border-none text-zinc-200 text-xs font-medium h-auto py-0 px-2 w-auto focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {getMonthOptions().map((m) => (
                  <SelectItem key={m} value={m} className="text-zinc-200 text-xs">
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 bg-zinc-900">
            {state.currency} ONLY
          </Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Page Content */}
        <div>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'expenses' && <ExpensesPage />}
          {activeTab === 'income' && <IncomePage />}
          {activeTab === 'accounts' && <AccountsPage />}
          {activeTab === 'bills' && <BillsPage />}
          {activeTab === 'loans' && <LoansPage />}
          {activeTab === 'debts' && <DebtsPage />}
          {activeTab === 'budget' && <BudgetPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}

function InputInline({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [val, setVal] = React.useState(String(value));
  return (
    <input
      type="number"
      min="1"
      step="0.01"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        const n = parseFloat(val);
        if (n > 0) onChange(n);
        else setVal(String(value));
      }}
      className="w-16 bg-transparent text-xs text-zinc-200 font-medium focus:outline-none text-center"
    />
  );
}
