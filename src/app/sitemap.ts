import { MetadataRoute } from 'next';
import { getAllSlugs } from '@/lib/blog';

const BASE_URL = 'https://pactrack.pl';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['pl', 'en'];
  const staticPages = ['', '/blog', '/pricing', '/contact'];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      const url = locale === 'pl' ? `${BASE_URL}${page}` : `${BASE_URL}/${locale}${page}`;
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1.0 : 0.8,
      });
    }

    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      const url =
        locale === 'pl'
          ? `${BASE_URL}/blog/${slug}`
          : `${BASE_URL}/${locale}/blog/${slug}`;
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
