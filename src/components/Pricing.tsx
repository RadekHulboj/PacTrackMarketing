'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { useState } from 'react';
import LoginModal, { LoggedInUser } from './LoginModal';

const APP_URL = 'https://app.pactrack.pl';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.pactrack.pl';

export default function Pricing() {
  const t = useTranslations('pricing');
  const [loading, setLoading] = useState<string | null>(null);
  const [loginModal, setLoginModal] = useState<{ planId: string; planName: string } | null>(null);
  const [paymentError, setPaymentError] = useState('');

  const plans = [
    { key: 'free', highlighted: false, planId: 'STARTER' },
    { key: 'pro', highlighted: true, planId: 'PROFESSIONAL' },
    { key: 'enterprise', highlighted: false, planId: 'ENTERPRISE' },
  ] as const;

  const initiatePayment = async (planId: string, user: LoggedInUser) => {
    setLoading(planId);
    setPaymentError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          plan: planId,
        }),
      });

      const data = await response.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.status === 'active') {
        window.location.href = APP_URL;
      } else {
        console.error('Payment error:', data.error);
      }
    } catch (error) {
      console.error('Payment request failed:', error);
      setPaymentError('Payment failed. Please try again.');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pactrack_jwt');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = (planId: string, key: string, planName: string) => {
    if (key === 'free') {
      window.location.href = APP_URL;
      return;
    }
    if (key === 'enterprise') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('pactrack_jwt') : null;
    if (storedToken) {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      const userId = payload.userId || payload.sub;
      const email = payload.sub || payload.email;
      if (userId && email) {
        initiatePayment(planId, { userId: String(userId), email, token: storedToken });
        return;
      }
    }

    setLoginModal({ planId, planName });
  };

  const handleLoginSuccess = (user: LoggedInUser) => {
    if (!loginModal) return;
    setLoginModal(null);
    initiatePayment(loginModal.planId, user);
  };

  return (
    <>
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="container-narrow">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('sectionTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t('sectionSubtitle')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map(({ key, highlighted, planId }) => {
            const features: string[] = t.raw(`${key}.features`);
            return (
              <div
                key={key}
                className={`relative rounded-2xl border p-8 ${
                  highlighted
                    ? 'border-primary-500 bg-white shadow-xl ring-2 ring-primary-500'
                    : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                {key === 'pro' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white">
                    {t('pro.popular')}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{t(`${key}.name`)}</h3>
                <p className="mt-1 text-sm text-gray-500">{t(`${key}.description`)}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">{t(`${key}.price`)}</span>
                  {key !== 'enterprise' && (
                    <span className="text-gray-500"> / {t('monthly')}</span>
                  )}
                </div>
                <ul className="mt-8 space-y-3">
                  {features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(planId, key, t(`${key}.name`))}
                  disabled={loading === planId}
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    highlighted
                      ? 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  {loading === planId ? 'Przetwarzanie...' : t(`${key}.cta`)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {paymentError && (
      <div className="mx-auto max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {paymentError}
      </div>
    )}

    {loginModal && (
      <LoginModal
        planId={loginModal.planId}
        planName={loginModal.planName}
        onClose={() => setLoginModal(null)}
        onSuccess={handleLoginSuccess}
      />
    )}
    </>
  );
}
