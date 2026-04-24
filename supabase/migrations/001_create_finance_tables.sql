-- Create tables for Hull Finance app

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  currency TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  currency TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  person TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  currency TEXT NOT NULL,
  interestRate NUMERIC DEFAULT 0,
  interestType TEXT DEFAULT 'simple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debts table
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  person TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  currency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loan repayments table
CREATE TABLE IF NOT EXISTS repayments (
  id TEXT PRIMARY KEY,
  gbpAmount NUMERIC NOT NULL,
  inrAmount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  loan_id TEXT REFERENCES loans(id) ON DELETE CASCADE,
  debt_id TEXT REFERENCES debts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loan utilizations table
CREATE TABLE IF NOT EXISTS utilizations (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  gbpAmount NUMERIC NOT NULL,
  inrAmount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  loan_id TEXT REFERENCES loans(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  dueDate TEXT NOT NULL,
  frequency TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL,
  paidDate TEXT,
  currency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  budget_limit NUMERIC NOT NULL,
  month TEXT NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (single row for app settings)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  filterMonth TEXT NOT NULL,
  currency TEXT NOT NULL,
  exchangeRate NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_currency ON incomes(currency);
CREATE INDEX IF NOT EXISTS idx_loans_date ON loans(date);
CREATE INDEX IF NOT EXISTS idx_loans_currency ON loans(currency);
CREATE INDEX IF NOT EXISTS idx_debts_date ON debts(date);
CREATE INDEX IF NOT EXISTS idx_debts_currency ON debts(currency);
CREATE INDEX IF NOT EXISTS idx_bills_dueDate ON bills(dueDate);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_debt_id ON repayments(debt_id);
CREATE INDEX IF NOT EXISTS idx_utilizations_loan_id ON utilizations(loan_id);

-- Enable Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (if using auth)
-- For now, allow all operations (you can restrict later with authentication)
CREATE POLICY "Allow all operations on expenses" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow all operations on incomes" ON incomes FOR ALL USING (true);
CREATE POLICY "Allow all operations on loans" ON loans FOR ALL USING (true);
CREATE POLICY "Allow all operations on repayments" ON repayments FOR ALL USING (true);
CREATE POLICY "Allow all operations on utilizations" ON utilizations FOR ALL USING (true);
CREATE POLICY "Allow all operations on debts" ON debts FOR ALL USING (true);
CREATE POLICY "Allow all operations on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON bills FOR ALL USING (true);
CREATE POLICY "Allow all operations on budgets" ON budgets FOR ALL USING (true);
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true);

-- Insert default settings
INSERT INTO settings (id, filterMonth, currency, exchangeRate)
VALUES ('app_settings', TO_CHAR(NOW(), 'YYYY-MM'), 'INR', 110)
ON CONFLICT (id) DO NOTHING;
