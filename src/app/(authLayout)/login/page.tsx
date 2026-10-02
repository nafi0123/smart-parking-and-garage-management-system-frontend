'use client';

import Link from 'next/link';
import type React from 'react';
import { useEffect, useState } from 'react';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { AuthService } from '@/services/auth';
import { getAuthToken, setAuthSession } from '@/utils/cookie';

const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    label: 'Admin',
    email: 'nafi.cse0123@gmail.com',
    password: '123456',
    desc: 'System Overview & Control',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    role: 'MANAGER',
    label: 'Manager',
    email: 'nafi.mahmud0123@gmail.com',
    password: '123456',
    desc: 'Garages & Capacity',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    role: 'DRIVER',
    label: 'Customer',
    email: 'nafi2122940@gmail.com',
    password: '123456',
    desc: 'Driver & Booking User',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      window.location.replace('/dashboard');
      return;
    }

    const params = new URLSearchParams(window.location.search);

    // Case 1: Backend google-redirect sends accessToken + user directly
    const accessToken = params.get('accessToken');
    const userParam = params.get('user');
    if (accessToken) {
      window.history.replaceState({}, '', '/login');
      try {
        const user = userParam ? JSON.parse(decodeURIComponent(userParam)) : null;
        setAuthSession(accessToken, user);
        setSuccess('Google login successful! Redirecting...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 400);
      } catch {
        setError('Google login failed. Please try again.');
      }
      return;
    }

    // Case 2: google-callback route sends credential param
    const googleCredential = params.get('credential');
    if (googleCredential) {
      window.history.replaceState({}, '', '/login');
      handleGoogleLogin(googleCredential);
      return;
    }

    // Case 3: Error from backend redirect
    const errorParam = params.get('error');
    if (errorParam) {
      window.history.replaceState({}, '', '/login');
      setError(decodeURIComponent(errorParam));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveAuthSession(accessToken: string, user: unknown) {
    setAuthSession(accessToken, user);
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
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
      setError(errorMsg);
      if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('verify')) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    setSuccess(null);
    setNeedsVerification(false);
    setActiveDemoRole(account.role);
    setLoading(true);

    try {
      const res = await AuthService.login({
        email: account.email,
        password: account.password,
      });

      if (res.success && res.data?.accessToken) {
        saveAuthSession(res.data.accessToken, res.data.user);
        setSuccess(`Logged in as ${account.label}! Redirecting to dashboard...`);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 400);
      } else {
        setError(res.message || 'Demo login failed.');
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'An unexpected network error occurred during demo login.';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setActiveDemoRole(null);
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
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'An unexpected network error occurred during Google login.';
      setError(errorMsg);
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
        <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{success}</span>
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
            className="absolute right-3 text-[var(--sub)] hover:text-[var(--ink)] focus:outline-none p-1 transition-colors cursor-pointer"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
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
        {loading && !activeDemoRole ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="divider-custom">or</div>

      <GoogleLoginButton onSuccess={handleGoogleLogin} onError={(err) => setError(err)} />

      {/* 3 Demo Login Buttons right below Google button */}
      <div className="grid grid-cols-3 gap-2 mt-3.5">
        {DEMO_ACCOUNTS.map((acc) => {
          const isLoggingInThis = loading && activeDemoRole === acc.role;
          return (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleDemoLogin(acc)}
              disabled={loading}
              className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50 ${acc.badgeClass}`}
              title={`Sign in as ${acc.label} (${acc.email})`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs">{acc.label}</span>
                {isLoggingInThis ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  acc.icon
                )}
              </div>
              <div className="text-[10px] opacity-80 truncate mt-1 font-medium">
                {acc.role === 'ADMIN'
                  ? 'Full Admin'
                  : acc.role === 'MANAGER'
                    ? 'Garages'
                    : 'Customer'}
              </div>
            </button>
          );
        })}
      </div>

      <div className="foot-link">
        Don&apos;t have an account? <Link href="/register">Create an account</Link>
      </div>
    </form>
  );
}
