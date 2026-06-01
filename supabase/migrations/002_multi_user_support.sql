-- Update tables to support multi-user auth

-- Add user_id column to all tables
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE loans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE debts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE repayments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE utilizations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE bills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Drop old policies
DROP POLICY IF EXISTS "Allow all operations on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all operations on incomes" ON incomes;
DROP POLICY IF EXISTS "Allow all operations on loans" ON loans;
DROP POLICY IF EXISTS "Allow all operations on repayments" ON repayments;
DROP POLICY IF EXISTS "Allow all operations on utilizations" ON utilizations;
DROP POLICY IF EXISTS "Allow all operations on debts" ON debts;
DROP POLICY IF EXISTS "Allow all operations on accounts" ON accounts;
DROP POLICY IF EXISTS "Allow all operations on bills" ON bills;
DROP POLICY IF EXISTS "Allow all operations on budgets" ON budgets;
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;

-- Create new RLS policies for user-specific access
CREATE POLICY "Users can only access their own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own incomes" ON incomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own loans" ON loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own repayments" ON repayments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own utilizations" ON utilizations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own debts" ON debts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own bills" ON bills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own settings" ON settings FOR ALL USING (auth.uid() = user_id);

-- Update settings table to use user_id as part of primary key
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (user_id);
