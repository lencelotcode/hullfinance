import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    setPerson('');
    setAmount('');
    setNote('');
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
    setEditingRepayment(null);
    setEditAmount('');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Owed</p><p className="text-lg font-bold text-red-400">{fmt(totalOwed, 'INR')}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Paid (INR)</p><p className="text-lg font-bold text-emerald-400">{fmt(totalPaid, 'INR')}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Paid (GBP)</p><p className="text-lg font-bold text-emerald-400">{fmtGBP(totalGbpPaid)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Remaining</p><p className="text-lg font-bold text-amber-400">{fmt(remaining, 'INR')}</p></CardContent></Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-red-500">
        <CardContent className="p-4 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Cross-Currency Repayment:</strong> Your debts are tracked in INR. When you pay in GBP, it's automatically converted (1 GBP = {state.exchangeRate} INR).
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Record Debt <span className="text-zinc-500 font-normal text-xs">in INR</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Owed to (name)" value={person} onChange={(e) => setPerson(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Input type="number" placeholder="Amount (₹ INR)" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Input placeholder="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <Button onClick={handleAdd} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Plus size={16} className="mr-1" /> Add Debt</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {debts.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 border-dashed"><CardContent className="p-8 text-center text-sm text-zinc-500">No debts recorded</CardContent></Card>
        ) : (
          [...debts].reverse().map((debt) => {
            const ds = getDebtSummary(debt, state.exchangeRate);
            const repayAmount = repayAmounts[debt.id] || '';
            return (
              <Card key={debt.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-zinc-200">{debt.person}</p>
                        <Badge className={`text-xs ${ds.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : ds.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{ds.statusLabel}</Badge>
                      </div>
                      <p className="text-xs text-zinc-500">{debt.note ? debt.note + ' · ' : ''}Owed on {debt.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">{fmt(debt.amount, 'INR')}</p>
                      <p className="text-xs text-zinc-500">Paid: {fmt(ds.totalPaidINR, 'INR')} ({fmtGBP(ds.totalPaidGBP)})</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10 shrink-0" onClick={() => dispatch({ type: 'DELETE_DEBT', payload: debt.id })}><Trash2 size={14} /></Button>
                  </div>

                  <Progress value={ds.pct} className="h-2 bg-zinc-800" />

                  {ds.remaining > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="Pay in GBP (£)" value={repayAmount} onChange={(e) => setRepayAmounts(prev => ({ ...prev, [debt.id]: e.target.value }))} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm" />
                        <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full text-xs" onClick={() => { handleRepay(debt.id, repayAmount); }}>Pay GBP</Button>
                      </div>
                      <p className="text-xs text-zinc-500">Remaining: {fmt(ds.remaining, 'INR')} ≈ {fmtGBP(ds.remainingGBP)}</p>
                    </>
                  )}

                  {debt.repayments.length > 0 && (
                    <div className="border-t border-zinc-800 pt-4">
                      <p className="text-xs font-semibold text-zinc-300 mb-2">Repayment History <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 text-[10px]">{debt.repayments.length}</span></p>
                      <div className="space-y-2">
                        {[...debt.repayments].reverse().map((r) => {
                          const isEditing = editingRepayment?.debtId === debt.id && editingRepayment?.repaymentId === r.id;
                          if (isEditing) {
                            return (
                              <div key={r.id} className="flex items-center gap-2 text-sm">
                                <span className="text-zinc-500 w-24">{r.date}</span>
                                <span className="text-zinc-500">£</span>
                                <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200 w-24 text-sm h-8" />
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400" onClick={() => handleEditSave(debt.id, r.id)}><Check size={14} /></Button>
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
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-zinc-200" onClick={() => { setEditingRepayment({ debtId: debt.id, repaymentId: r.id }); setEditAmount(String(r.gbpAmount)); }}><Pencil size={12} /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_DEBT_REPAYMENT', payload: { debtId: debt.id, repaymentId: r.id } })}><Trash2 size={12} /></Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
