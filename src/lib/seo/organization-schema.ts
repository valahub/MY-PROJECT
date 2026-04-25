// Organization Schema
// Generates JSON-LD Organization schema for brand identity

export interface OrganizationSchema {
  '@context': string;
  '@type': 'Organization' | 'SoftwareApplication' | 'WebSite';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone?: string;
    email?: string;
    contactType: string;
    availableLanguage?: string[];
  } | {
    '@type': 'ContactPoint';
    telephone?: string;
    email?: string;
    contactType: string;
    availableLanguage?: string[];
  }[];
  address?: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
  };
}

// Generate Organization schema for ERP ValaMarket
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ERP ValaMarket',
    url: 'https://erpvala.com',
    logo: 'https://erpvala.com/logo.png',
    description: 'ERP ValaMarket is a leading digital marketplace for high-quality plugins, scripts, templates, and software solutions. We provide developers and businesses with trusted tools to accelerate their projects.',
    sameAs: [
      'https://twitter.com/erpvala',
      'https://facebook.com/erpvala',
      'https://linkedin.com/company/erpvala',
      'https://github.com/erpvala',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@erpvala.com',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    socialMedia: {
      twitter: 'https://twitter.com/erpvala',
      facebook: 'https://facebook.com/erpvala',
      linkedin: 'https://linkedin.com/company/erpvala',
      github: 'https://github.com/erpvala',
      youtube: 'https://youtube.com/@erpvala',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 1250,
    },
  };
}

// Generate WebSite schema
export function generateWebSiteSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ERP ValaMarket',
    url: 'https://erpvala.com',
    description: 'Digital marketplace for plugins, scripts, templates, and software solutions',
  };
}

// Generate SoftwareApplication schema for the platform
export function generateSoftwareApplicationSchema(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ERP ValaMarket',
    url: 'https://erpvala.com',
    description: 'Digital marketplace platform for buying and selling software products',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

// Generate Organization schema script tag
export function generateOrganizationSchemaScript(schema: OrganizationSchema): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// Generate combined schema (Organization + WebSite)
export function generateCombinedSchema(): string {
  const organization = generateOrganizationSchema();
  const webSite = generateWebSiteSchema();

  return `<script type="application/ld+json">
[
  ${JSON.stringify(organization)},
  ${JSON.stringify(webSite)}
]
</script>`;
}

// Validate Organization schema
export function validateOrganizationSchema(schema: OrganizationSchema): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!schema['@context']) {
    errors.push('Missing @context');
  }

  if (!schema['@type']) {
    errors.push('Missing @type');
  }

  if (!schema.name) {
    errors.push('Missing name');
  }

  if (!schema.url) {
    errors.push('Missing url');
  }

  if (schema['@type'] === 'Organization' && !schema.description) {
    errors.push('Organization requires description');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Customize Organization schema
export function customizeOrganizationSchema(customizations: Partial<OrganizationSchema>): OrganizationSchema {
  const base = generateOrganizationSchema();
  return {
    ...base,
    ...customizations,
  };
}

// Add social media links
export function addSocialMediaLinks(schema: OrganizationSchema, links: {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
}): OrganizationSchema {
  return {
    ...schema,
    sameAs: [
      ...(schema.sameAs || []),
      ...Object.values(links).filter(Boolean),
    ],
    socialMedia: {
      ...schema.socialMedia,
      ...links,
    },
  };
}

// Generate Organization schema with custom rating
export function generateOrganizationWithRating(rating: number, reviewCount: number): OrganizationSchema {
  const schema = generateOrganizationSchema();
  return {
    ...schema,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
    },
  };
}

// Export Organization schema
export function exportOrganizationSchema(): string {
  return JSON.stringify(generateOrganizationSchema(), null, 2);
}

// Import Organization schema
export function importOrganizationSchema(json: string): OrganizationSchema {
  return JSON.parse(json) as OrganizationSchema;
}

// Get Organization schema statistics
export function getOrganizationStats(): {
  hasLogo: boolean;
  hasDescription: boolean;
  hasContactPoint: boolean;
  hasAddress: boolean;
  socialMediaCount: number;
  hasRating: boolean;
} {
  const schema = generateOrganizationSchema();

  return {
    hasLogo: !!schema.logo,
    hasDescription: !!schema.description,
    hasContactPoint: !!schema.contactPoint,
    hasAddress: !!schema.address,
    socialMediaCount: Object.keys(schema.socialMedia || {}).length,
    hasRating: !!schema.aggregateRating,
  };
}

// Generate Organization schema for different locales
export function generateLocalizedOrganizationSchema(locale: string): OrganizationSchema {
  const base = generateOrganizationSchema();

  const localizations: Record<string, Partial<OrganizationSchema>> = {
    'en-US': {
      description: 'ERP ValaMarket is a leading digital marketplace for high-quality plugins, scripts, templates, and software solutions.',
    },
    'es-ES': {
      description: 'ERP ValaMarket es un mercado digital líder para plugins, scripts, plantillas y soluciones de software de alta calidad.',
    },
    'fr-FR': {
      description: 'ERP ValaMarket est un marché numérique de premier plan pour des plugins, scripts, modèles et solutions logicielles de haute qualité.',
    },
    'de-DE': {
      description: 'ERP ValaMarket ist ein führender digitaler Marktplatz für hochwertige Plugins, Skripte, Vorlagen und Softwarelösungen.',
    },
  };

  return {
    ...base,
    ...localizations[locale] || localizations['en-US'],
  };
}

// Generate Organization schema with multiple contact points
export function generateOrganizationWithMultipleContacts(): OrganizationSchema {
  const base = generateOrganizationSchema();

  return {
    ...base,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'support@erpvala.com',
        contactType: 'customer service',
        availableLanguage: ['English'],
      },
      {
        '@type': 'ContactPoint',
        email: 'sales@erpvala.com',
        contactType: 'sales',
        availableLanguage: ['English'],
      },
    ],
  };
}
