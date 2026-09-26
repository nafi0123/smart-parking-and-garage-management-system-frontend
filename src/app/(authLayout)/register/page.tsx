'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { AuthService } from '@/services/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DRIVER' | 'MANAGER'>('DRIVER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      window.location.href = '/dashboard';
    }
  }, []);

  function saveAuthSession(accessToken: string, user: unknown) {
    document.cookie = `accessToken=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await AuthService.createUser({
        name,
        email,
        phone: phone || undefined,
        password,
        role,
      });

      if (res.success) {
        setSuccess('Registration successful! Please check your email for the OTP code.');
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        setError(res.message || 'Registration failed.');
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
        setSuccess('Google sign-up/login successful! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        setError(res.message || 'Google authentication failed.');
      }
    } catch (_err) {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h1>Create an Account</h1>
      <p className="hint">Register to manage your smart parking facilities</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="input-field">
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

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
        <label htmlFor="phone">Phone (Optional)</label>
        <input
          id="phone"
          type="tel"
          placeholder="+8801XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="input-field">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'DRIVER' | 'MANAGER')}
          className="w-full p-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm outline-none focus:border-[var(--blue)]"
        >
          <option value="DRIVER">Driver (Vehicle Owner)</option>
          <option value="MANAGER">Garage Manager</option>
        </select>
      </div>

      <div className="input-field">
        <label htmlFor="password">Password (min 6 chars)</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary-custom mt-2">
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <div className="divider-custom">or</div>

      <GoogleLoginButton onSuccess={handleGoogleLogin} onError={(err) => setError(err)} />

      <div className="foot-link">
        Already have an account? <Link href="/login">Sign In</Link>
      </div>
    </form>
  );
}
