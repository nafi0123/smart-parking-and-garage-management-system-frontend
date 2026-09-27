'use client';

import Link from 'next/link';
import type React from 'react';
import { useEffect, useState } from 'react';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { AuthService } from '@/services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      window.location.href = '/dashboard';
    }
  }, []);

  function saveAuthSession(accessToken: string, user: unknown) {
    // 1. Set cookie with path=/ so middleware & SSR see it
    document.cookie = `accessToken=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
    // 2. Set localStorage for client usage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNeedsVerification(false);
    setLoading(true);

    try {
      const res = await AuthService.login({ email, password });

      if (res.success && res.data?.accessToken) {
        saveAuthSession(res.data.accessToken, res.data.user);
        setSuccess('Login successful! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        const errorMsg = res.message || 'Login failed. Please check your credentials.';
        setError(errorMsg);
        if (errorMsg.toLowerCase().includes('verify')) {
          setNeedsVerification(true);
        }
      }
    } catch (_err) {
      setError('An unexpected network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(idToken: string) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await AuthService.googleLogin({ idToken });

      if (res.success && res.data?.accessToken) {
        saveAuthSession(res.data.accessToken, res.data.user);
        setSuccess('Google login successful! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        setError(res.message || 'Google login failed.');
      }
    } catch (_err) {
      setError('An unexpected network error occurred during Google login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h1>Sign In</h1>
      <p className="hint">Access your account to view the dashboard</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3 text-xs text-red-600 dark:text-red-400">
          <p>{error}</p>
          {needsVerification && (
            <Link
              href={`/verify-otp?email=${encodeURIComponent(email)}`}
              className="mt-2 inline-block font-semibold text-blue-600 underline"
            >
              Verify your OTP now →
            </Link>
          )}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="input-field">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="input-field">
        <label htmlFor="password">Password</label>
        <div className="relative flex items-center">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[var(--sub)] hover:text-[var(--ink)] focus:outline-none p-1 transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="row-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" />
          <span>Remember me</span>
        </label>
        <Link href="#">Forgot password?</Link>
      </div>

      <button type="submit" disabled={loading} className="btn-primary-custom">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="divider-custom">or</div>

      <GoogleLoginButton onSuccess={handleGoogleLogin} onError={(err) => setError(err)} />

      <div className="foot-link">
        Don&apos;t have an account? <Link href="/register">Create an account</Link>
      </div>
    </form>
  );
}
