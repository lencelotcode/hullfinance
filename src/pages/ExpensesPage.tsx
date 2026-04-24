import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, today, monthLabel } from '@/lib/finance';
import { EXPENSE_CATS } from '@/lib/types';
import SearchFilter from '@/components/SearchFilter';

export default function ExpensesPage() {
  const { state, dispatch, filteredExpenses } = useFinance();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATS[0]);
  const [source, setSource] = useState('Owned Money');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const allExpenseCategories = [...new Set([...EXPENSE_CATS, ...state.customExpenseCategories])];

  // Apply filters
  let displayExpenses = filteredExpenses;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    displayExpenses = displayExpenses.filter(
      (e) => e.note.toLowerCase().includes(query) || String(e.amount).includes(query)
    );
  }
  if (categoryFilter) {
    displayExpenses = displayExpenses.filter((e) => e.category === categoryFilter);
  }
  if (dateFilter) {
    displayExpenses = displayExpenses.filter((e) => e.date === dateFilter);
  }

  const totalFiltered = displayExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const avgExpense = displayExpenses.length > 0 ? totalFiltered / displayExpenses.length : 0;
  const catCount: Record<string, number> = {};
  displayExpenses.forEach((e) => { catCount[e.category] = (catCount[e.category] || 0) + 1; });
  const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

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
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total</p><p className="text-lg font-bold text-red-400">{fmt(totalFiltered, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Transactions</p><p className="text-lg font-bold text-blue-400">{displayExpenses.length}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Average</p><p className="text-lg font-bold text-amber-400">{fmt(avgExpense, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Top Category</p><p className="text-lg font-bold text-emerald-400 text-sm">{topCategory ? topCategory[0] : 'N/A'}</p></CardContent></Card>
      </div>

      <SearchFilter
        onSearch={setSearchQuery}
        onCategoryFilter={setCategoryFilter}
        onDateFilter={setDateFilter}
        categories={allExpenseCategories}
      />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Add Expense</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="number" placeholder={`Amount (${state.currency === 'GBP' ? '£' : '₹'})`} value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {allExpenseCategories.map((c) => <SelectItem key={c} value={c} className="text-zinc-200">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {sourceOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-zinc-200">{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          <Button onClick={handleAdd} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Plus size={16} className="mr-1" /> Add Expense</Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">{filteredExpenses.length} expenses — {monthLabel(state.filterMonth)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No expenses recorded</p>
          ) : (
            [...filteredExpenses].reverse().map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-zinc-200">{e.note || e.category}</p>
                    <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 bg-red-500/10">{e.category}</Badge>
                    {e.source && e.source !== 'Owned Money' && <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">{e.source}</Badge>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{e.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-red-400 whitespace-nowrap">-{fmt(e.amount, state.currency)}</p>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: e.id })}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
