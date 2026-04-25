import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt } from '@/lib/finance';
import { ACCOUNT_TYPES } from '@/lib/types';

export default function AccountsPage() {
  const { state, dispatch } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState(ACCOUNT_TYPES[0]);
  const [balance, setBalance] = useState('');

  const accounts = state.accounts.filter((a) => a.currency === state.currency);
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  function handleAdd() {
    const val = parseFloat(balance) || 0;
    if (!name.trim()) return alert('Enter account name');
    dispatch({ type: 'ADD_ACCOUNT', payload: { name: name.trim(), type, balance: val, currency: state.currency } });
    setName('');
    setBalance('');
    setType(ACCOUNT_TYPES[0]);
  }

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid cols-2">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total Balance</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="0"/><path d="M16 3H8L2 7h20l-6-4z"/></svg></span>
          </div>
          <div className="hf-stat-value blue">{fmt(totalBalance, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Accounts</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="0"/><path d="M16 3H8L2 7h20l-6-4z"/></svg></span>
          </div>
          <div className="hf-stat-value neutral">{accounts.length}</div>
        </div>
      </div>

      {/* Add Form */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Add Account</div>
        <div className="hf-form-grid">
          <div className="hf-form-field">
            <label className="hf-form-label">Account Name</label>
            <input type="text" placeholder="e.g. Barclays Current" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Opening Balance</label>
            <input type="number" placeholder="0.00" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Currency</label>
            <select disabled>
              <option>{state.currency}</option>
            </select>
          </div>
        </div>
        <button className="hf-btn" onClick={handleAdd}>
          <Plus size={14} strokeWidth={2.5} />
          Add Account
        </button>
      </div>

      {/* List */}
      <div className="hf-panel">
        <div className="hf-section-header">
          <span className="hf-section-title">Accounts</span>
          <span className="hf-section-count">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
        </div>
        {accounts.length === 0 ? (
          <div className="hf-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            No accounts added
          </div>
        ) : (
          accounts.map((a) => (
            <div key={a.id} className="hf-account-card">
              <div>
                <div className="hf-account-name">{a.name}</div>
                <div className="hf-account-type">{a.type} · {a.currency}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="hf-account-balance">{fmt(a.balance, state.currency)}</div>
                <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_ACCOUNT', payload: a.id })}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
