'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Play } from 'lucide-react';

const APP_URL = 'https://app.pactrack.pl';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50/30 to-white pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-accent-100/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
            <span className="h-2 w-2 rounded-full bg-primary-500" />
            {t('badge')}
          </div>

          {/* Title */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            {t('title')}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            {t('subtitle')}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={APP_URL}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30"
            >
              {t('cta')}
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <Play className="h-5 w-5 text-primary-600" />
              {t('ctaSecondary')}
            </a>
          </div>

          {/* Trust signal */}
          <p className="mt-12 text-sm text-gray-500">{t('trustedBy')}</p>
          <div className="mt-4 flex items-center justify-center gap-8 opacity-40">
            {['Allegro', 'InPost', 'DPD', 'GLS', 'DHL'].map((name) => (
              <span key={name} className="text-lg font-bold text-gray-400">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
