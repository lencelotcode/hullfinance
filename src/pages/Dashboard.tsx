import React from 'react';
import { ArrowDownRight, ArrowUpRight, Wallet, PiggyBank, CreditCard, Receipt, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, monthLabel } from '@/lib/finance';
import { categoryEmoji } from '@/lib/emojis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatCard({ label, value, colorClass, icon: Icon, iconColor }: {
  label: string;
  value: string;
  colorClass: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="hf-stat-card">
      <div className="hf-stat-card-header">
        <span className="hf-stat-card-label">{label}</span>
        <span className="hf-stat-icon">
          <Icon size={16} style={{ color: iconColor }} />
        </span>
      </div>
      <div className={`hf-stat-value ${colorClass}`}>{value}</div>
    </div>
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

  const recentExp = [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const recentInc = [...filteredIncomes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div>
      {/* Top Stats */}
      <div className="hf-stat-grid">
        <StatCard label="Income" value={`+${fmt(totalIncome, state.currency)}`} colorClass="green" icon={ArrowUpRight} iconColor="#5A9E6F" />
        <StatCard label="Expenses" value={`-${fmt(totalExpenses, state.currency)}`} colorClass="red" icon={ArrowDownRight} iconColor="#B03030" />
        <StatCard label="Net" value={`${netBalance >= 0 ? '+' : '-'}${fmt(Math.abs(netBalance), state.currency)}`} colorClass={netBalance >= 0 ? 'green' : 'red'} icon={Wallet} iconColor={netBalance >= 0 ? '#5A9E6F' : '#B03030'} />
        <StatCard label="Accounts" value={fmt(totalAccountBalance, state.currency)} colorClass="blue" icon={PiggyBank} iconColor="#5A8FAE" />
      </div>

      {/* Secondary Stats */}
      <div className="hf-stat-grid cols-3 hf-stat-grid-last">
        <StatCard label="Loan Outstanding" value={fmt(totalLoanOwed, 'INR')} colorClass="amber" icon={CreditCard} iconColor="#C9973A" />
        <StatCard label="Debt Owed to Me" value={fmt(totalDebtOwed, 'INR')} colorClass="amber" icon={Receipt} iconColor="#C9973A" />
        <StatCard label="Upcoming Bills" value={fmt(upcomingBillsTotal, state.currency)} colorClass="red" icon={AlertTriangle} iconColor="#B03030" />
      </div>

      {/* Two Column: Recent Expenses & Income */}
      <div className="hf-two-col" style={{ marginTop: '20px' }}>
        <div className="hf-panel">
          <div className="hf-section-header">
            <span className="hf-section-title">Recent Expenses</span>
            <span className="hf-section-count">{filteredExpenses.length} this month</span>
          </div>
          <div className="hf-tx-list">
            {recentExp.length === 0 ? (
              <div className="hf-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                No expenses this month
              </div>
            ) : (
              recentExp.map((e) => (
                <div key={e.id} className="hf-tx-item">
                  <div className="hf-tx-icon">{categoryEmoji(e.category)}</div>
                  <div className="hf-tx-info">
                    <div className="hf-tx-name">{e.note || e.category}</div>
                    <div className="hf-tx-meta">{e.date}{e.source ? ' · ' + e.source : ''}{e.note ? ' · ' + e.note : ''}</div>
                  </div>
                  <span className="hf-tx-amount expense">-{fmt(e.amount, state.currency)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hf-panel">
          <div className="hf-section-header">
            <span className="hf-section-title">Recent Income</span>
            <span className="hf-section-count">{filteredIncomes.length} this month</span>
          </div>
          <div className="hf-tx-list">
            {recentInc.length === 0 ? (
              <div className="hf-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                No income this month
              </div>
            ) : (
              recentInc.map((i) => (
                <div key={i.id} className="hf-tx-item">
                  <div className="hf-tx-icon">{categoryEmoji(i.category)}</div>
                  <div className="hf-tx-info">
                    <div className="hf-tx-name">{i.note || i.category}</div>
                    <div className="hf-tx-meta">{i.date}</div>
                  </div>
                  <span className="hf-tx-amount income">+{fmt(i.amount, state.currency)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Chart */}
      {chartData.length > 0 && (
        <div className="hf-panel" style={{ marginTop: '20px' }}>
          <div className="hf-section-title" style={{ marginBottom: '16px' }}>Spending by Category — {monthLabel(state.filterMonth)}</div>
          <div className="hf-chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5A5A5A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181818', border: '1px solid #242424', borderRadius: 0, color: '#F6EFD2', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  formatter={(value: number) => [fmt(value, state.currency), '']}
                />
                <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
