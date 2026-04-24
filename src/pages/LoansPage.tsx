import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, fmtGBP, fmtINR, today, calculateLoanWithInterest } from '@/lib/finance';
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
      payload: {
        person: person.trim(),
        amount: val,
        date,
        note: note.trim(),
        currency: state.currency,
        interestRate: parseFloat(interestRate) || 0,
        interestType,
        repayments: [],
        utilizations: [],
      },
    });
    setPerson('');
    setAmount('');
    setNote('');
    setInterestRate('0');
    setInterestType('simple');
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
    setEditingRepayment(null);
    setEditAmount('');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Borrowed</p><p className="text-lg font-bold text-blue-400">{fmt(totalBorrowed, 'INR')}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Paid (INR)</p><p className="text-lg font-bold text-emerald-400">{fmt(totalPaid, 'INR')}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Paid (GBP)</p><p className="text-lg font-bold text-emerald-400">{fmtGBP(totalGbpPaid)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Outstanding</p><p className="text-lg font-bold text-amber-400">{fmt(totalOwed, 'INR')}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Utilized (Spent)</p><p className="text-lg font-bold text-red-400">{fmtINR(totalUtilized)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Remaining Funds</p><p className="text-lg font-bold text-emerald-400">{fmtINR(Math.max(0, totalRemainingFunds))}</p></CardContent></Card>
      </div>

      {totalInterest > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-amber-500">
          <CardContent className="p-4"><p className="text-xs text-zinc-500">Total Interest Accrued</p><p className="text-lg font-bold text-amber-400">{fmtINR(totalInterest)}</p></CardContent>
        </Card>
      )}

      <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
        <CardContent className="p-4 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Loan Utilization:</strong> Track how much of your borrowed funds you've used (e.g., university fees). <strong>Remaining Funds</strong> shows what's still available. <strong>Outstanding</strong> is what you owe to repay.
          <br /><br />
          <strong className="text-zinc-200">Cross-Currency Repayment:</strong> Loans are tracked in INR. When you repay in GBP, it's auto-converted (1 GBP = {state.exchangeRate} INR). {totalInterest > 0 ? 'Interest is calculated on outstanding principal — repayments first cover interest, then principal.' : ''}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Record Borrowed Money <span className="text-zinc-500 font-normal text-xs">in INR</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Borrowed from (name)" value={person} onChange={(e) => setPerson(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Input type="number" placeholder="Amount (₹ INR)" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Input placeholder="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="number" placeholder="Interest rate % (e.g. 5)" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} min="0" step="0.1" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <select value={interestType} onChange={(e) => setInterestType(e.target.value as 'simple' | 'compound')} className="bg-zinc-800 border-zinc-700 text-zinc-200 rounded-md px-3 py-2 text-sm">
              <option value="simple">Simple Interest</option>
              <option value="compound">Compound (Monthly)</option>
            </select>
          </div>
          <Button onClick={handleAdd} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Plus size={16} className="mr-1" /> Add Loan</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loans.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 border-dashed"><CardContent className="p-8 text-center text-sm text-zinc-500">No borrowed money recorded</CardContent></Card>
        ) : (
          [...loans].reverse().map((loan) => <LoanCard key={loan.id} loan={loan} state={state} dispatch={dispatch} handleRepay={handleRepay} editingRepayment={editingRepayment} setEditingRepayment={setEditingRepayment} editAmount={editAmount} setEditAmount={setEditAmount} onEditSave={handleEditSave} />)
        )}
      </div>
    </div>
  );
}

