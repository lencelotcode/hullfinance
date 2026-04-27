import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Calculator, Send, TrendingUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

// Tax rates for 2025/26
const TAX_RATES = {
  personalAllowance: 12570,
  basicRateThreshold: 50270,
  basicRate: 0.20,
  niEmployed: 0.08,
  niSelfEmployed: 0.06,
  studentLoan: {
    plan1: { threshold: 24990, rate: 0.09 },
    plan2: { threshold: 27295, rate: 0.09 },
    postgrad: { threshold: 21000, rate: 0.06 },
  }
};

export default function TaxPage() {
  const { state, dispatch } = useFinance();
  
  // Calculate total annual income from Income tab
  const totalAnnualIncome = state.incomes.reduce((sum, inc) => sum + inc.amount, 0) * 12;
  
  const [taxConfig, setTaxConfig] = useState({
    annualIncome: totalAnnualIncome || 0,
    employmentType: 'employed' as 'employed' | 'self-employed',
    studentLoan: 'none' as 'none' | 'plan1' | 'plan2' | 'postgrad',
    taxYear: '2025/26'
  });
  
  const [newRemittance, setNewRemittance] = useState({
    date: new Date().toISOString().slice(0, 10),
    amountGBP: 0,
    platform: 'wise',
    rate: state.exchangeRate,
    fee: 0,
    note: ''
  });

  // Tax Calculations
  const grossIncome = taxConfig.annualIncome;
  const personalAllowance = TAX_RATES.personalAllowance;
  const taxableIncome = Math.max(0, grossIncome - personalAllowance);
  const incomeTax = taxableIncome > 0 ? Math.min(taxableIncome, TAX_RATES.basicRateThreshold - personalAllowance) * TAX_RATES.basicRate : 0;
  
  const niRate = taxConfig.employmentType === 'employed' ? TAX_RATES.niEmployed : TAX_RATES.niSelfEmployed;
  const niEarnings = Math.max(0, Math.min(grossIncome, TAX_RATES.basicRateThreshold) - personalAllowance);
  const niContributions = niEarnings * niRate;
  
  let studentLoanRepayment = 0;
  if (taxConfig.studentLoan !== 'none') {
    const loanConfig = TAX_RATES.studentLoan[taxConfig.studentLoan];
    const eligibleEarnings = Math.max(0, grossIncome - loanConfig.threshold);
    studentLoanRepayment = eligibleEarnings * loanConfig.rate;
  }
  
  const totalDeductions = incomeTax + niContributions + studentLoanRepayment;
  const takeHome = grossIncome - totalDeductions;
  const effectiveTaxRate = grossIncome > 0 ? (totalDeductions / grossIncome) * 100 : 0;

  // Remittance calculations
  const remittances = state.remittances || [];
  const totalSentGBP = remittances.reduce((sum, r) => sum + r.amountGBP, 0);
  const totalFees = remittances.reduce((sum, r) => sum + r.fee, 0);
  const totalINRReceived = remittances.reduce((sum, r) => sum + r.inrReceived, 0);
  const averageRate = remittances.length > 0 
    ? remittances.reduce((sum, r) => sum + r.rate, 0) / remittances.length 
    : 0;

  const netDisposable = takeHome - totalSentGBP;

  const addRemittance = () => {
    if (newRemittance.amountGBP <= 0) return;
    
    const remittance = {
      id: Date.now().toString(),
      ...newRemittance,
      inrReceived: newRemittance.amountGBP * newRemittance.rate
    };
    
    dispatch({ type: 'ADD_REMITTANCE', payload: remittance });
    setNewRemittance({
      date: new Date().toISOString().slice(0, 10),
      amountGBP: 0,
      platform: 'wise',
      rate: state.exchangeRate,
      fee: 0,
      note: ''
    });
  };

  const deleteRemittance = (id: string) => {
    dispatch({ type: 'DELETE_REMITTANCE', payload: id });
  };

  const formatGBP = (val: number) => `£${val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* Section 1: UK Income Tax Calculator */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calculator size={20} />
          UK Income Tax Calculator
        </h2>
        
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label>Annual Part-time Income (£)</Label>
              <Input 
                type="number" 
                value={taxConfig.annualIncome}
                onChange={(e) => setTaxConfig({...taxConfig, annualIncome: Number(e.target.value)})}
                placeholder="Enter annual income"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-calculated from Income tab: {formatGBP(totalAnnualIncome)}
              </p>
            </div>
            
            <div>
              <Label>Tax Year</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={taxConfig.taxYear}
                onChange={(e) => setTaxConfig({...taxConfig, taxYear: e.target.value})}
              >
                <option value="2024/25">2024/25</option>
                <option value="2025/26">2025/26</option>
              </select>
            </div>
            
            <div>
              <Label>Employment Type</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="employment"
                    checked={taxConfig.employmentType === 'employed'}
                    onChange={() => setTaxConfig({...taxConfig, employmentType: 'employed'})}
                  />
                  Employed
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="employment"
                    checked={taxConfig.employmentType === 'self-employed'}
                    onChange={() => setTaxConfig({...taxConfig, employmentType: 'self-employed'})}
                  />
                  Self-Employed
                </label>
              </div>
            </div>
            
            <div>
              <Label>Student Loan</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={taxConfig.studentLoan}
                onChange={(e) => setTaxConfig({...taxConfig, studentLoan: e.target.value as any})}
              >
                <option value="none">None</option>
                <option value="plan1">Plan 1</option>
                <option value="plan2">Plan 2</option>
                <option value="postgrad">Postgraduate</option>
              </select>
            </div>
          </div>
          
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between py-1">
              <span>Gross Income</span>
              <span className="font-medium">{formatGBP(grossIncome)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Personal Allowance</span>
              <span className="font-medium text-green-600">- {formatGBP(personalAllowance)}</span>
            </div>
            <div className="flex justify-between py-1 border-t pt-2 font-medium">
              <span>Taxable Income</span>
              <span>{formatGBP(taxableIncome)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Income Tax (20%)</span>
              <span className="text-red-500">- {formatGBP(incomeTax)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>NI Contributions</span>
              <span className="text-red-500">- {formatGBP(niContributions)}</span>
            </div>
            {studentLoanRepayment > 0 && (
              <div className="flex justify-between py-1">
                <span>Student Loan</span>
                <span className="text-red-500">- {formatGBP(studentLoanRepayment)}</span>
              </div>
            )}
            <div className="border-t-2 pt-2 mt-2">
              <div className="flex justify-between py-1 font-bold text-lg">
                <span>Take-Home</span>
                <span className="text-green-600">{formatGBP(takeHome)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span>Effective Tax Rate</span>
                <span>{effectiveTaxRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Section 2: India Remittance Tracker */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Send size={20} />
          India Remittance Tracker
        </h2>
        
        <Card className="p-6 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <div>
              <Label>Date</Label>
              <Input 
                type="date"
                value={newRemittance.date}
                onChange={(e) => setNewRemittance({...newRemittance, date: e.target.value})}
              />
            </div>
            <div>
              <Label>Amount (£)</Label>
              <Input 
                type="number"
                value={newRemittance.amountGBP || ''}
                onChange={(e) => setNewRemittance({...newRemittance, amountGBP: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Platform</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={newRemittance.platform}
                onChange={(e) => setNewRemittance({...newRemittance, platform: e.target.value})}
              >
                <option value="wise">Wise</option>
                <option value="sbi">SBI</option>
                <option value="westernunion">Western Union</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Rate</Label>
              <Input 
                type="number"
                step="0.01"
                value={newRemittance.rate}
                onChange={(e) => setNewRemittance({...newRemittance, rate: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label>Fee (£)</Label>
              <Input 
                type="number"
                step="0.01"
                value={newRemittance.fee || ''}
                onChange={(e) => setNewRemittance({...newRemittance, fee: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addRemittance} className="w-full">
                Add Transfer
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Total Sent</div>
              <div className="text-lg font-bold">{formatGBP(totalSentGBP)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Total INR Received</div>
              <div className="text-lg font-bold">{formatINR(totalINRReceived)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Average Rate</div>
              <div className="text-lg font-bold">{averageRate.toFixed(2)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Total Fees</div>
              <div className="text-lg font-bold">{formatGBP(totalFees)}</div>
            </Card>
          </div>

          {/* Remittance Table */}
          {remittances.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Platform</th>
                    <th className="text-right py-2">Sent £</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Fee</th>
                    <th className="text-right py-2">INR Received</th>
                    <th className="text-left py-2">Note</th>
                    <th className="text-center py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {remittances.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2">{r.date}</td>
                      <td className="py-2 capitalize">{r.platform}</td>
                      <td className="py-2 text-right">{formatGBP(r.amountGBP)}</td>
                      <td className="py-2 text-right">{r.rate.toFixed(2)}</td>
                      <td className="py-2 text-right">{formatGBP(r.fee)}</td>
                      <td className="py-2 text-right font-medium">{formatINR(r.inrReceived)}</td>
                      <td className="py-2 text-muted-foreground">{r.note}</td>
                      <td className="py-2 text-center">
                        <button 
                          onClick={() => deleteRemittance(r.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* Section 3: Tax Estimate vs Remittance */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Tax Estimate vs Remittance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Estimated Annual Tax Liability</h3>
            <div className="text-3xl font-bold text-red-500">{formatGBP(totalDeductions)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total tax + NI + student loan deductions
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Sent to India (This Year)</h3>
            <div className="text-3xl font-bold text-blue-600">{formatGBP(totalSentGBP)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total remittances transferred
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Net Disposable Income</h3>
          <div className="text-3xl font-bold">{formatGBP(netDisposable)}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Take home pay after tax and remittances
          </p>
        </Card>
      </section>
    </div>
  );
}
