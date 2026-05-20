'use client';

import { useTranslations } from 'next-intl';
import { MapPin, ShoppingBag, Award, Camera, Smartphone, Shield } from 'lucide-react';

const featureKeys = [
  { key: 'tracking', icon: MapPin },
  { key: 'allegro', icon: ShoppingBag },
  { key: 'certificates', icon: Award },
  { key: 'evidence', icon: Camera },
  { key: 'mobile', icon: Smartphone },
  { key: 'security', icon: Shield },
] as const;

export default function Features() {
  const t = useTranslations('features');

  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('sectionTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t('sectionSubtitle')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="group relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-3 text-primary-600 transition-colors group-hover:bg-primary-100">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-2 text-gray-600">
                {t(`${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
