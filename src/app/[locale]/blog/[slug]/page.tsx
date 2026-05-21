import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPostBySlug, getAllSlugs } from '@/lib/blog';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

type Props = {
  params: { locale: string; slug: string };
};

export async function generateStaticParams() {
  const locales = ['pl', 'en'];
  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props) {
  const post = await getPostBySlug(params.locale, params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: post.image ? [post.image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'blog' });
  const post = await getPostBySlug(params.locale, params.slug);

  if (!post) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PacTrack',
      url: 'https://pactrack.pl',
    },
  };

  return (
    <article className="pt-24 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {post.category && (
          <span className="mb-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
            {post.category}
          </span>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {t('publishedOn')} {post.date}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {t('byAuthor')} {post.author}
          </span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="mt-8 w-full rounded-2xl"
          />
        )}

        <div
          className="prose mt-10"
          dangerouslySetInnerHTML={{ __html: post.htmlContent || '' }}
        />
      </div>
    </article>
  );
}
