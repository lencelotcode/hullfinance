import { Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, fmtINR, CURRENCIES } from '@/lib/finance';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { state, totalExpenses, totalIncome, loanSummaries, debtSummaries, catTotals } = useFinance();

  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const trendData = months.map((m) => {
    const inc = state.incomes.filter((i) => i.date.startsWith(m) && i.currency === state.currency).reduce((s, i) => s + Number(i.amount), 0);
    const exp = state.expenses.filter((e) => e.date.startsWith(m) && e.currency === state.currency).reduce((s, e) => s + Number(e.amount), 0);
    return { month: m.slice(5), income: inc, expenses: exp };
  });

  const pieData = Object.entries(catTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const loanProgressData = state.loans
    .filter((l) => l.currency === state.currency)
    .map((l, i) => {
      const s = loanSummaries[i];
      return { name: l.person, borrowed: Number(l.amount), paid: s.totalPaid, remaining: s.totalOwed };
    });

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  return (
    <div>
      {/* Stats */}
      <div className="hf-stat-grid cols-3">
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Income</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A9E6F" strokeWidth="2" width="16" height="16"><path d="M7 3l-4 4 4 4"/><path d="M3 7h18"/></svg></span></div>
          <div className="hf-stat-value green">{fmt(totalIncome, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Expenses</span><span className="hf-stat-icon"><Plus size={16} style={{ color: '#B03030', transform: 'rotate(45deg)' }} /></span></div>
          <div className="hf-stat-value red">{fmt(totalExpenses, state.currency)}</div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header"><span className="hf-stat-card-label">Savings Rate</span><span className="hf-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span></div>
          <div className={`hf-stat-value ${savingsRate >= 0 ? 'green' : 'red'}`}>{savingsRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="hf-two-col" style={{ marginBottom: '20px' }}>
        <div className="hf-panel">
          <div className="hf-section-title" style={{ marginBottom: '16px' }}>Monthly Cash Flow</div>
          <div className="hf-chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #242424', borderRadius: 0, color: '#F6EFD2', fontFamily: 'var(--font-mono)', fontSize: '12px' }} formatter={(value: number, name: string) => [fmt(value, state.currency), name]} />
                <Bar dataKey="income" fill="#4A7C59" radius={[0, 0, 0, 0]} />
                <Bar dataKey="expenses" fill="#B03030" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hf-panel">
          <div className="hf-section-title" style={{ marginBottom: '16px' }}>Spending by Category</div>
          <div className="hf-progress-row">
            {pieData.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '20px 0' }}>No expense data this month</div>
            ) : (
              pieData.map((entry, i) => {
                const pct = totalExpenses > 0 ? (entry.value / totalExpenses * 100) : 0;
                const colors = ['red', 'amber', 'green', 'blue'];
                return (
                  <div key={entry.name} className="hf-progress-item">
                    <div className="hf-progress-label-row">
                      <span className="hf-progress-name">{entry.name}</span>
                      <span className="hf-progress-pct">{fmt(entry.value, state.currency)} · {pct.toFixed(1)}%</span>
                    </div>
                    <div className="hf-progress-bar-bg">
                      <div className={`hf-progress-bar-fill ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="hf-panel" style={{ marginBottom: '20px' }}>
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Last 6 Months — Income vs Expenses</div>
        <div className="hf-chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <XAxis dataKey="month" tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => CURRENCIES[state.currency].symbol + v} />
              <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #242424', borderRadius: 0, color: '#F6EFD2', fontFamily: 'var(--font-mono)', fontSize: '12px' }} formatter={(value: number, name: string) => [fmt(value, state.currency), name]} />
              <Bar dataKey="income" fill="#4A7C59" radius={[0, 0, 0, 0]} />
              <Bar dataKey="expenses" fill="#B03030" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Loan Progress */}
      {loanProgressData.length > 0 && (
        <div className="hf-panel" style={{ marginBottom: '20px' }}>
          <div className="hf-section-title" style={{ marginBottom: '16px' }}>Loan Repayment Progress</div>
          <div className="hf-chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={loanProgressData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '₹' + v} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #242424', borderRadius: 0, color: '#F6EFD2', fontFamily: 'var(--font-mono)', fontSize: '12px' }} formatter={(value: number, name: string) => [fmt(value, 'INR'), name]} />
                <Bar dataKey="paid" stackId="a" fill="#4A7C59" radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining" stackId="a" fill="#B03030" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Debt Summary */}
      <div className="hf-panel">
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Debt Summary</div>
        {debtSummaries.length === 0 ? (
          <div className="hf-empty">No debts</div>
        ) : (
          state.debts.filter((d) => d.currency === state.currency).map((debt, i) => {
            const ds = debtSummaries[i];
            return (
              <div key={debt.id} className="hf-tx-item">
                <div className="hf-tx-info">
                  <div className="hf-tx-name">{debt.person}</div>
                  <div className="hf-tx-meta">Paid {fmtINR(ds.totalPaidINR)} of {fmtINR(debt.amount)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#C9973A' }}>{fmt(ds.remaining, 'INR')} left</div>
                  <div className="hf-tx-meta">{ds.pct}% repaid</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
