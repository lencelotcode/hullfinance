import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, today, monthLabel } from '@/lib/finance';
import { INCOME_CATS } from '@/lib/types';
import SearchFilter from '@/components/SearchFilter';

export default function IncomePage() {
  const { state, dispatch, filteredIncomes } = useFinance();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATS[0]);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const allIncomeCategories = [...new Set([...INCOME_CATS, ...state.customIncomeCategories])];

  // Apply filters
  let displayIncomes = filteredIncomes;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    displayIncomes = displayIncomes.filter(
      (i) => i.note.toLowerCase().includes(query) || String(i.amount).includes(query)
    );
  }
  if (categoryFilter) {
    displayIncomes = displayIncomes.filter((i) => i.category === categoryFilter);
  }
  if (dateFilter) {
    displayIncomes = displayIncomes.filter((i) => i.date === dateFilter);
  }

  const totalFiltered = displayIncomes.reduce((s, i) => s + Number(i.amount), 0);
  const avgIncome = displayIncomes.length > 0 ? totalFiltered / displayIncomes.length : 0;
  const catCount: Record<string, number> = {};
  displayIncomes.forEach((i) => { catCount[i.category] = (catCount[i.category] || 0) + 1; });
  const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

  function handleAdd() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert('Enter a valid amount');
    dispatch({ type: 'ADD_INCOME', payload: { amount: val, category, date, note, currency: state.currency } });
    setAmount('');
    setNote('');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total</p><p className="text-lg font-bold text-emerald-400">{fmt(totalFiltered, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Transactions</p><p className="text-lg font-bold text-blue-400">{displayIncomes.length}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Average</p><p className="text-lg font-bold text-amber-400">{fmt(avgIncome, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Top Source</p><p className="text-lg font-bold text-emerald-400 text-sm">{topCategory ? topCategory[0] : 'N/A'}</p></CardContent></Card>
      </div>

      <SearchFilter
        onSearch={setSearchQuery}
        onCategoryFilter={setCategoryFilter}
        onDateFilter={setDateFilter}
        categories={allIncomeCategories}
      />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Add Income</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input type="number" placeholder={`Amount (${state.currency === 'GBP' ? '£' : '₹'})`} value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {allIncomeCategories.map((c) => <SelectItem key={c} value={c} className="text-zinc-200">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          <Button onClick={handleAdd} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Plus size={16} className="mr-1" /> Add Income</Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">{filteredIncomes.length} entries — {monthLabel(state.filterMonth)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filteredIncomes.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No income recorded</p>
          ) : (
            [...filteredIncomes].reverse().map((i) => (
              <div key={i.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-zinc-200">{i.note || i.category}</p>
                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">{i.category}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{i.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-emerald-400 whitespace-nowrap">+{fmt(i.amount, state.currency)}</p>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_INCOME', payload: i.id })}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
