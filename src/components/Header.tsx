'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { Menu, X } from 'lucide-react';

const APP_URL = 'https://app.pactrack.pl';

export default function Header() {
  const t = useTranslations('nav');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/#features', label: t('features') },
    { href: '/#pricing', label: t('pricing') },
    { href: '/blog', label: t('blog') },
    { href: '/#faq', label: t('faq') },
    { href: '/#contact', label: t('contact') },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
                    <img src="/logo.svg" alt="PacTrack" width="150" height="100" className="bg-white rounded" />
          <span className="text-xl font-bold text-gray-900">
            Pac<span className="text-primary-600">Track</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <a
            href={APP_URL}
            className="text-sm font-medium text-gray-700 hover:text-primary-600"
          >
            {t('login')}
          </a>
          <a
            href={APP_URL}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            {t('getStarted')}
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
              <a
                href={APP_URL}
                className="block rounded-lg px-3 py-2 text-center text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('login')}
              </a>
              <a
                href={APP_URL}
                className="block rounded-lg bg-primary-600 px-3 py-2 text-center text-base font-semibold text-white"
              >
                {t('getStarted')}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
