'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const APP_URL = 'https://app.pactrack.pl';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.pactrack.pl';

export interface LoggedInUser {
  userId: string;
  email: string;
  token: string;
}

interface LoginModalProps {
  planId: string;
  planName: string;
  onClose: () => void;
  onSuccess: (user: LoggedInUser) => void;
}

export default function LoginModal({ planId, planName, onClose, onSuccess }: LoginModalProps) {
  const t = useTranslations('loginModal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t('errorInvalidCredentials'));
        return;
      }

      const token = data.token;
      const userId = data.userId;

      if (!token || !userId) {
        setError(t('errorLoginFailed'));
        return;
      }

      if (data.accountStatus && data.accountStatus !== 'ACTIVE') {
        setError(t('errorAccountNotActive'));
        return;
      }

      localStorage.setItem('pactrack_jwt', token);
      onSuccess({ userId: String(userId), email: data.email || email, token });

    } catch {
      setError(t('errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/google-auth/login?role=SELLER`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.authUrl) {
        const returnUrl = encodeURIComponent(window.location.href + `?plan=${planId}&subscribe=1`);
        window.location.href = data.authUrl + `&state_extra=${returnUrl}`;
      } else {
        setError(t('errorGoogleFailed'));
      }
    } catch {
      setError(t('errorNetwork'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('subtitle')} <span className="font-semibold text-primary-600">{planName}</span>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="jan@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t('passwordLabel')}
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:bg-primary-400"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">{t('orDivider')}</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {t('googleButton')}
        </button>

        <p className="mt-5 text-center text-xs text-gray-400">
          {t('noAccount')}{' '}
          <a href={APP_URL + '/register'} className="font-medium text-primary-600 hover:underline">
            {t('registerLink')}
          </a>
        </p>
      </div>
    </div>
  );
}
