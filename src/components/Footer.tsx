import { useTranslations } from 'next-intl';

const APP_URL = 'https://app.pactrack.pl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
                            <img src="/logo.svg" alt="PacTrack" width="120" height="80" className="bg-gray-50 rounded" />
              <span className="text-lg font-bold text-gray-900">
                Pac<span className="text-primary-600">Track</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">{t('description')}</p>
            <a
              href={APP_URL}
              className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              {t('app')} →
            </a>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              {t('product')}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/#features" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.features')}
                </a>
              </li>
              <li>
                <a href="/#pricing" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.pricing')}
                </a>
              </li>
              <li>
                <a href="/blog" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.blog')}
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              {t('company')}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/#contact" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.contact')}
                </a>
              </li>
              <li>
                <a href="/blog" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.caseStudies')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              {t('legal')}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/privacy" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.privacy')}
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.terms')}
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-sm text-gray-600 hover:text-primary-600">
                  {t('links.cookies')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          {t('copyright')}
        </div>
      </div>
    </footer>
  );
}
