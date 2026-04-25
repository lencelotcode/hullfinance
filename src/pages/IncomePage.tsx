import { useState } from 'react';
import { Search, Trash2, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, today, monthLabel } from '@/lib/finance';
import { INCOME_CATS } from '@/lib/types';
import { categoryEmoji } from '@/lib/emojis';

export default function IncomePage() {
  const { state, dispatch, filteredIncomes } = useFinance();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATS[0]);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const allIncomeCategories = [...new Set([...INCOME_CATS, ...state.customIncomeCategories])];

  let displayIncomes = filteredIncomes;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    displayIncomes = displayIncomes.filter(
      (i) => i.note.toLowerCase().includes(query) || String(i.amount).includes(query) || i.category.toLowerCase().includes(query)
    );
  }

  const total = filteredIncomes.reduce((s, i) => s + Number(i.amount), 0);
  const avg = filteredIncomes.length > 0 ? total / filteredIncomes.length : 0;
  const cats: Record<string, number> = {};
  filteredIncomes.forEach((i) => { cats[i.category] = (cats[i.category] || 0) + 1; });
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];

  function handleAdd() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert('Enter a valid amount');
    dispatch({ type: 'ADD_INCOME', payload: { amount: val, category, date, note, currency: state.currency } });
    setAmount('');
    setNote('');
  }

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span>
          </div>
          <div className="hf-stat-value green">{fmt(total, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Transactions</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>
          </div>
          <div className="hf-stat-value blue">{filteredIncomes.length}</div>
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
            <span className="hf-stat-card-label">Top Source</span>
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
            placeholder="Search income..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Add Form */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Add Income</div>
        <div className="hf-form-grid">
          <div className="hf-form-field">
            <label className="hf-form-label">Amount</label>
            <input type="number" placeholder="0.00" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Source</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {allIncomeCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Account</label>
            <select>
              <option>Main Account</option>
              <option>Savings</option>
              <option>Cash</option>
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
          Add Income
        </button>
      </div>

      {/* List */}
      <div className="hf-panel">
        <div className="hf-section-header">
          <span className="hf-section-title">Income — {monthLabel(state.filterMonth)}</span>
          <span className="hf-section-count">{displayIncomes.length} record{displayIncomes.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="hf-tx-list">
          {displayIncomes.length === 0 ? (
            <div className="hf-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              No income recorded
            </div>
          ) : (
            [...displayIncomes].sort((a, b) => b.date.localeCompare(a.date)).map((i) => (
              <div key={i.id} className="hf-tx-item">
                <div className="hf-tx-icon">{categoryEmoji(i.category)}</div>
                <div className="hf-tx-info">
                  <div className="hf-tx-name">{i.note || i.category}</div>
                  <div className="hf-tx-meta">{i.date}{i.note ? ' · ' + i.note : ''}</div>
                </div>
                <span className="hf-tx-amount income">+{fmt(i.amount, state.currency)}</span>
                <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_INCOME', payload: i.id })}>
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
