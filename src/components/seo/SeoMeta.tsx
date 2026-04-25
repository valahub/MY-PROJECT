// SEO Meta Tags Component
// Renders dynamic meta tags, Open Graph, Twitter Cards, and JSON-LD

import { Helmet } from 'react-helmet-async';

interface SeoMetaProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath: string;
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

export function SeoMeta({
  title,
  description,
  keywords,
  canonicalPath,
  image = '/og-marketplace.jpg',
  jsonLd,
  noIndex = false,
}: SeoMetaProps) {
  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${canonicalPath}`;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="ERP Vala Marketplace" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}
        </script>
      )}
    </Helmet>
  );
}
