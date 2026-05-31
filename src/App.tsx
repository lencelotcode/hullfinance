import { useFinance } from '@/context/FinanceContext';
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
  Calculator,
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
import TaxPage from '@/pages/TaxPage';
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
  { key: 'tax', label: 'Tax', icon: Calculator },
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4" style={{ color: 'var(--red)' }}>⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-head)', color: 'var(--text)' }}>Failed to Load</h2>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>{error}</p>
          <p className="text-sm" style={{ color: 'var(--muted2)' }}>The app will use localStorage instead</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 mb-4" style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--text)' }}></div>
          <p style={{ color: 'var(--muted)' }}>Loading your finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* HEADER */}
      <header className="hf-header">
        <div className="hf-header-left">
          <div className="hf-logo-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F6EFD2" strokeWidth="2" width="20" height="20">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div>
            <div className="hf-brand-name">Hull Finance Tracker</div>
            <div className="hf-brand-sub">UK Masters Student Edition</div>
          </div>
        </div>
        <div className="hf-header-right" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="hf-fx-row">
            <span>1 GBP =</span>
            <input
              className="hf-fx-input"
              type="number"
              value={state.exchangeRate}
              min="1"
              step="0.01"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (val > 0) dispatch({ type: 'SET_EXCHANGE_RATE', payload: val });
              }}
            />
            <span>INR</span>
          </div>
          <div className="hf-fx-row" style={{ marginLeft: "12px" }}>
            <span>1 USD =</span>
            <input
              className="hf-fx-input"
              type="number"
              value={state.exchangeRateUSD || 83}
              min="1"
              step="0.01"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (val > 0) dispatch({ type: "SET_EXCHANGE_RATE_USD", payload: val });
              }}
            />
            <span>INR</span>
          </div>
          <div className="hf-currency-toggle">
            <button
              className={`hf-currency-btn ${state.currency === 'GBP' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'GBP' })}
            >
              £ GBP
            </button>
            <button
              className={`hf-currency-btn ${state.currency === 'INR' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'INR' })}
            >
              ₹ INR
            </button>
            <button
              className={`hf-currency-btn ${state.currency === "USD" ? "active" : ""}`}
              onClick={() => dispatch({ type: "SET_CURRENCY", payload: "USD" })}
            >
              $ USD
            </button>
          </div>
        </div>
      </header>

      {/* MONTH BAR */}
      <div className="hf-month-bar">
        <span className="hf-month-label">Month</span>
        <select
          className="hf-month-select"
          value={state.filterMonth}
          onChange={(e) => dispatch({ type: 'SET_MONTH', payload: e.target.value })}
        >
          {getMonthOptions().map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
        <span className="hf-inr-badge">{state.currency} ONLY</span>
      </div>

      {/* NAV TABS */}
      <nav className="hf-nav-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`hf-nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* MAIN */}
      <main className="hf-main">
        <div className="hf-page-enter">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'expenses' && <ExpensesPage />}
          {activeTab === 'income' && <IncomePage />}
          {activeTab === 'accounts' && <AccountsPage />}
          {activeTab === 'bills' && <BillsPage />}
          {activeTab === 'loans' && <LoansPage />}
          {activeTab === 'debts' && <DebtsPage />}
          {activeTab === 'budget' && <BudgetPage />}
{activeTab === 'analytics' && <AnalyticsPage />}
{activeTab === 'tax' && <TaxPage />}
{activeTab === 'settings' && <SettingsPage />}
        </div>
      </main>
      {/* MOBILE BOTTOM NAV */}
      <nav className="hf-bottom-nav">
        {TABS.slice(0, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={"hf-bottom-nav-item " + (isActive ? "active" : "")}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <button
          className={"hf-bottom-nav-item " + (activeTab === "settings" ? "active" : "")}
          onClick={() => setActiveTab("settings")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
