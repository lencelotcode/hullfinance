import React, { useState, useRef } from 'react';
import { Trash2, Download, Upload, Plus, X, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { exportState, importState } from '@/lib/data';
import { EXPENSE_CATS, INCOME_CATS } from '@/lib/types';

export default function SettingsPage() {
  const { state, dispatch } = useFinance();
  const [rate, setRate] = useState(String(state.exchangeRate));
  const [rateUSD, setRateUSD] = useState(String(state.exchangeRateUSD || 83));
  const [importText, setImportText] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  function handleCSVExport() {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Note', 'Source'];
    const rows: any[][] = [];
    
    state.expenses.forEach(e => {
      rows.push([e.date, 'Expense', e.category, e.amount, e.currency, e.note || '', e.source || '']);
    });
    state.incomes.forEach(i => {
      rows.push([i.date, 'Income', i.category, i.amount, i.currency, i.note || '', '']);
    });
    
    const csvContent = [headers, ...rows].map((r: any[]) => r.map((c: any) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = 'hull-finance-export-' + dateStr + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCSVFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return alert('Invalid CSV file');
      
      if (!confirm('Importing CSV will add these records to your current data. Continue?')) return;
      
      lines.slice(1).forEach(line => {
        const match = line.match(/("([^"]*)"|[^,]+)/g);
        if (!match) return;
        const parts = match.map((p: string) => p.startsWith('"') ? p.slice(1, -1).replace(/""/g, '"') : p);
        if (parts.length < 5) return;
        
        const [date, type, category, amount, currency, note, source] = parts;
        const val = parseFloat(amount);
        if (isNaN(val)) return;
        
        if (type.toLowerCase() === 'expense') {
          dispatch({ type: 'ADD_EXPENSE', payload: { amount: val, category, date, note: note || '', currency: (currency || 'INR') as any, source: source || 'Owned Money' } });
        } else {
          dispatch({ type: 'ADD_INCOME', payload: { amount: val, category, date, note: note || '', currency: (currency || 'INR') as any } });
        }
      });
      alert('CSV data imported successfully');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleExport() {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hull-finance-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const data = importState(importText);
    if (!data) return alert('Invalid JSON data');
    if (!confirm('This will replace all current data. Continue?')) return;
    dispatch({ type: 'LOAD_STATE', payload: data });
    setImportText('');
    alert('Data imported successfully');
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const data = importState(text);
      if (!data) return alert('Invalid backup file');
      if (!confirm('This will replace all current data. Continue?')) return;
      dispatch({ type: 'LOAD_STATE', payload: data });
      alert('Backup restored successfully');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div style={{ maxWidth: '720px' }} className='hf-page-enter'>
      {/* Currency & Exchange Rate */}
      <div className='hf-panel' style={{ marginBottom: '20px' }}>
        <div className='hf-section-title' style={{ marginBottom: '16px' }}>Currency & Exchange Rate</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Currency</div>
            <div className='hf-tx-meta'>Display currency for transactions</div>
          </div>
          <div className='hf-currency-toggle' style={{ display: 'flex', border: '1px solid var(--border2)', overflow: 'hidden' }}>
            <button className={'hf-currency-btn ' + (state.currency === 'GBP' ? 'active' : '')} onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'GBP' })}>£ GBP</button>
            <button className={'hf-currency-btn ' + (state.currency === 'INR' ? 'active' : '')} onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'INR' })}>₹ INR</button>
            <button className={'hf-currency-btn ' + (state.currency === 'USD' ? 'active' : '')} onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'USD' })}>$ USD</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>1 GBP =</span>
          <input type='number' value={rate} onChange={(e) => setRate(e.target.value)} min='1' step='0.01' style={{ width: '80px' }} />
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>INR</span>
          <button className='hf-btn' style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => {
            const r = parseFloat(rate);
            if (r > 0) dispatch({ type: 'SET_EXCHANGE_RATE', payload: r });
          }}>Update</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>1 USD =</span>
          <input type='number' value={rateUSD} onChange={(e) => setRateUSD(e.target.value)} min='1' step='0.01' style={{ width: '80px' }} />
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>INR</span>
          <button className='hf-btn' style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => {
            const r = parseFloat(rateUSD);
            if (r > 0) dispatch({ type: 'SET_EXCHANGE_RATE_USD', payload: r });
          }}>Update</button>
        </div>
      </div>

      {/* Manage Categories */}
      <div className='hf-panel' style={{ marginBottom: '20px' }}>
        <div className='hf-section-title' style={{ marginBottom: '16px' }}>Manage Categories</div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>Expense Categories</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {EXPENSE_CATS.map((cat) => (
              <span key={cat} className='hf-tag hf-tag-neutral'>{cat}</span>
            ))}
            {state.customExpenseCategories.map((cat) => (
              <span key={cat} className='hf-tag hf-tag-neutral' style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {cat}
                <button onClick={() => dispatch({ type: 'DELETE_EXPENSE_CATEGORY', payload: cat })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder='New category name...' value={newExpenseCat} onChange={(e) => setNewExpenseCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newExpenseCat.trim()) { dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: newExpenseCat.trim() }); setNewExpenseCat(''); } }}
              style={{ flex: 1 }} />
            <button className='hf-btn' style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => { if (newExpenseCat.trim()) { dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: newExpenseCat.trim() }); setNewExpenseCat(''); } }}>
              <Plus size={12} /> Add
            </button>
          </div>
        </div>

        <div className='hf-divider' />

        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>Income Categories</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {INCOME_CATS.map((cat) => (
              <span key={cat} className='hf-tag hf-tag-neutral'>{cat}</span>
            ))}
            {state.customIncomeCategories.map((cat) => (
              <span key={cat} className='hf-tag hf-tag-neutral' style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {cat}
                <button onClick={() => dispatch({ type: 'DELETE_INCOME_CATEGORY', payload: cat })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder='New category name...' value={newIncomeCat} onChange={(e) => setNewIncomeCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newIncomeCat.trim()) { dispatch({ type: 'ADD_INCOME_CATEGORY', payload: newIncomeCat.trim() }); setNewIncomeCat(''); } }}
              style={{ flex: 1 }} />
            <button className='hf-btn' style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => { if (newIncomeCat.trim()) { dispatch({ type: 'ADD_INCOME_CATEGORY', payload: newIncomeCat.trim() }); setNewIncomeCat(''); } }}>
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* CSV Export & Import */}
      <div className='hf-panel' style={{ marginBottom: '20px' }}>
        <div className='hf-section-title' style={{ marginBottom: '16px' }}>CSV Export & Import</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className='hf-btn' onClick={handleCSVExport}><Download size={14} /> Export CSV</button>
          <button className='hf-btn-ghost' style={{ padding: '8px 14px' }} onClick={() => csvInputRef.current?.click()}><Upload size={12} /> Import CSV</button>
          <input ref={csvInputRef} type='file' accept='.csv' style={{ display: 'none' }} onChange={handleCSVFileUpload} />
        </div>
        <div className='hf-tx-meta' style={{ marginTop: '12px' }}>
          Export your data for Excel/Google Sheets, or import records from a standardized CSV file.
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className='hf-panel' style={{ marginBottom: '20px' }}>
        <div className='hf-section-title' style={{ marginBottom: '16px' }}>Data Backup & Restore</div>

        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '12px', marginBottom: '16px' }}>
          <div className='hf-tx-meta' style={{ marginBottom: '8px' }}>Current Data Summary:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--muted)' }}>Expenses:</span><span style={{ color: 'var(--text)' }}>{state.expenses.length} records</span>
            <span style={{ color: 'var(--muted)' }}>Income:</span><span style={{ color: 'var(--text)' }}>{state.incomes.length} records</span>
            <span style={{ color: 'var(--muted)' }}>Loans:</span><span style={{ color: 'var(--text)' }}>{state.loans.length} records</span>
            <span style={{ color: 'var(--muted)' }}>Debts:</span><span style={{ color: 'var(--text)' }}>{state.debts.length} records</span>
            <span style={{ color: 'var(--muted)' }}>Accounts:</span><span style={{ color: 'var(--text)' }}>{state.accounts.length} records</span>
            <span style={{ color: 'var(--muted)' }}>Bills:</span><span style={{ color: 'var(--text)' }}>{state.bills.length} records</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Export Data</div>
          <div className='hf-tx-meta' style={{ marginBottom: '8px' }}>Download all your data as a JSON backup file.</div>
          <button className='hf-btn' onClick={handleExport}><Download size={14} /> Download Backup</button>
        </div>

        <div className='hf-divider' />

        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Import Data</div>
          <div className='hf-tx-meta' style={{ marginBottom: '8px' }}>Paste JSON data or upload a backup file.</div>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='Paste JSON data here...'
            style={{ width: '100%', height: '96px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '12px', resize: 'none', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className='hf-btn' style={{ fontSize: '12px' }} disabled={!importText.trim()} onClick={handleImport}><Upload size={12} /> Import JSON</button>
            <button className='hf-btn-ghost' style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => fileInputRef.current?.click()}><Upload size={12} /> Upload File</button>
            <input ref={fileInputRef} type='file' accept='.json' style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className='hf-panel' style={{ border: '1px solid rgba(176,48,48,0.3)' }}>
        <div className='hf-section-title' style={{ marginBottom: '16px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> Danger Zone
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Reset All Data</div>
            <div className='hf-tx-meta'>This will permanently delete everything.</div>
          </div>
          <button className={'hf-btn-ghost ' + (showReset ? 'active' : '')} style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setShowReset(!showReset)}>
            {showReset ? 'Cancel' : 'Enable'}
          </button>
        </div>
        {showReset && (
          <button className='hf-btn-danger' style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
            if (confirm('Are you sure? This will delete ALL your data permanently.')) {
              dispatch({ type: 'RESET_STATE' });
              setShowReset(false);
            }
          }}><Trash2 size={14} /> Reset Everything</button>
        )}
      </div>
    </div>
  );
}
