import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Add Budget — {monthLabel(state.filterMonth)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {EXPENSE_CATS.map((c) => <SelectItem key={c} value={c} className="text-zinc-200">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder={`Limit (${state.currency === 'GBP' ? '£' : '₹'})`} value={limit} onChange={(e) => setLimit(e.target.value)} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Button onClick={handleAdd} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Plus size={16} className="mr-1" /> Set Budget</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 border-dashed md:col-span-2"><CardContent className="p-8 text-center text-sm text-zinc-500">No budgets set for this month</CardContent></Card>
        ) : (
          budgets.map((b) => {
            const spent = filteredExpenses.filter((e) => e.category === b.category).reduce((s, e) => s + Number(e.amount), 0);
            const pct = Math.min(100, Math.round((spent / b.limit) * 100));
            const over = spent > b.limit;
            return (
              <Card key={b.id} className={`bg-zinc-900 border-zinc-800 ${over ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-200">{b.category}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_BUDGET', payload: b.id })}><Trash2 size={14} /></Button>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Spent: <span className={over ? 'text-red-400 font-medium' : 'text-zinc-200'}>{fmt(spent, state.currency)}</span></span>
                    <span className="text-zinc-500">Limit: {fmt(b.limit, state.currency)}</span>
                  </div>
                  <Progress value={pct} className="h-2 bg-zinc-800" />
                  {over && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <AlertTriangle size={14} />
                      <span>Over budget by {fmt(spent - b.limit, state.currency)}</span>
                    </div>
                  )}
                  {!over && pct >= 80 && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <AlertTriangle size={14} />
                      <span>{100 - pct}% remaining</span>
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
