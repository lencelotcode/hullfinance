import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFinance } from '@/context/FinanceContext';
import { exportState, importState } from '@/lib/data';
import { Download, Upload, Trash2, AlertTriangle, Plus, X } from 'lucide-react';
import { EXPENSE_CATS, INCOME_CATS } from '@/lib/types';

export default function SettingsPage() {
  const { state, dispatch } = useFinance();
  const [rate, setRate] = useState(String(state.exchangeRate));
  const [importText, setImportText] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hull-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Currency & Exchange Rate</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Currency</p>
              <p className="text-xs text-zinc-500">Display currency for transactions</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className={`rounded-full text-xs ${state.currency === 'GBP' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`} onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'GBP' })}>£ GBP</Button>
              <Button size="sm" className={`rounded-full text-xs ${state.currency === 'INR' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`} onClick={() => dispatch({ type: 'SET_CURRENCY', payload: 'INR' })}>₹ INR</Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-zinc-400 shrink-0">1 GBP =</Label>
            <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} min="1" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-200 w-28" />
            <Label className="text-sm text-zinc-400">INR</Label>
            <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full text-xs" onClick={() => {
              const r = parseFloat(rate);
              if (r > 0) dispatch({ type: 'SET_EXCHANGE_RATE', payload: r });
            }}>Update</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Manage Categories</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-zinc-200 mb-2">Expense Categories</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {EXPENSE_CATS.map((cat) => (
                <Badge key={cat} variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                  {cat}
                </Badge>
              ))}
              {state.customExpenseCategories.map((cat) => (
                <Badge key={cat} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  {cat}
                  <button
                    onClick={() => dispatch({ type: 'DELETE_EXPENSE_CATEGORY', payload: cat })}
                    className="ml-2 hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newExpenseCat}
                onChange={(e) => setNewExpenseCat(e.target.value)}
                placeholder="New category name..."
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newExpenseCat.trim()) {
                    dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: newExpenseCat.trim() });
                    setNewExpenseCat('');
                  }
                }}
              />
              <Button
                size="sm"
                className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"
                onClick={() => {
                  if (newExpenseCat.trim()) {
                    dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: newExpenseCat.trim() });
                    setNewExpenseCat('');
                  }
                }}
              >
                <Plus size={14} className="mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <p className="text-sm font-medium text-zinc-200 mb-2">Income Categories</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {INCOME_CATS.map((cat) => (
                <Badge key={cat} variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                  {cat}
                </Badge>
              ))}
              {state.customIncomeCategories.map((cat) => (
                <Badge key={cat} variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {cat}
                  <button
                    onClick={() => dispatch({ type: 'DELETE_INCOME_CATEGORY', payload: cat })}
                    className="ml-2 hover:text-emerald-300"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newIncomeCat}
                onChange={(e) => setNewIncomeCat(e.target.value)}
                placeholder="New category name..."
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newIncomeCat.trim()) {
                    dispatch({ type: 'ADD_INCOME_CATEGORY', payload: newIncomeCat.trim() });
                    setNewIncomeCat('');
                  }
                }}
              />
              <Button
                size="sm"
                className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"
                onClick={() => {
                  if (newIncomeCat.trim()) {
                    dispatch({ type: 'ADD_INCOME_CATEGORY', payload: newIncomeCat.trim() });
                    setNewIncomeCat('');
                  }
                }}
              >
                <Plus size={14} className="mr-1" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-200">Data Backup & Restore</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-zinc-400 mb-2">Current Data Summary:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-zinc-500">Expenses:</span>
              <span className="text-zinc-300">{state.expenses.length} records</span>
              <span className="text-zinc-500">Income:</span>
              <span className="text-zinc-300">{state.incomes.length} records</span>
              <span className="text-zinc-500">Loans:</span>
              <span className="text-zinc-300">{state.loans.length} records</span>
              <span className="text-zinc-500">Debts:</span>
              <span className="text-zinc-300">{state.debts.length} records</span>
              <span className="text-zinc-500">Accounts:</span>
              <span className="text-zinc-300">{state.accounts.length} records</span>
              <span className="text-zinc-500">Bills:</span>
              <span className="text-zinc-300">{state.bills.length} records</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200 mb-2">Export Data</p>
            <p className="text-xs text-zinc-500 mb-3">Download all your data as a JSON backup file.</p>
            <Button onClick={handleExport} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full"><Download size={16} className="mr-2" /> Download Backup</Button>
          </div>
          <div className="border-t border-zinc-800 pt-4">
            <p className="text-sm font-medium text-zinc-200 mb-2">Import Data</p>
            <p className="text-xs text-zinc-500 mb-3">Paste JSON data or upload a backup file.</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON data here..."
              className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 font-mono resize-none focus:outline-none focus:border-zinc-500"
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleImport} disabled={!importText.trim()} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full text-xs"><Upload size={14} className="mr-1" /> Import JSON</Button>
              <Button onClick={() => fileInputRef.current?.click()} className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded-full text-xs border border-zinc-700"><Upload size={14} className="mr-1" /> Upload File</Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 border-red-500/30">
        <CardHeader><CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2"><AlertTriangle size={16} /> Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Reset All Data</p>
              <p className="text-xs text-zinc-500">This will permanently delete everything.</p>
            </div>
            <Switch checked={showReset} onCheckedChange={setShowReset} />
          </div>
          {showReset && (
            <Button variant="destructive" className="w-full" onClick={() => {
              if (confirm('Are you sure? This will delete ALL your data permanently.')) {
                dispatch({ type: 'RESET_STATE' });
                setShowReset(false);
              }
            }}><Trash2 size={16} className="mr-2" /> Reset Everything</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
