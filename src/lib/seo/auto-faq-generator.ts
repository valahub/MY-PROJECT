// Auto FAQ Generator with Schema
// Generates FAQs and JSON-LD schema for SEO

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';

export interface FAQ {
  question: string;
  answer: string;
}

export interface FAQPage {
  url: string;
  faqs: FAQ[];
  schema: any;
  createdAt: string;
}

// FAQ templates for different contexts
const FAQ_TEMPLATES = {
  product: [
    {
      question: 'How do I download {product}?',
      answer: 'After purchasing {product}, you can download it instantly from your account dashboard. The download link will be available immediately after payment confirmation.',
    },
    {
      question: 'Is {product} regularly updated?',
      answer: 'Yes, {product} receives regular updates to ensure compatibility and add new features. Updates are free for all customers.',
    },
    {
      question: 'Does {product} include support?',
      answer: 'Yes, {product} includes support. Check the product page for support details, response times, and support channels.',
    },
    {
      question: 'Can I use {product} on multiple projects?',
      answer: 'The license terms for {product} vary. Check the license information on the product page for specific usage rights.',
    },
    {
      question: 'What are the system requirements for {product}?',
      answer: 'System requirements for {product} are listed on the product page. Ensure your environment meets these requirements before purchasing.',
    },
  ],
  category: [
    {
      question: 'What are the best {category} products?',
      answer: 'The best {category} products are those with high ratings, positive reviews, and regular updates. Browse our {category} collection to find top-rated options.',
    },
    {
      question: 'How do I choose the right {category}?',
      answer: 'Consider your specific requirements, budget, and technical expertise. Read product descriptions, reviews, and compare features before choosing.',
    },
    {
      question: 'Are {category} products easy to use?',
      answer: 'Most {category} products are designed to be user-friendly. Check product documentation and demos to assess ease of use.',
    },
    {
      question: 'Do {category} products come with documentation?',
      answer: 'Yes, most {category} products include documentation. Check individual product pages for documentation details.',
    },
  ],
  general: [
    {
      question: 'How do I purchase products?',
      answer: 'Add products to your cart, proceed to checkout, and complete payment. After payment, you can download products from your account.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept various payment methods including credit cards, PayPal, and other secure payment options.',
    },
    {
      question: 'Can I get a refund?',
      answer: 'Refund policies vary by product. Check the refund policy on the product page or contact support for specific cases.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can contact support through the contact form on our website or directly through product-specific support channels.',
    },
  ],
};

// Generate FAQs for a product
export function generateProductFAQs(productId: string): FAQ[] {
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) return [];

  const faqs: FAQ[] = [];

  FAQ_TEMPLATES.product.forEach((template) => {
    faqs.push({
      question: template.question.replace('{product}', product.title),
      answer: template.answer.replace(/{product}/g, product.title),
    });
  });

  // Add category-specific FAQs
  const categoryFAQs = generateCategoryFAQs(product.category);
  faqs.push(...categoryFAQs.slice(0, 2));

  return faqs;
}

// Generate FAQs for a category
export function generateCategoryFAQs(categorySlug: string): FAQ[] {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  if (!category) return [];

  const faqs: FAQ[] = [];

  FAQ_TEMPLATES.category.forEach((template) => {
    faqs.push({
      question: template.question.replace('{category}', category.title),
      answer: template.answer.replace(/{category}/g, category.title),
    });
  });

  return faqs;
}

// Generate general FAQs
export function generateGeneralFAQs(): FAQ[] {
  return FAQ_TEMPLATES.general.map((template) => ({
    question: template.question,
    answer: template.answer,
  }));
}

// Generate FAQ JSON-LD schema
export function generateFAQSchema(faqs: FAQ[]): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Generate complete FAQ page
export function generateFAQPage(url: string, context: 'product' | 'category' | 'general', id?: string): FAQPage {
  let faqs: FAQ[] = [];

  switch (context) {
    case 'product':
      if (id) faqs = generateProductFAQs(id);
      break;
    case 'category':
      if (id) faqs = generateCategoryFAQs(id);
      break;
    case 'general':
      faqs = generateGeneralFAQs();
      break;
  }

  const schema = generateFAQSchema(faqs);

  return {
    url,
    faqs,
    schema,
    createdAt: new Date().toISOString(),
  };
}

// FAQ page cache
const faqPageCache = new Map<string, FAQPage>();

export function cacheFAQPage(key: string, page: FAQPage): void {
  faqPageCache.set(key, page);
}

export function getCachedFAQPage(key: string): FAQPage | undefined {
  return faqPageCache.get(key);
}

export function clearFAQPageCache(): void {
  faqPageCache.clear();
}

