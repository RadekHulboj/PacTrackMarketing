export function SchemaOrg() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PacTrack',
    url: 'https://pactrack.pl',
    logo: 'https://pactrack.pl/images/logo.png',
    description: 'Kompleksowy system śledzenia przesyłek dla e-commerce',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'kontakt@pactrack.pl',
      contactType: 'customer service',
      availableLanguage: ['Polish', 'English'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PacTrack',
    url: 'https://pactrack.pl',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://pactrack.pl/blog?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PacTrack',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'PLN',
        name: 'Starter',
      },
      {
        '@type': 'Offer',
        price: '99',
        priceCurrency: 'PLN',
        name: 'Professional',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
    </>
  );
}
