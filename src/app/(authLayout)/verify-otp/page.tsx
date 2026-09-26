'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useState } from 'react';
import { AuthService } from '@/services/auth';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(defaultEmail);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await AuthService.verifyOtp({
        email,
        otpCode: otpCode.trim(),
      });

      if (res.success) {
        setSuccess('Account verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1200);
      } else {
        setError(res.message || 'OTP verification failed. Please try again.');
      }
    } catch (_err) {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h1>Verify OTP</h1>
      <p className="hint">Enter the 6-digit verification code sent to your email</p>

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
        <label htmlFor="otpCode">6-Digit OTP Code</label>
        <input
          id="otpCode"
          type="text"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="123456"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          className="tracking-widest text-center text-lg font-mono"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary-custom mt-2">
        {loading ? 'Verifying OTP...' : 'Verify OTP'}
      </button>

      <div className="foot-link">
        Back to <Link href="/login">Sign In</Link>
      </div>
    </form>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={<div className="text-center p-8 text-sm text-[var(--sub)]">Loading...</div>}
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
