import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Wallet, PiggyBank, CreditCard, Receipt, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, monthLabel, CURRENCIES } from '@/lib/finance';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">{label}</p>
            <p className="text-xl font-bold tracking-tight" style={{ color }}>{value}</p>
          </div>
          <div className="p-2 rounded-xl bg-zinc-800/50">
            <Icon size={20} style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const {
    state,
    totalIncome,
    totalExpenses,
    netBalance,
    totalLoanOwed,
    totalDebtOwed,
    totalAccountBalance,
    upcomingBillsTotal,
    topCats,
    filteredExpenses,
    filteredIncomes,
  } = useFinance();

  const chartData = topCats.map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard label="Income" value={`+${fmt(totalIncome, state.currency)}`} icon={ArrowUpRight} color="#10b981" />
        <MetricCard label="Expenses" value={`-${fmt(totalExpenses, state.currency)}`} icon={ArrowDownRight} color="#ef4444" />
        <MetricCard label="Net" value={`${netBalance >= 0 ? '+' : '-'}${fmt(Math.abs(netBalance), state.currency)}`} icon={Wallet} color={netBalance >= 0 ? '#10b981' : '#ef4444'} />
        <MetricCard label="Accounts" value={fmt(totalAccountBalance, state.currency)} icon={PiggyBank} color="#3b82f6" />
        <MetricCard label="Loan Outstanding" value={fmt(totalLoanOwed, 'INR')} icon={CreditCard} color="#f59e0b" />
        <MetricCard label="Debt Owed" value={fmt(totalDebtOwed, 'INR')} icon={Receipt} color="#ef4444" />
        <MetricCard label="Upcoming Bills" value={fmt(upcomingBillsTotal, state.currency)} icon={AlertTriangle} color="#f59e0b" />
      </div>

      {chartData.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Spending by Category — {monthLabel(state.filterMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => CURRENCIES[state.currency].symbol + v} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7' }}
                  formatter={(value: number) => [fmt(value, state.currency), '']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-200">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredExpenses.slice(-5).reverse().length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No expenses this month</p>
            ) : (
              filteredExpenses.slice(-5).reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{e.note || e.category}</p>
                    <p className="text-xs text-zinc-500">{e.category} · {e.date}{e.source && e.source !== 'Owned Money' ? ` · ${e.source}` : ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-400">-{fmt(e.amount, state.currency)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-200">Recent Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredIncomes.slice(-5).reverse().length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No income this month</p>
            ) : (
              filteredIncomes.slice(-5).reverse().map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{i.note || i.category}</p>
                    <p className="text-xs text-zinc-500">{i.category} · {i.date}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">+{fmt(i.amount, state.currency)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
