import { useState } from 'react';
import { Search, Trash2, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, today, monthLabel } from '@/lib/finance';
import { EXPENSE_CATS } from '@/lib/types';
import { categoryEmoji } from '@/lib/emojis';

export default function ExpensesPage() {
  const { state, dispatch, filteredExpenses } = useFinance();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATS[0]);
  const [source, setSource] = useState('Owned Money');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const allExpenseCategories = [...new Set([...EXPENSE_CATS, ...state.customExpenseCategories])];

  let displayExpenses = filteredExpenses;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    displayExpenses = displayExpenses.filter(
      (e) => e.note.toLowerCase().includes(query) || String(e.amount).includes(query) || e.category.toLowerCase().includes(query)
    );
  }

  const total = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const avg = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0;
  const cats: Record<string, number> = {};
  filteredExpenses.forEach((e) => { cats[e.category] = (cats[e.category] || 0) + 1; });
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];

  const sourceOptions = [
    { value: 'Owned Money', label: 'Owned Money' },
    ...state.accounts.map((a) => ({ value: `Account: ${a.name}`, label: `Account: ${a.name}` })),
    ...state.loans.map((l) => ({ value: `Loan: ${l.person}`, label: `Loan: ${l.person}` })),
  ];

  function handleAdd() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert('Enter a valid amount');
    dispatch({
      type: 'ADD_EXPENSE',
      payload: { amount: val, category, date, note, currency: state.currency, source },
    });
    setAmount('');
    setNote('');
    setSource('Owned Money');
  }

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total</span>
            <span className="hf-stat-icon"><Plus size={16} style={{ color: '#B03030', transform: 'rotate(45deg)' }} /></span>
          </div>
          <div className="hf-stat-value red">{fmt(total, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Transactions</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>
          </div>
          <div className="hf-stat-value blue">{filteredExpenses.length}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Average</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>
          </div>
          <div className="hf-stat-value amber">{fmt(avg, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Top Category</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M4 6h16M4 12h16M4 18h16"/></svg></span>
          </div>
          <div className="hf-stat-value neutral">{topCat ? topCat[0] : 'N/A'}</div>
        </div>
      </div>

      {/* Search */}
      <div className="hf-search-row">
        <div className="hf-search-wrap">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by note, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Add Form */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Add Expense</div>
        <div className="hf-form-grid">
          <div className="hf-form-field">
            <label className="hf-form-label">Amount</label>
            <input type="number" placeholder="0.00" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {allExpenseCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Account / Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {sourceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="hf-form-field hf-form-full">
            <label className="hf-form-label">Note (optional)</label>
            <input type="text" placeholder="Description..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <button className="hf-btn" onClick={handleAdd}>
          <Plus size={14} strokeWidth={2.5} />
          Add Expense
        </button>
      </div>

      {/* List */}
      <div className="hf-panel">
        <div className="hf-section-header">
          <span className="hf-section-title">Expenses — {monthLabel(state.filterMonth)}</span>
          <span className="hf-section-count">{displayExpenses.length} record{displayExpenses.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="hf-tx-list">
          {displayExpenses.length === 0 ? (
            <div className="hf-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              No expenses recorded
            </div>
          ) : (
            [...displayExpenses].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
              <div key={e.id} className="hf-tx-item">
                <div className="hf-tx-icon">{categoryEmoji(e.category)}</div>
                <div className="hf-tx-info">
                  <div className="hf-tx-name">{e.note || e.category}</div>
                  <div className="hf-tx-meta">{e.date}{e.source ? ' · ' + e.source : ''}{e.note ? ' · ' + e.note : ''}</div>
                </div>
                <span className="hf-tx-amount expense">-{fmt(e.amount, state.currency)}</span>
                <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: e.id })}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
