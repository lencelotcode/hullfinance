import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Landmark } from 'lucide-react';
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
  const positiveAcc = accounts.filter((a) => Number(a.balance) >= 0).length;
  const highestBal = accounts.length > 0 ? accounts.reduce((max, a) => Number(a.balance) > Number(max.balance) ? a : max, accounts[0]) : null;

  function handleAdd() {
    const val = parseFloat(balance) || 0;
    if (!name.trim()) return alert('Enter account name');
    dispatch({ type: 'ADD_ACCOUNT', payload: { name: name.trim(), type, balance: val, currency: state.currency } });
    setName('');
    setBalance('');
    setType(ACCOUNT_TYPES[0]);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Total Balance</p><p className={`text-lg font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(totalBalance, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Accounts</p><p className="text-lg font-bold text-blue-400">{accounts.length}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Positive</p><p className="text-lg font-bold text-emerald-400">{positiveAcc}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Highest</p><p className="text-lg font-bold text-amber-400 text-sm">{highestBal ? highestBal.name : 'N/A'}</p></CardContent></Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Add Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Account name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-zinc-200">{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder={`Balance (${state.currency === 'GBP' ? '£' : '₹'})`} value={balance} onChange={(e) => setBalance(e.target.value)} step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
          </div>
          <Button onClick={handleAdd} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Plus size={16} className="mr-1" /> Add Account</Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">{accounts.length} accounts · Total: {fmt(totalBalance, state.currency)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {accounts.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No accounts added</p>
          ) : (
            accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800"><Landmark size={16} className="text-zinc-400" /></div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{a.name}</p>
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">{a.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-semibold ${Number(a.balance) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(a.balance, state.currency)}</p>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => dispatch({ type: 'DELETE_ACCOUNT', payload: a.id })}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
