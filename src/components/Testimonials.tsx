'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const items: { quote: string; author: string; role: string; company: string }[] = t.raw('items');

  return (
    <section className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('sectionTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t('sectionSubtitle')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-gray-700">&ldquo;{item.quote}&rdquo;</blockquote>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">{item.author}</p>
                <p className="text-sm text-gray-500">
                  {item.role} · {item.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
