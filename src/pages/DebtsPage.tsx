import { useState } from 'react';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, fmtGBP, fmtINR, today, getDebtSummary } from '@/lib/finance';

export default function DebtsPage() {
  const { state, dispatch } = useFinance();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [editingRepayment, setEditingRepayment] = useState<{ debtId: string; repaymentId: string } | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [repayAmounts, setRepayAmounts] = useState<Record<string, string>>({});

  const debts = state.debts.filter((d) => d.currency === state.currency);
  const summaries = debts.map((d) => getDebtSummary(d, state.exchangeRate));
  const totalOwed = debts.reduce((s, d) => s + Number(d.amount), 0);
  const totalPaid = summaries.reduce((s, ds) => s + ds.totalPaidINR, 0);
  const totalGbpPaid = summaries.reduce((s, ds) => s + ds.totalPaidGBP, 0);
  const remaining = summaries.reduce((s, ds) => s + ds.remaining, 0);

  function handleAdd() {
    const val = parseFloat(amount);
    if (!person.trim()) return alert('Enter the person name');
    if (!val || val <= 0) return alert('Enter a valid amount');
    dispatch({ type: 'ADD_DEBT', payload: { person: person.trim(), amount: val, date, note: note.trim(), currency: state.currency, repayments: [] } });
    setPerson(''); setAmount(''); setNote('');
  }

  function handleRepay(debtId: string, gbpVal: string) {
    const gbp = parseFloat(gbpVal);
    if (!gbp || gbp <= 0) return alert('Enter payment amount in GBP');
    dispatch({ type: 'REPAY_DEBT', payload: { debtId, gbpAmount: gbp } });
    setRepayAmounts(prev => ({ ...prev, [debtId]: '' }));
  }

  function handleEditSave(debtId: string, repaymentId: string) {
    const gbp = parseFloat(editAmount);
    if (!gbp || gbp <= 0) return alert('Enter a valid GBP amount');
    dispatch({ type: 'EDIT_DEBT_REPAYMENT', payload: { debtId, repaymentId, newGbpAmount: gbp } });
    setEditingRepayment(null); setEditAmount('');
  }

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Total Owed</span><span className="hf-stat-icon"><Plus size={16} style={{ color: '#B03030', transform: 'rotate(45deg)' }} /></span></div>
          <div className="hf-stat-value red">{fmt(totalOwed, 'INR')}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Total Paid (INR)</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span></div>
          <div className="hf-stat-value green">{fmt(totalPaid, 'INR')}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Total Paid (GBP)</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span></div>
          <div className="hf-stat-value green">{fmtGBP(totalGbpPaid)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Remaining</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" width="16" height="16"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span></div>
          <div className="hf-stat-value amber">{fmt(remaining, 'INR')}</div>
        </div>
      </div>

      <div className="hf-panel" style={{ marginBottom: '20px', borderLeft: '2px solid var(--red)' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Cross-Currency Repayment:</strong> Your debts are tracked in INR. When you pay in GBP, it's automatically converted (1 GBP = {state.exchangeRate} INR).
        </div>
      </div>

      {/* Add Form */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Record Debt <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '11px' }}>in INR</span></div>
        <div className="hf-form-grid">
          <div className="hf-form-field"><label className="hf-form-label">Owed to</label><input type="text" placeholder="Name" value={person} onChange={(e) => setPerson(e.target.value)} /></div>
          <div className="hf-form-field"><label className="hf-form-label">Amount (₹ INR)</label><input type="number" placeholder="0.00" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="hf-form-field"><label className="hf-form-label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="hf-form-field"><label className="hf-form-label">Reason (optional)</label><input type="text" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <button className="hf-btn" onClick={handleAdd}><Plus size={14} strokeWidth={2.5} /> Add Debt</button>
      </div>

      {/* Debt Cards */}
      {debts.length === 0 ? (
        <div className="hf-panel"><div className="hf-empty">No debts recorded</div></div>
      ) : (
        [...debts].reverse().map((debt) => {
          const ds = getDebtSummary(debt, state.exchangeRate);
          const repayAmount = repayAmounts[debt.id] || '';
          return (
            <div key={debt.id} className="hf-panel" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{debt.person}</span>
                    <span className={`hf-tag ${ds.status === 'paid' ? 'hf-tag-income' : ds.status === 'partial' ? 'hf-tag-neutral' : 'hf-tag-expense'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{ds.statusLabel}</span>
                  </div>
                  <div className="hf-tx-meta">{debt.note ? debt.note + ' · ' : ''}Owed on {debt.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--red)' }}>{fmt(debt.amount, 'INR')}</div>
                  <div className="hf-tx-meta">Paid: {fmt(ds.totalPaidINR, 'INR')} ({fmtGBP(ds.totalPaidGBP)})</div>
                </div>
                <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_DEBT', payload: debt.id })}><Trash2 size={13} /></button>
              </div>

              <div className="hf-progress-bar-bg" style={{ marginBottom: '16px' }}>
                <div className="hf-progress-bar-fill green" style={{ width: `${ds.pct}%` }} />
              </div>

              {ds.remaining > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <input type="number" placeholder="Pay in GBP (£)" value={repayAmount} onChange={(e) => setRepayAmounts(prev => ({ ...prev, [debt.id]: e.target.value }))} min="0" step="0.01" style={{ maxWidth: '160px' }} />
                    <button className="hf-btn" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => handleRepay(debt.id, repayAmount)}>Pay GBP</button>
                  </div>
                  <div className="hf-tx-meta" style={{ marginBottom: '16px' }}>Remaining: {fmt(ds.remaining, 'INR')} ≈ {fmtGBP(ds.remainingGBP)}</div>
                </>
              )}

              {debt.repayments.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div className="hf-section-title" style={{ fontSize: '12px', marginBottom: '12px' }}>Repayment History <span className="hf-section-count">{debt.repayments.length}</span></div>
                  {[...debt.repayments].reverse().map((r) => {
                    const isEditing = editingRepayment?.debtId === debt.id && editingRepayment?.repaymentId === r.id;
                    if (isEditing) {
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--muted)', width: '90px', flexShrink: 0 }}>{r.date}</span>
                          <span style={{ color: 'var(--muted)' }}>£</span>
                          <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ width: '90px' }} />
                          <button className="hf-tx-delete" style={{ color: '#5A9E6F' }} onClick={() => handleEditSave(debt.id, r.id)}><Check size={14} /></button>
                          <button className="hf-tx-delete" onClick={() => setEditingRepayment(null)}><X size={14} /></button>
                        </div>
                      );
                    }
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: 'var(--muted)', width: '90px' }}>{r.date}</span>
                          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtGBP(r.gbpAmount)}</span>
                          <span className="hf-tx-meta">({fmtINR(r.inrAmount)})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button className="hf-tx-delete" onClick={() => { setEditingRepayment({ debtId: debt.id, repaymentId: r.id }); setEditAmount(String(r.gbpAmount)); }}><Pencil size={12} /></button>
                          <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_DEBT_REPAYMENT', payload: { debtId: debt.id, repaymentId: r.id } })}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
