import { useState } from 'react';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { fmt, fmtGBP, fmtINR, convertINRtoGBP } from '@/lib/finance';
import { ACCOUNT_TYPES, CURRENCIES } from '@/lib/types';
import type { Account, Currency } from '@/lib/types';

const TYPE_ACCENT: Record<string, string> = {
  Current: '#B03030',
  Savings: '#4A7C59',
  'Credit Card': '#9A7A3A',
  Cash: '#5A8FAE',
  Investment: '#7A5FAE',
};

function timeAgo(iso?: string): string {
  if (!iso) return 'Never updated';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Updated ${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`;
}

function BankCard({
  account,
  onEdit,
}: {
  account: Account;
  onEdit: (id: string, balance: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(account.balance));

  const accent = TYPE_ACCENT[account.type] || '#5A8FAE';
  const symbol = CURRENCIES[account.currency].symbol;

  function confirm() {
    const val = parseFloat(editVal);
    if (!isNaN(val)) {
      onEdit(account.id, val);
    }
    setEditing(false);
  }

  function cancel() {
    setEditVal(String(account.balance));
    setEditing(false);
  }

  return (
    <div
      className="bank-card"
      style={{
        width: '280px',
        height: '160px',
        background: '#0D0D0D',
        border: '1px solid #242424',
        borderLeft: `4px solid ${accent}`,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 20px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8E8E8', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            {account.name}
          </div>
          {account.bank && (
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{account.bank}</div>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#888', fontWeight: 500 }}>
          {symbol} {account.currency}
        </div>
      </div>

      <div>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#E8E8E8' }}>{symbol}</span>
            <input
              type="number"
              step="0.01"
              autoFocus
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirm();
                if (e.key === 'Escape') cancel();
              }}
              style={{
                background: '#1A1A1A',
                border: '1px solid #333',
                color: '#E8E8E8',
                fontSize: '22px',
                fontWeight: 700,
                width: '140px',
                padding: '4px 8px',
                outline: 'none',
              }}
            />
            <button onClick={confirm} style={{ background: 'none', border: 'none', color: '#4A7C59', cursor: 'pointer', padding: '4px' }}>
              <Check size={16} />
            </button>
            <button onClick={cancel} style={{ background: 'none', border: 'none', color: '#B03030', cursor: 'pointer', padding: '4px' }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#E8E8E8' }}>
              {fmt(account.balance, account.currency)}
            </div>
            <button
              onClick={() => setEditing(true)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
              title="Edit balance"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>{timeAgo(account.updatedAt)}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#777', fontFamily: 'monospace', letterSpacing: '1px' }}>
          {account.last4 ? `···· ···· ···· ${account.last4}` : ''}
        </div>
        <div style={{ fontSize: '11px', color: '#888', fontWeight: 500 }}>{account.type}</div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { state, dispatch } = useFinance();

  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [type, setType] = useState(ACCOUNT_TYPES[0]);
  const [last4, setLast4] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<Currency>('GBP');

  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editRowVal, setEditRowVal] = useState('');

  const allAccounts = state.accounts;
  const sortedAccounts = [...allAccounts].sort((a, b) => b.balance - a.balance);

  const totalGBP = allAccounts
    .filter((a) => a.currency === 'GBP')
    .reduce((s, a) => s + Number(a.balance), 0);
  const totalINR = allAccounts
    .filter((a) => a.currency === 'INR')
    .reduce((s, a) => s + Number(a.balance), 0);

  const selectedSymbol = CURRENCIES[state.currency].symbol;

  let combinedTotal = 0;
  if (state.currency === 'GBP') {
    combinedTotal = totalGBP + convertINRtoGBP(totalINR, state.exchangeRate);
  } else {
    combinedTotal = totalINR + totalGBP * state.exchangeRate;
  }

  function handleAdd() {
    const val = parseFloat(balance) || 0;
    if (!name.trim()) return alert('Enter account name');
    dispatch({
      type: 'ADD_ACCOUNT',
      payload: {
        name: name.trim(),
        bank: bank.trim() || undefined,
        type,
        last4: last4.trim() || undefined,
        balance: val,
        currency,
        updatedAt: new Date().toISOString(),
      },
    });
    setName('');
    setBank('');
    setType(ACCOUNT_TYPES[0]);
    setLast4('');
    setBalance('');
    setCurrency('GBP');
  }

  function handleCardEdit(id: string, newBalance: number) {
    dispatch({
      type: 'EDIT_ACCOUNT',
      payload: { id, updates: { balance: newBalance, updatedAt: new Date().toISOString() } },
    });
  }

  function startRowEdit(a: Account) {
    setEditRowId(a.id);
    setEditRowVal(String(a.balance));
  }

  function confirmRowEdit(id: string) {
    const val = parseFloat(editRowVal);
    if (!isNaN(val)) {
      dispatch({
        type: 'EDIT_ACCOUNT',
        payload: { id, updates: { balance: val, updatedAt: new Date().toISOString() } },
      });
    }
    setEditRowId(null);
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="hf-stat-grid cols-3" style={{ marginBottom: '24px' }}>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total Balance</span>
            <span className="hf-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5A8FAE" strokeWidth="2" width="16" height="16">
                <rect x="2" y="7" width="20" height="14" rx="0" />
                <path d="M16 3H8L2 7h20l-6-4z" />
              </svg>
            </span>
          </div>
          <div className="hf-stat-value blue">
            {selectedSymbol} {combinedTotal.toLocaleString(CURRENCIES[state.currency].locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total GBP</span>
            <span className="hf-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4A7C59" strokeWidth="2" width="16" height="16">
                <rect x="2" y="7" width="20" height="14" rx="0" />
                <path d="M16 3H8L2 7h20l-6-4z" />
              </svg>
            </span>
          </div>
          <div className="hf-stat-value" style={{ color: '#4A7C59' }}>
            {fmtGBP(totalGBP)}
          </div>
        </div>
        <div className="hf-stat-card">
          <div className="hf-stat-card-header">
            <span className="hf-stat-card-label">Total INR</span>
            <span className="hf-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9A7A3A" strokeWidth="2" width="16" height="16">
                <rect x="2" y="7" width="20" height="14" rx="0" />
                <path d="M16 3H8L2 7h20l-6-4z" />
              </svg>
            </span>
          </div>
          <div className="hf-stat-value" style={{ color: '#9A7A3A' }}>
            {fmtINR(totalINR)}
          </div>
        </div>
      </div>

      {/* Bank Cards Row */}
      {sortedAccounts.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div className="hf-section-title" style={{ marginBottom: '14px' }}>Cards</div>
          <div
            style={{
              display: 'flex',
              gap: '14px',
              overflowX: 'auto',
              paddingBottom: '10px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#333 #0a0a0a',
            }}
          >
            {sortedAccounts.map((a) => (
              <BankCard key={a.id} account={a} onEdit={handleCardEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="hf-panel" style={{ marginBottom: '28px' }}>
        <div className="hf-section-header">
          <span className="hf-section-title">Accounts</span>
          <span className="hf-section-count">
            {sortedAccounts.length} account{sortedAccounts.length !== 1 ? 's' : ''}
          </span>
        </div>
        {sortedAccounts.length === 0 ? (
          <div className="hf-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            No accounts added
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #242424' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontWeight: 500, fontSize: '12px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontWeight: 500, fontSize: '12px' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontWeight: 500, fontSize: '12px' }}>Currency</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#888', fontWeight: 500, fontSize: '12px' }}>Balance</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontWeight: 500, fontSize: '12px' }}>Last Updated</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#888', fontWeight: 500, fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '10px 12px', color: '#E8E8E8' }}>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      {a.bank && <div style={{ fontSize: '11px', color: '#666' }}>{a.bank}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#aaa' }}>{a.type}</td>
                    <td style={{ padding: '10px 12px', color: '#aaa' }}>{a.currency}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {editRowId === a.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            value={editRowVal}
                            onChange={(e) => setEditRowVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmRowEdit(a.id);
                              if (e.key === 'Escape') setEditRowId(null);
                            }}
                            style={{
                              background: '#1A1A1A',
                              border: '1px solid #333',
                              color: '#E8E8E8',
                              fontSize: '13px',
                              width: '100px',
                              padding: '4px 8px',
                              outline: 'none',
                              textAlign: 'right',
                            }}
                          />
                          <button onClick={() => confirmRowEdit(a.id)} style={{ background: 'none', border: 'none', color: '#4A7C59', cursor: 'pointer' }}>
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditRowId(null)} style={{ background: 'none', border: 'none', color: '#B03030', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#E8E8E8', fontWeight: 500 }}>{fmt(a.balance, a.currency)}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#666', fontSize: '12px' }}>{timeAgo(a.updatedAt)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => startRowEdit(a)}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                          title="Edit balance"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="hf-tx-delete"
                          onClick={() => dispatch({ type: 'DELETE_ACCOUNT', payload: a.id })}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Account Form */}
      <div className="hf-panel">
        <div className="hf-section-title" style={{ marginBottom: '16px' }}>Add Account</div>
        <div className="hf-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="hf-form-field">
            <label className="hf-form-label">Account Name</label>
            <input type="text" placeholder="e.g. Barclays Current" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Bank / Institution</label>
            <input type="text" placeholder="Optional" value={bank} onChange={(e) => setBank(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Last 4 digits</label>
            <input type="text" placeholder="4521" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Opening Balance</label>
            <input type="number" placeholder="0.00" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          <div className="hf-form-field">
            <label className="hf-form-label">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>
        <button className="hf-btn" onClick={handleAdd} style={{ marginTop: '12px' }}>
          <Plus size={14} strokeWidth={2.5} />
          Add Account
        </button>
      </div>
    </div>
  );
}
