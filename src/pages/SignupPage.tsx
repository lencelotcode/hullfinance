import React, { useState } from 'react';
import { supabase, supabaseClientAvailable, checkSupabaseConnection } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface SignupPageProps {
  onShowLogin: () => void;
}

export default function SignupPage({ onShowLogin }: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!supabaseClientAvailable) {
        throw new Error('Supabase credentials missing. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
      }

      const isReachable = await checkSupabaseConnection();
      if (!isReachable) {
        throw new Error('Could not connect to Supabase project. Please check your internet connection or ensure your Supabase project is active (not paused).');
      }

      const { error } = await supabase!.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message === 'Load failed' || err.name === 'TypeError') {
        setError('Network error (Load failed). This usually means the browser blocked the request or the Supabase project is unreachable. Check your CORS settings or internet connection.');
      } else {
        setError(err.message || 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <Card className="w-full max-w-md hf-card text-center">
          <CardHeader>
            <CardTitle className="hf-card-title text-2xl">Check your email</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'var(--muted)' }}>
              We've sent a confirmation link to <strong>{email}</strong>. 
              Please verify your email to continue.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={onShowLogin} className="w-full hf-btn-primary">
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl text-center hf-card-title">Create Account</CardTitle>
          <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>Start tracking your finances across devices</p>
        </CardHeader>
        <form onSubmit={handleSignup}>
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onShowLogin}
                className="text-primary hover:underline"
                style={{ color: 'var(--text)' }}
              >
                Login
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
