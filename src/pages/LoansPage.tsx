import { useState } from 'react';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmtGBP, fmtINR, today, calculateLoanWithInterest } from '@/lib/finance';
import type { Loan } from '@/lib/types';

export default function LoansPage() {
  const { state, dispatch } = useFinance();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('simple');
  const [editingRepayment, setEditingRepayment] = useState<{ loanId: string; repaymentId: string } | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const loans = state.loans.filter((l) => l.currency === state.currency);
  const summaries = loans.map((l) => calculateLoanWithInterest(l, state.exchangeRate));
  const totalBorrowed = loans.reduce((s, l) => s + Number(l.amount), 0);
  const totalPaid = summaries.reduce((s, ls) => s + ls.totalPaid, 0);
  const totalGbpPaid = summaries.reduce((s, ls) => s + ls.totalGbpPaid, 0);
  const totalOwed = summaries.reduce((s, ls) => s + ls.totalOwed, 0);
  const totalInterest = summaries.reduce((s, ls) => s + ls.interestAccrued, 0);
  const totalUtilized = summaries.reduce((s, ls) => s + ls.totalUtilizedINR, 0);
  const totalRemainingFunds = summaries.reduce((s, ls) => s + ls.remainingFundsINR, 0);

  function handleAdd() {
    const val = parseFloat(amount);
    if (!person.trim()) return alert('Enter the lender name');
    if (!val || val <= 0) return alert('Enter a valid amount');
    dispatch({
      type: 'ADD_LOAN',
      payload: { person: person.trim(), amount: val, date, note: note.trim(), currency: state.currency, interestRate: parseFloat(interestRate) || 0, interestType, repayments: [], utilizations: [] },
    });
    setPerson(''); setAmount(''); setNote(''); setInterestRate('0'); setInterestType('simple');
  }

  function handleRepay(loanId: string, gbpVal: string) {
    const gbp = parseFloat(gbpVal);
    if (!gbp || gbp <= 0) return alert('Enter repayment amount in GBP');
    dispatch({ type: 'REPAY_LOAN', payload: { loanId, gbpAmount: gbp } });
  }

  function handleEditSave(loanId: string, repaymentId: string) {
    const gbp = parseFloat(editAmount);
    if (!gbp || gbp <= 0) return alert('Enter a valid GBP amount');
    dispatch({ type: 'EDIT_REPAYMENT', payload: { loanId, repaymentId, newGbpAmount: gbp } });
    setEditingRepayment(null); setEditAmount('');
  }

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Total Borrowed</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="0"/><path d="M16 3H8L2 7h20l-6-4z"/></svg></span></div>
          <div className="hf-stat-value blue">{fmtINR(totalBorrowed)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Total Paid (INR)</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span></div>
          <div className="hf-stat-value green">{fmtINR(totalPaid)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Total Paid (GBP)</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span></div>
          <div className="hf-stat-value green">{fmtGBP(totalGbpPaid)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Outstanding</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" width="16" height="16"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span></div>
          <div className="hf-stat-value amber">{fmtINR(totalOwed)}</div>
        </div>
      </div>

      <div className="hf-stat-grid cols-2" style={{ marginBottom: '20px' }}>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Total Utilized (Spent)</span><span className="hf-stat-icon"><Plus size={16} style={{ color: '#B03030', transform: 'rotate(45deg)' }} /></span></div>
          <div className="hf-stat-value red">{fmtINR(totalUtilized)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Remaining Funds</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span></div>
          <div className="hf-stat-value green">{fmtINR(Math.max(0, totalRemainingFunds))}</div>
        </div>
      </div>

      {totalInterest > 0 && (
        <div className="hf-panel" style={{ marginBottom: '20px', borderLeft: '2px solid #C9973A' }}>
          <div className="hf-stat-card-label">Total Interest Accrued</div>
          <div className="hf-stat-value amber">{fmtINR(totalInterest)}</div>
        </div>
      )}

      <div className="hf-panel" style={{ marginBottom: '20px', borderLeft: '2px solid #5A8FAE' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Loan Utilization:</strong> Track how much of your borrowed funds you've used (e.g., university fees). <strong style={{ color: 'var(--text)' }}>Remaining Funds</strong> shows what's still available. <strong style={{ color: 'var(--text)' }}>Outstanding</strong> is what you owe to repay.
          <br /><br />
          <strong style={{ color: 'var(--text)' }}>Cross-Currency Repayment:</strong> Loans are tracked in INR. When you repay in GBP, it's auto-converted (1 GBP = {state.exchangeRate} INR). {totalInterest > 0 ? 'Interest is calculated on outstanding principal — repayments first cover interest, then principal.' : ''}
        </div>
      </div>

      {/* Add Form */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Record Borrowed Money <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '11px' }}>in INR</span></div>
        <div className="hf-form-grid">
          <div className="hf-form-field"><label className="hf-form-label">Borrowed from</label><input type="text" placeholder="Name" value={person} onChange={(e) => setPerson(e.target.value)} /></div>
          <div className="hf-form-field"><label className="hf-form-label">Amount (₹ INR)</label><input type="number" placeholder="0.00" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="hf-form-field"><label className="hf-form-label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="hf-form-field"><label className="hf-form-label">Reason (optional)</label><input type="text" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="hf-form-field"><label className="hf-form-label">Interest rate %</label><input type="number" placeholder="e.g. 5" min="0" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} /></div>
          <div className="hf-form-field">
            <label className="hf-form-label">Interest Type</label>
            <select value={interestType} onChange={(e) => setInterestType(e.target.value as 'simple' | 'compound')}>
              <option value="simple">Simple Interest</option>
              <option value="compound">Compound (Monthly)</option>
            </select>
          </div>
        </div>
        <button className="hf-btn" onClick={handleAdd}><Plus size={14} strokeWidth={2.5} /> Add Loan</button>
      </div>

      {/* Loan Cards */}
      {loans.length === 0 ? (
        <div className="hf-panel">
          <div className="hf-empty">No borrowed money recorded</div>
        </div>
      ) : (
        [...loans].reverse().map((loan) => (
          <LoanCard key={loan.id} loan={loan} state={state} dispatch={dispatch} handleRepay={handleRepay} editingRepayment={editingRepayment} setEditingRepayment={setEditingRepayment} editAmount={editAmount} setEditAmount={setEditAmount} onEditSave={handleEditSave} />
        ))
      )}
    </div>
  );
}

function LoanCard({ loan, state, dispatch, handleRepay, editingRepayment, setEditingRepayment, editAmount, setEditAmount, onEditSave }: {
  loan: Loan; state: any; dispatch: any; handleRepay: (loanId: string, gbpVal: string) => void;
  editingRepayment: { loanId: string; repaymentId: string } | null; setEditingRepayment: (v: any) => void;
  editAmount: string; setEditAmount: (v: string) => void; onEditSave: (loanId: string, repaymentId: string) => void;
}) {
  const s = calculateLoanWithInterest(loan, state.exchangeRate);
  const [repayAmount, setRepayAmount] = useState('');
  const [utilDesc, setUtilDesc] = useState('');
  const [utilAmount, setUtilAmount] = useState('');
  const [utilDate, setUtilDate] = useState(today());

  return (
    <div className="hf-panel" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{loan.person}</span>
            <span className={`hf-tag ${s.status === 'paid' ? 'hf-tag-income' : s.status === 'partial' ? 'hf-tag-neutral' : 'hf-tag-expense'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{s.statusLabel}</span>
            {s.hasInterest && <span className="hf-tag hf-tag-neutral" style={{ fontSize: '9px', padding: '2px 6px' }}>{loan.interestRate}% {loan.interestType === 'compound' ? 'CMP' : 'SIM'}</span>}
          </div>
          <div className="hf-tx-meta">{loan.note ? loan.note + ' · ' : ''}Borrowed on {loan.date}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#5A8FAE' }}>{fmtINR(s.hasInterest ? s.totalOwed : Number(loan.amount))}</div>
          <div className="hf-tx-meta">Paid: {fmtINR(s.totalPaid)} ({fmtGBP(s.gbpPaid)})</div>
        </div>
        <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_LOAN', payload: loan.id })}><Trash2 size={13} /></button>
      </div>

      {s.hasInterest && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: 'var(--muted)' }}>Original Principal</span><span style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtINR(s.originalPrincipal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: 'var(--muted)' }}>Principal Paid</span><span style={{ color: '#5A9E6F', fontWeight: 500 }}>{fmtINR(s.principalPaid)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: 'var(--muted)' }}>Principal Remaining</span><span style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtINR(s.principalRemaining)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: 'var(--muted)' }}>Interest Accrued</span><span style={{ color: '#C9973A', fontWeight: 500 }}>{fmtINR(s.interestAccrued)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: 'var(--muted)' }}>Interest Paid</span><span style={{ color: '#5A9E6F', fontWeight: 500 }}>{fmtINR(s.interestPaid)}</span></div>
          {s.interestUnpaid > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: 'var(--muted)' }}>Interest Unpaid</span><span style={{ color: 'var(--red)', fontWeight: 500 }}>{fmtINR(s.interestUnpaid)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '8px', marginTop: '8px' }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Total Owed</span>
            <span style={{ fontWeight: 700, color: s.totalOwed > s.principalRemaining ? '#C9973A' : '#5A8FAE' }}>{fmtINR(s.totalOwed)}</span>
          </div>
        </div>
      )}

      <div className="hf-progress-bar-bg" style={{ marginBottom: '16px' }}>
        <div className="hf-progress-bar-fill green" style={{ width: `${s.pct}%` }} />
      </div>

      {s.totalOwed > 0.01 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <input type="number" placeholder="Pay in GBP (£)" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} min="0" step="0.01" style={{ maxWidth: '160px' }} />
            <button className="hf-btn" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => { handleRepay(loan.id, repayAmount); setRepayAmount(''); }}>Repay GBP</button>
          </div>
          <div className="hf-tx-meta" style={{ marginBottom: '16px' }}>Total owed: {fmtINR(s.totalOwed)} ≈ {fmtGBP(s.remainingGBP)}{s.hasInterest ? ` (Principal: ${fmtINR(s.principalRemaining)} + Interest: ${fmtINR(s.interestUnpaid)})` : ''}</div>
        </>
      )}

      {loan.repayments.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
          <div className="hf-section-title" style={{ fontSize: '12px', marginBottom: '12px' }}>Repayment History <span className="hf-section-count">{loan.repayments.length}</span></div>
          {[...loan.repayments].reverse().map((r) => {
            const isEditing = editingRepayment?.loanId === loan.id && editingRepayment?.repaymentId === r.id;
            if (isEditing) {
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--muted)', width: '90px', flexShrink: 0 }}>{r.date}</span>
                  <span style={{ color: 'var(--muted)' }}>£</span>
                  <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ width: '90px' }} />
                  <button className="hf-tx-delete" style={{ color: '#5A9E6F' }} onClick={() => onEditSave(loan.id, r.id)}><Check size={14} /></button>
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
                  <button className="hf-tx-delete" onClick={() => { setEditingRepayment({ loanId: loan.id, repaymentId: r.id }); setEditAmount(String(r.gbpAmount)); }}><Pencil size={12} /></button>
                  <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_REPAYMENT', payload: { loanId: loan.id, repaymentId: r.id } })}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div className="hf-section-title" style={{ fontSize: '12px', marginBottom: '12px' }}>Loan Utilization <span className="hf-section-count">{loan.utilizations.length} payments</span></div>
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
            <span>Utilized: {fmtINR(s.totalUtilizedINR)} ({s.utilizedPct}%)</span>
            <span>Remaining: {fmtINR(Math.max(0, s.remainingFundsINR))} ({Math.max(0, 100 - s.utilizedPct)}%)</span>
          </div>
          <div className="hf-progress-bar-bg">
            <div className="hf-progress-bar-fill amber" style={{ width: `${s.utilizedPct}%` }} />
          </div>
        </div>
        {loan.utilizations.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {[...loan.utilizations].reverse().map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--muted)', width: '90px' }}>{u.date}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{u.description}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtGBP(u.gbpAmount)}</span>
                  <span className="hf-tx-meta">({fmtINR(u.inrAmount)})</span>
                  <button className="hf-tx-delete" onClick={() => dispatch({ type: 'DELETE_UTILIZATION', payload: { loanId: loan.id, utilId: u.id } })}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <input placeholder="Description (e.g. University fee)" value={utilDesc} onChange={(e) => setUtilDesc(e.target.value)} style={{ flex: 1, minWidth: '120px' }} />
          <input type="number" placeholder="Amount GBP" value={utilAmount} onChange={(e) => setUtilAmount(e.target.value)} style={{ width: '110px' }} />
          <input type="date" value={utilDate} onChange={(e) => setUtilDate(e.target.value)} style={{ width: '130px' }} />
          <button className="hf-btn" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => {
            const gbp = parseFloat(utilAmount);
            if (!utilDesc.trim() || !gbp || gbp <= 0) return alert('Enter description and valid GBP amount');
            const currentUtilized = loan.utilizations.reduce((sum: number, u: any) => sum + Number(u.inrAmount), 0);
            const inrAmount = gbp * state.exchangeRate;
            if (currentUtilized + inrAmount > Number(loan.amount)) return alert(`This exceeds the loan amount. Remaining: ${fmtINR(Number(loan.amount) - currentUtilized)}`);
            dispatch({ type: 'ADD_UTILIZATION', payload: { loanId: loan.id, description: utilDesc.trim(), gbpAmount: gbp, date: utilDate } });
            setUtilDesc(''); setUtilAmount(''); setUtilDate(today());
          }}>Record</button>
        </div>
      </div>
    </div>
  );
}