// Validate FAQ
export function validateFAQ(faq: FAQ): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!faq.question || faq.question.length === 0) {
    errors.push('Question is required');
  }

  if (!faq.answer || faq.answer.length === 0) {
    errors.push('Answer is required');
  }

  if (faq.question.length > 200) {
    errors.push('Question exceeds 200 characters');
  }

  if (faq.answer.length > 1000) {
    errors.push('Answer exceeds 1000 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate FAQ HTML
export function generateFAQHTML(faqs: FAQ[]): string {
  const html = faqs.map((faq, index) => `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 class="faq-question" itemprop="name">${faq.question}</h3>
      <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <span itemprop="text">${faq.answer}</span>
      </div>
    </div>
  `).join('');

  return `<div class="faq-container" itemscope itemtype="https://schema.org/FAQPage">${html}</div>`;
}

// Generate FAQ schema script tag
export function generateFAQSchemaScript(faqs: FAQ[]): string {
  const schema = generateFAQSchema(faqs);
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// Auto-generate FAQs for all products
export function autoGenerateProductFAQs(): void {
  ITEMS.forEach((item) => {
    const key = `product-${item.id}`;
    const cached = getCachedFAQPage(key);
    
    if (!cached) {
      const page = generateFAQPage(`/marketplace/item/${item.slug}`, 'product', item.id);
      cacheFAQPage(key, page);
    }
  });
}

// Auto-generate FAQs for all categories
export function autoGenerateCategoryFAQs(): void {
  CATEGORY_TREE.forEach((cat) => {
    const key = `category-${cat.slug}`;
    const cached = getCachedFAQPage(key);
    
    if (!cached) {
      const page = generateFAQPage(`/marketplace/category?category=${cat.slug}`, 'category', cat.slug);
      cacheFAQPage(key, page);
    }
  });
}

// Get FAQ statistics
export function getFAQStats(): {
  totalFAQPages: number;
  totalFAQs: number;
  byContext: Record<string, number>;
} {
  const pages = Array.from(faqPageCache.values());
  const totalFAQPages = pages.length;
  const totalFAQs = pages.reduce((sum, page) => sum + page.faqs.length, 0);
  const byContext: Record<string, number> = {};

  pages.forEach((page) => {
    const context = page.url.includes('item') ? 'product' : 
                    page.url.includes('category') ? 'category' : 'general';
    byContext[context] = (byContext[context] || 0) + page.faqs.length;
  });

  return {
    totalFAQPages,
    totalFAQs,
    byContext,
  };
}

// Merge FAQs from multiple sources
export function mergeFAQs(faqArrays: FAQ[][]): FAQ[] {
  const seen = new Set<string>();
  const merged: FAQ[] = [];

  faqArrays.forEach((faqs) => {
    faqs.forEach((faq) => {
      const key = faq.question.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(faq);
      }
    });
  });

  return merged;
}

// Add custom FAQ
export function addCustomFAQ(url: string, faq: FAQ): void {
  const key = `custom-${url}`;
  const existing = getCachedFAQPage(key);
  
  if (existing) {
    existing.faqs.push(faq);
    existing.schema = generateFAQSchema(existing.faqs);
    cacheFAQPage(key, existing);
  } else {
    const page = generateFAQPage(url, 'general');
    page.faqs.push(faq);
    page.schema = generateFAQSchema(page.faqs);
    cacheFAQPage(key, page);
  }
}

// Remove FAQ
export function removeFAQ(url: string, question: string): boolean {
  const key = `custom-${url}`;
  const existing = getCachedFAQPage(key);
  
  if (existing) {
    const index = existing.faqs.findIndex((f) => f.question === question);
    if (index > -1) {
      existing.faqs.splice(index, 1);
      existing.schema = generateFAQSchema(existing.faqs);
      cacheFAQPage(key, existing);
      return true;
    }
  }
  
  return false;
}

// Export FAQ pages as JSON
export function exportFAQPages(): string {
  const pages = Array.from(faqPageCache.values());
  return JSON.stringify(pages, null, 2);
}

// Import FAQ pages from JSON
export function importFAQPages(json: string): void {
  const pages = JSON.parse(json) as FAQPage[];
  pages.forEach((page) => {
    const key = page.url;
    cacheFAQPage(key, page);
  });
}

// Generate FAQ sitemap entries
export function generateFAQSitemapEntries(): Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}> {
  const pages = Array.from(faqPageCache.values());
  const now = new Date().toISOString().split('T')[0];

  return pages.map((page) => ({
    url: `https://erpvala.com${page.url}`,
    lastmod: now,
    changefreq: 'weekly',
    priority: 0.5,
  }));
}

// Search FAQs
export function searchFAQs(query: string): Array<{
  url: string;
  faq: FAQ;
}> {
  const results: Array<{ url: string; faq: FAQ }> = [];
  const normalizedQuery = query.toLowerCase();

  faqPageCache.forEach((page) => {
    page.faqs.forEach((faq) => {
      if (
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({ url: page.url, faq });
      }
    });
  });

  return results;
}

// Get related FAQs based on keywords
export function getRelatedFAQs(keywords: string[], limit: number = 5): FAQ[] {
  const allFAQs: Array<{ faq: FAQ; score: number }> = [];

  faqPageCache.forEach((page) => {
    page.faqs.forEach((faq) => {
      let score = 0;
      const text = `${faq.question} ${faq.answer}`.toLowerCase();
      
      keywords.forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          score++;
        }
      });

      if (score > 0) {
        allFAQs.push({ faq, score });
      }
    });
  });

  return allFAQs
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.faq);
}
