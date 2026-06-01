import React, { useState } from 'react';
import { supabase, supabaseClientAvailable, checkSupabaseConnection } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onShowSignup: () => void;
}

export default function LoginPage({ onShowSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!supabaseClientAvailable) {
        throw new Error('Supabase credentials missing. Please check your .env file.');
      }

      const isReachable = await checkSupabaseConnection();
      if (!isReachable) {
        throw new Error('Could not connect to Supabase. Check your internet or ensure your project is not paused.');
      }

      const { error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Load failed' || err.name === 'TypeError') {
        setError('Network error (Load failed). This usually means the browser blocked the request or the Supabase project is unreachable.');
      } else {
        setError(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <Card className="w-full max-w-md hf-card">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="hf-logo-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F6EFD2" strokeWidth="2" width="32" height="32">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-center hf-card-title">Welcome Back</CardTitle>
          <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>Login to sync your finance data</p>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded bg-red-900/20 text-red-400 border border-red-900/50">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="hf-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="hf-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full hf-btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onShowSignup}
                className="text-primary hover:underline"
                style={{ color: 'var(--text)' }}
              >
                Sign up
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
