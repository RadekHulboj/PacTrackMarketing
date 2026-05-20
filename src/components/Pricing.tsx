'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

const APP_URL = 'https://app.pactrack.pl';

export default function Pricing() {
  const t = useTranslations('pricing');

  const plans = [
    { key: 'free', highlighted: false },
    { key: 'pro', highlighted: true },
    { key: 'enterprise', highlighted: false },
  ] as const;

  return (
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
          {plans.map(({ key, highlighted }) => {
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
                <a
                  href={key === 'enterprise' ? '#contact' : APP_URL}
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    highlighted
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t(`${key}.cta`)}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
