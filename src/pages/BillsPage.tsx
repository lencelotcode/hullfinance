import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, CheckCircle2, Receipt } from 'lucide-react';
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
  const overdue = upcoming.filter((b) => new Date(b.dueDate) < new Date());
  const dueToday = upcoming.filter((b) => {
    const daysLeft = Math.ceil((new Date(b.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft === 0;
  });

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
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Pending</p><p className="text-lg font-bold text-amber-400">{fmt(totalPending, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Paid</p><p className="text-lg font-bold text-emerald-400">{fmt(totalPaid, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Overdue</p><p className="text-lg font-bold text-red-400">{overdue.length}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Due Today</p><p className="text-lg font-bold text-blue-400">{dueToday.length}</p></CardContent></Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Add Bill Reminder</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Bill name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Input type="number" placeholder={`Amount (${state.currency === 'GBP' ? '£' : '₹'})`} value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="bg-zinc-800 border-zinc-700 text-zinc-200 rounded-md px-3 py-2 text-sm">
              <option value="once">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <Button onClick={handleAdd} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Plus size={16} className="mr-1" /> Add Bill</Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Upcoming Bills ({upcoming.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No upcoming bills</p>
          ) : (
            upcoming.map((b) => {
              const daysLeft = Math.ceil((new Date(b.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const urgent = daysLeft < 0 ? 'red' : daysLeft <= 3 ? 'amber' : daysLeft <= 7 ? 'yellow' : 'blue';
              return (
                <div key={b.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-800"><Receipt size={16} className="text-zinc-400" /></div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{b.name}</p>
                      <p className="text-xs text-zinc-500">{b.note || 'Due ' + b.dueDate} · <Badge variant="outline" className={`text-xs ${urgent === 'red' ? 'border-red-500/30 text-red-400 bg-red-500/10' : urgent === 'amber' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-blue-500/30 text-blue-400 bg-blue-500/10'}`}>{daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : daysLeft + ' days left'}</Badge></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-red-400 whitespace-nowrap">{fmt(b.amount, state.currency)}</p>
                    <Button size="sm" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs" onClick={() => dispatch({ type: 'PAY_BILL', payload: b.id })}><CheckCircle2 size={14} className="mr-1" /> Pay</Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_BILL', payload: b.id })}><Trash2 size={14} /></Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {paid.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Paid Bills ({paid.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {paid.slice(-5).reverse().map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 opacity-60">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{b.name}</p>
                  <p className="text-xs text-zinc-500">Paid on {b.paidDate}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-400">{fmt(b.amount, state.currency)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
