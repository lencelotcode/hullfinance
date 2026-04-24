import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { fmt, fmtINR, CURRENCIES } from '@/lib/finance';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function AnalyticsPage() {
  const { state, totalExpenses, totalIncome, netBalance, loanSummaries, debtSummaries, catTotals } = useFinance();

  // Monthly trend (last 6 months)
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const trendData = months.map((m) => {
    const inc = state.incomes.filter((i) => i.date.startsWith(m) && i.currency === state.currency).reduce((s, i) => s + Number(i.amount), 0);
    const exp = state.expenses.filter((e) => e.date.startsWith(m) && e.currency === state.currency).reduce((s, e) => s + Number(e.amount), 0);
    return { month: m.slice(5), income: inc, expenses: exp, net: inc - exp };
  });

  // Category pie chart data
  const pieData = Object.entries(catTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Loan progress
  const loanProgressData = state.loans
    .filter((l) => l.currency === state.currency)
    .map((l, i) => {
      const s = loanSummaries[i];
      return { name: l.person, borrowed: Number(l.amount), paid: s.totalPaid, remaining: s.totalOwed };
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">This Month Income</p><p className="text-lg font-bold text-emerald-400">{fmt(totalIncome, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">This Month Expenses</p><p className="text-lg font-bold text-red-400">{fmt(totalExpenses, state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Net</p><p className={`text-lg font-bold ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(Math.abs(netBalance), state.currency)}</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><p className="text-xs text-zinc-500">Loan Outstanding</p><p className="text-lg font-bold text-amber-400">{fmtINR(loanSummaries.reduce((s, ls) => s + ls.totalOwed, 0))}</p></CardContent></Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Income vs Expenses Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => CURRENCIES[state.currency].symbol + v} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7' }} formatter={(value: number, name: string) => [fmt(value, state.currency), name]} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Spending Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7' }} formatter={(value: number, name: string) => [fmt(value, state.currency), name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1 text-xs text-zinc-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loanProgressData.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Loan Repayment Progress</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={loanProgressData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => CURRENCIES['INR'].symbol + v} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7' }} formatter={(value: number, name: string) => [fmt(value, 'INR'), name]} />
                  <Bar dataKey="paid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Debt Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {debtSummaries.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No debts</p>
            ) : (
              state.debts.filter((d) => d.currency === state.currency).map((debt, i) => {
                const ds = debtSummaries[i];
                return (
                  <div key={debt.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{debt.person}</p>
                      <p className="text-xs text-zinc-500">Paid {fmtINR(ds.totalPaidINR)} of {fmtINR(debt.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-400">{fmt(ds.remaining, 'INR')} left</p>
                      <p className="text-xs text-zinc-500">{ds.pct}% repaid</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