function LoanCard({ loan, state, dispatch, handleRepay, editingRepayment, setEditingRepayment, editAmount, setEditAmount, onEditSave }: {
  loan: Loan;
  state: any;
  dispatch: any;
  handleRepay: (loanId: string, gbpVal: string) => void;
  editingRepayment: { loanId: string; repaymentId: string } | null;
  setEditingRepayment: (v: any) => void;
  editAmount: string;
  setEditAmount: (v: string) => void;
  onEditSave: (loanId: string, repaymentId: string) => void;
}) {
  const s = calculateLoanWithInterest(loan, state.exchangeRate);
  const [repayAmount, setRepayAmount] = useState('');
  const [utilDesc, setUtilDesc] = useState('');
  const [utilAmount, setUtilAmount] = useState('');
  const [utilDate, setUtilDate] = useState(today());

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold text-zinc-200">{loan.person}</p>
              <Badge className={`text-xs ${s.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : s.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{s.statusLabel}</Badge>
              {s.hasInterest && <Badge className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">{loan.interestRate}% {loan.interestType === 'compound' ? 'CMP' : 'SIM'}</Badge>}
            </div>
            <p className="text-xs text-zinc-500">{loan.note ? loan.note + ' · ' : ''}Borrowed on {loan.date}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-blue-400">{fmtINR(s.hasInterest ? s.totalOwed : Number(loan.amount))}</p>
            <p className="text-xs text-zinc-500">Paid: {fmtINR(s.totalPaid)} ({fmtGBP(s.gbpPaid)})</p>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10 shrink-0" onClick={() => dispatch({ type: 'DELETE_LOAN', payload: loan.id })}><Trash2 size={14} /></Button>
        </div>

        {s.hasInterest && (
          <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Original Principal</span><span className="text-zinc-200 font-medium">{fmtINR(s.originalPrincipal)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Principal Paid</span><span className="text-emerald-400 font-medium">{fmtINR(s.principalPaid)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Principal Remaining</span><span className="text-zinc-200 font-medium">{fmtINR(s.principalRemaining)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Interest Accrued</span><span className="text-amber-400 font-medium">{fmtINR(s.interestAccrued)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Interest Paid</span><span className="text-emerald-400 font-medium">{fmtINR(s.interestPaid)}</span></div>
            {s.interestUnpaid > 0 && <div className="flex justify-between"><span className="text-zinc-500">Interest Unpaid</span><span className="text-red-400 font-medium">{fmtINR(s.interestUnpaid)}</span></div>}
            <div className="flex justify-between border-t border-dashed border-zinc-800 pt-2 mt-2"><span className="text-zinc-200 font-semibold">Total Owed</span><span className={`font-bold ${s.totalOwed > s.principalRemaining ? 'text-amber-400' : 'text-blue-400'}`}>{fmtINR(s.totalOwed)}</span></div>
          </div>
        )}

        <Progress value={s.pct} className="h-2 bg-zinc-800" />

        {s.totalOwed > 0.01 && (
          <div className="flex items-center gap-2">
            <Input type="number" placeholder="Pay in GBP (£)" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm" />
            <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full text-xs" onClick={() => { handleRepay(loan.id, repayAmount); setRepayAmount(''); }}>Repay GBP</Button>
          </div>
        )}
        {s.totalOwed > 0.01 && <p className="text-xs text-zinc-500">Total owed: {fmtINR(s.totalOwed)} ≈ {fmtGBP(s.remainingGBP)}{s.hasInterest ? ` (Principal: ${fmtINR(s.principalRemaining)} + Interest: ${fmtINR(s.interestUnpaid)})` : ''}</p>}

        {loan.repayments.length > 0 && (
          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs font-semibold text-zinc-300 mb-2">Repayment History <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 text-[10px]">{loan.repayments.length}</span></p>
            <div className="space-y-2">
              {[...loan.repayments].reverse().map((r) => {
                const isEditing = editingRepayment?.loanId === loan.id && editingRepayment?.repaymentId === r.id;
                if (isEditing) {
                  return (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500 w-24 shrink-0">{r.date}</span>
                      <span className="text-zinc-500">£</span>
                      <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200 w-24 text-sm h-8" />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400" onClick={() => onEditSave(loan.id, r.id)}><Check size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400" onClick={() => setEditingRepayment(null)}><X size={14} /></Button>
                    </div>
                  );
                }
                return (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1 border-b border-dashed border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 w-24">{r.date}</span>
                      <span className="text-zinc-200 font-medium">{fmtGBP(r.gbpAmount)}</span>
                      <span className="text-zinc-500 text-xs">({fmtINR(r.inrAmount)})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-zinc-200" onClick={() => { setEditingRepayment({ loanId: loan.id, repaymentId: r.id }); setEditAmount(String(r.gbpAmount)); }}><Pencil size={12} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_REPAYMENT', payload: { loanId: loan.id, repaymentId: r.id } })}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
          <p className="text-xs font-semibold text-zinc-300 mb-2">Loan Utilization <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 text-[10px]">{loan.utilizations.length} payments</span></p>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 mb-3">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Utilized: {fmtINR(s.totalUtilizedINR)} ({s.utilizedPct}%)</span>
              <span>Remaining: {fmtINR(Math.max(0, s.remainingFundsINR))} ({Math.max(0, 100 - s.utilizedPct)}%)</span>
            </div>
            <Progress value={s.utilizedPct} className="h-2 bg-zinc-800" />
          </div>
          {loan.utilizations.length > 0 && (
            <div className="space-y-2 mb-3">
              {[...loan.utilizations].reverse().map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm py-1 border-b border-dashed border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 w-24">{u.date}</span>
                    <span className="text-zinc-200 font-medium">{u.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-medium">{fmtGBP(u.gbpAmount)}</span>
                    <span className="text-zinc-500 text-xs">({fmtINR(u.inrAmount)})</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_UTILIZATION', payload: { loanId: loan.id, utilId: u.id } })}><Trash2 size={12} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Description (e.g. University fee)" value={utilDesc} onChange={(e) => setUtilDesc(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm flex-1 min-w-[120px]" />
            <Input type="number" placeholder="Amount GBP" value={utilAmount} onChange={(e) => setUtilAmount(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm w-28" />
            <Input type="date" value={utilDate} onChange={(e) => setUtilDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm w-36" />
            <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full text-xs" onClick={() => {
              const gbp = parseFloat(utilAmount);
              if (!utilDesc.trim() || !gbp || gbp <= 0) return alert('Enter description and valid GBP amount');
              const currentUtilized = loan.utilizations.reduce((sum: number, u: any) => sum + Number(u.inrAmount), 0);
              const inrAmount = gbp * state.exchangeRate;
              if (currentUtilized + inrAmount > Number(loan.amount)) return alert(`This exceeds the loan amount. Remaining: ${fmtINR(Number(loan.amount) - currentUtilized)}`);
              dispatch({ type: 'ADD_UTILIZATION', payload: { loanId: loan.id, description: utilDesc.trim(), gbpAmount: gbp, date: utilDate } });
              setUtilDesc(''); setUtilAmount(''); setUtilDate(today());
            }}>Record</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
