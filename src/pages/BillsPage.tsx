import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt } from '@/lib/finance';

export default function BillsPage() {
  const { state, dispatch } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'monthly' | 'weekly' | 'yearly'>('once');
  const [note, setNote] = useState('');

  const bills = state.bills.filter((b) => b.currency === state.currency);
  const upcoming = bills.filter((b) => b.status === 'pending').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const paid = bills.filter((b) => b.status === 'paid');
  const totalPending = upcoming.reduce((s, b) => s + Number(b.amount), 0);
  const totalPaid = paid.reduce((s, b) => s + Number(b.amount), 0);

  function handleAdd() {
    const val = parseFloat(amount);
    if (!name.trim()) return alert('Enter bill name');
    if (!val || val <= 0) return alert('Enter a valid amount');
    if (!dueDate) return alert('Select due date');
    dispatch({ type: 'ADD_BILL', payload: { name: name.trim(), amount: val, dueDate, frequency, note: note.trim(), currency: state.currency } });
    setName('');
    setAmount('');
    setDueDate('');
    setNote('');
    setFrequency('once');
  }

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid cols-3">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total Due</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#B03030" strokeWidth="2" width="16" height="16"><rect x="5" y="2" width="14" height="20"/><line x1="9" y1="7" x2="15" y2="7"/></svg></span>
          </div>
          <div className="hf-stat-value red">{fmt(totalPending, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Paid This Month</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span>
          </div>
          <div className="hf-stat-value green">{fmt(totalPaid, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Bills Remaining</span>
            <span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" width="16" height="16"><rect x="5" y="2" width="14" height="20"/><line x1="9" y1="7" x2="15" y2="7"/></svg></span>
          </div>
          <div className="hf-stat-value amber">{upcoming.length}</div>
        </div>
      </div>

      {/* Add Form */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Add Bill</div>
        <div className="hf-form-grid cols-3">
          <div className="hf-form-field">
            <label className="hf-form-label">Bill Name</label>
            <input type="text" placeholder="e.g. Netflix" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Amount</label>
            <input type="number" placeholder="0.00" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Category</label>
            <select>
              <option>Utilities</option>
              <option>Subscriptions</option>
              <option>Rent</option>
              <option>Insurance</option>
              <option>Other</option>
            </select>
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Recurring</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="once">One-time</option>
            </select>
          </div>
        </div>
        <button className="hf-btn" onClick={handleAdd}>
          <Plus size={14} strokeWidth={2.5} />
          Add Bill
        </button>
      </div>

      {/* List */}
      <div className="hf-panel">
        <div className="hf-section-header">
          <span className="hf-section-title">Upcoming Bills</span>
          <span className="hf-section-count">{bills.length} bill{bills.length !== 1 ? 's' : ''}</span>
        </div>
        {bills.length === 0 ? (
          <div className="hf-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            No bills added
          </div>
        ) : (
          [...bills].sort((a, b) => {
            if (a.status !== b.status) return a.status === 'paid' ? 1 : -1;
            return (a.dueDate || '').localeCompare(b.dueDate || '');
          }).map((b) => (
            <div key={b.id} className="hf-bill-item">
              <div className={`hf-bill-dot ${b.status === 'paid' ? 'paid' : 'due'}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hf-tx-name" style={b.status === 'paid' ? { opacity: 0.4, textDecoration: 'line-through' } : {}}>{b.name}</div>
                <div className="hf-tx-meta">{b.note || 'Due ' + b.dueDate} · {b.frequency}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="hf-tx-amount expense" style={b.status === 'paid' ? { opacity: 0.4 } : {}}>{fmt(b.amount, state.currency)}</span>
                {b.status !== 'paid' && (
                  <button className="hf-btn-ghost" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => dispatch({ type: 'PAY_BILL', payload: b.id })}>
                    Mark Paid
                  </button>
                )}
                <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_BILL', payload: b.id })}>
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
