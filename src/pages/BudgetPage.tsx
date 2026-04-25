import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, monthLabel } from '@/lib/finance';
import { EXPENSE_CATS } from '@/lib/types';

export default function BudgetPage() {
  const { state, dispatch } = useFinance();
  const [category, setCategory] = useState(EXPENSE_CATS[0]);
  const [limit, setLimit] = useState('');

  const budgets = state.budgets.filter((b) => b.month === state.filterMonth && b.currency === state.currency);
  const filteredExpenses = state.expenses.filter((e) => e.date.startsWith(state.filterMonth) && e.currency === state.currency);

  function handleAdd() {
    const val = parseFloat(limit);
    if (!val || val <= 0) return alert('Enter a valid limit');
    dispatch({ type: 'ADD_BUDGET', payload: { category, limit: val, month: state.filterMonth, currency: state.currency } });
    setLimit('');
  }

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => {
    const spent = filteredExpenses.filter((e) => e.category === b.category).reduce((sum, e) => sum + Number(e.amount), 0);
    return s + spent;
  }, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid cols-3">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total Budget</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="0"/><path d="M16 3H8L2 7h20l-6-4z"/></svg></span>
          </div>
          <div className="hf-stat-value neutral">{fmt(totalBudget, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Spent</span>
            <span className="hf-stat-icon"><Plus size={16} style={{ color: '#B03030', transform: 'rotate(45deg)' }} /></span>
          </div>
          <div className="hf-stat-value red">{fmt(totalSpent, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Remaining</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
          </div>
          <div className={`hf-stat-value ${remaining >= 0 ? 'green' : 'red'}`}>{fmt(remaining, state.currency)}</div>
        </div>
      </div>

      {/* Add Form */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Set Budget Limit</div>
        <div className="hf-form-grid">
          <div className="hf-form-field">
            <label className="hf-form-label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Monthly Limit</label>
            <input type="number" placeholder="0.00" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
        </div>
        <button className="hf-btn" onClick={handleAdd}>
          <Plus size={14} strokeWidth={2.5} />
          Set Limit
        </button>
      </div>

      {/* List */}
      <div className="hf-panel">
        <div className="hf-section-header">
          <span className="hf-section-title">Budget Overview</span>
          <span className="hf-section-count">{monthLabel(state.filterMonth)}</span>
        </div>
        {budgets.length === 0 ? (
          <div className="hf-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            No budget limits set
          </div>
        ) : (
          budgets.map((b) => {
            const spent = filteredExpenses.filter((e) => e.category === b.category).reduce((s, e) => s + Number(e.amount), 0);
            const pct = b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0;
            const over = spent > b.limit;
            return (
              <div key={b.id} className="hf-budget-item">
                <div className="hf-budget-header-row">
                  <span className="hf-budget-cat">{b.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="hf-budget-amounts">
                      <span className="spent">{fmt(spent, state.currency)}</span> / {fmt(b.limit, state.currency)}
                    </span>
                    <span className={`hf-tag ${over ? 'hf-tag-expense' : pct > 80 ? 'hf-tag-expense' : 'hf-tag-neutral'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {pct.toFixed(0)}%
                    </span>
                    <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_BUDGET', payload: b.id })}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="hf-progress-bar-bg">
                  <div className={`hf-progress-bar-fill ${over ? 'red' : pct > 80 ? 'amber' : 'green'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
