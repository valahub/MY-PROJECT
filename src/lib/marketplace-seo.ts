import type { MarketItem } from "@/lib/marketplace-data";
import { CATEGORY_TREE } from "@/lib/marketplace-data";

const SEO_METRICS_KEY = "erpvala.marketplace.seo.metrics.v1";
const BRAND = "ERP Vala";

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(input: string, max: number) {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function approximatePixelWidth(input: string) {
  let width = 0;
  for (const ch of input) {
    if ("MW@#%&".includes(ch)) width += 11;
    else if ("iltI|.,:;'".includes(ch)) width += 4;
    else if (ch === " ") width += 4;
    else width += 8;
  }
  return width;
}

function optimizeTitlePixelWidth(input: string, maxPixels = 580) {
  if (approximatePixelWidth(input) <= maxPixels) return input;
  let value = input;
  while (value.length > 20 && approximatePixelWidth(`${value}...`) > maxPixels) {
    value = value.slice(0, -1).trim();
  }
  return `${value}...`;
}

function removeStopWords(input: string) {
  const stop = new Set(["the", "a", "an", "for", "and", "or", "of", "to", "in", "with"]);
  return input
    .split(/\s+/)
    .filter((token) => token && !stop.has(token.toLowerCase()))
    .join(" ");
}

function getTechTokens(item: MarketItem) {
  const known = [
    "laravel",
    "react",
    "vue",
    "wordpress",
    "flutter",
    "django",
    "php",
    "node",
    "tailwind",
  ];
  return item.tags.filter((tag) => known.includes(tag.toLowerCase()));
}

export function buildLongTailKeywords(item: MarketItem) {
  const tech = getTechTokens(item)[0] || item.tags[0] || item.category;
  return [
    `buy ${item.subcategory} script`,
    `best ${item.category} software`,
    `${tech} ${item.subcategory} solution`,
    `download ${item.title.toLowerCase()}`,
    `live demo ${item.subcategory} product`,
  ];
}

export function buildKeywordCluster(item: MarketItem) {
  const primary = Array.from(new Set([item.category, item.subcategory, ...item.tags])).slice(0, 10);
  const secondary = buildLongTailKeywords(item);
  return { primary, secondary };
}

export function normalizeSeoSlug(input: string) {
  const cleaned = removeStopWords(decodeURIComponent(input));
  return cleaned
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

export function buildMarketplaceProductMeta(item: MarketItem) {
  const rawDescription = stripHtml(item.description);
  const titleBase = `Buy ${item.subcategory} Script: ${item.title} - ${BRAND}`;
  const title = optimizeTitlePixelWidth(clamp(titleBase, 60));
  const description = clamp(`${rawDescription} Buy now and download instantly from ${BRAND}.`, 160);
  const clusters = buildKeywordCluster(item);
  const keywords = [...clusters.primary, ...clusters.secondary].join(", ");
  const canonicalPath = `/marketplace/item/${item.slug}`;
  const image = item.thumbnail || "/og-marketplace.jpg";

  return {
    title,
    description,
    keywords,
    canonicalPath,
    image,
  };
}

export function buildMarketplaceHreflangLinks(canonicalPath: string) {
  const locales = [
    { hrefLang: "en", prefix: "" },
    { hrefLang: "en-US", prefix: "/us/en" },
    { hrefLang: "en-IN", prefix: "/in/en" },
    { hrefLang: "fr-FR", prefix: "/fr/fr" },
  ];
  return locales.map((locale) => ({
    rel: "alternate" as const,
    hrefLang: locale.hrefLang,
    href: `${locale.prefix}${canonicalPath}`,
  }));
}

export function buildMarketplaceFaq(item: MarketItem) {
  return [
    {
      question: `How do I download ${item.title}?`,
      answer: `Purchase ${item.title}, verify payment, then download from your purchase history instantly.`,
    },
    {
      question: `Is ${item.title} regularly updated?`,
      answer: `Yes. Current version is ${item.version}, with updates listed in the changelog.`,
    },
    {
      question: `Does ${item.title} include support?`,
      answer: "Yes. Marketplace purchase includes support and access to updates.",
    },
  ];
}

export function buildMarketplaceProductJsonLd(item: MarketItem, canonicalPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    description: item.description,
    category: `${item.category}/${item.subcategory}`,
    sku: item.id,
    image: [item.thumbnail || "/og-marketplace.jpg"],
    brand: {
      "@type": "Brand",
      name: "ERP Vala Marketplace",
    },
    offers: {
      "@type": "Offer",
      url: canonicalPath,
      priceCurrency: "USD",
      price: item.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: item.rating,
      reviewCount: item.reviews,
    },
  };
}

export function buildMarketplaceFaqJsonLd(item: MarketItem) {
  const faqs = buildMarketplaceFaq(item);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function buildAggregateRatingJsonLd(item: MarketItem) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: item.rating,
    reviewCount: item.reviews,
    bestRating: 5,
    worstRating: 1,
    itemReviewed: {
      "@type": "Product",
      name: item.title,
    },
  };
}

export function buildReviewJsonLd(
  item: MarketItem,
  reviews: Array<{
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    description: item.description,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: item.rating,
      reviewCount: item.reviews,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: review.comment,
      datePublished: review.date,
    })),
  };
}

export function buildMarketplaceBreadcrumbJsonLd(item: MarketItem, canonicalPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Marketplace",
        item: "/marketplace",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: item.category,
        item: `/marketplace/category/${item.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: item.title,
        item: canonicalPath,
      },
    ],
  };
}

export function buildMarketplaceOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ERP Vala Marketplace",
    url: "/marketplace",
    logo: "/logo.svg",
  };
}

export function canonicalizeSeoPath(pathname: string, search: URLSearchParams) {
  const blockedParams = ["ref", "utm_source", "utm_medium", "utm_campaign", "sort", "page"];
  const next = new URLSearchParams(search);
  for (const key of blockedParams) next.delete(key);
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "");
  const query = next.toString();
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

type SeoMetric = {
  views: number;
  clicks: number;
  dwellMs: number;
  maxScrollDepth: number;
};

function safeReadMetrics(): Record<string, SeoMetric> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SEO_METRICS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SeoMetric>) : {};
  } catch {
    return {};
  }
}

function safeWriteMetrics(value: Record<string, SeoMetric>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEO_METRICS_KEY, JSON.stringify(value));
}

export function trackMarketplaceSeoMetric(
  productId: string,
  type: "view" | "click" | "dwell" | "scroll",
  value = 0,
) {
  const metrics = safeReadMetrics();
  const current = metrics[productId] || { views: 0, clicks: 0, dwellMs: 0, maxScrollDepth: 0 };

  if (type === "view") current.views += 1;
  if (type === "click") current.clicks += 1;
  if (type === "dwell") current.dwellMs += Math.max(0, value);
  if (type === "scroll") current.maxScrollDepth = Math.max(current.maxScrollDepth, value);

  metrics[productId] = current;
  safeWriteMetrics(metrics);
}

// ============================================
// CATEGORY SEO
// ============================================

export function buildCategoryMeta(categorySlug: string) {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  if (!category) {
    return {
      title: `Browse Marketplace - ${BRAND}`,
      description: `Explore 600,000+ digital assets including code, themes, plugins, and more on ${BRAND}.`,
      keywords: "marketplace, digital assets, code, themes, plugins",
      canonicalPath: "/marketplace",
    };
  }

  const title = `Buy ${category.title} - ${category.count.toLocaleString()} Items | ${BRAND}`;
  const description = `Discover ${category.count.toLocaleString()} ${category.title} including ${category.subs.slice(0, 3).join(", ")}. Download instantly from ${BRAND}.`;
  const keywords = [category.title, ...category.subs].join(", ");
  const canonicalPath = `/marketplace/category?category=${categorySlug}`;

  return {
    title: optimizeTitlePixelWidth(clamp(title, 60)),
    description: clamp(description, 160),
    keywords,
    canonicalPath,
  };
}

export function buildCategoryJsonLd(categorySlug: string, canonicalPath: string) {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  if (!category) return null;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.title,
    description: `Browse ${category.count.toLocaleString()} ${category.title} on ${BRAND}`,
    url: canonicalPath,
    numberOfItems: category.count,
  };
}

// ============================================
// TAG SEO
// ============================================

export function buildTagMeta(tag: string, itemCount: number) {
  const title = `Best ${tag} Scripts & Plugins - ${itemCount} Items | ${BRAND}`;
  const description = `Find top-rated ${tag} scripts, plugins, and templates. ${itemCount} items available with instant download from ${BRAND}.`;
  const keywords = `${tag}, ${tag} scripts, ${tag} plugins, best ${tag}`;
  const canonicalPath = `/marketplace/tag/${normalizeSeoSlug(tag)}`;

  return {
    title: optimizeTitlePixelWidth(clamp(title, 60)),
    description: clamp(description, 160),
    keywords,
    canonicalPath,
  };
}

export function buildTagJsonLd(tag: string, itemCount: number, canonicalPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${tag} Products`,
    description: `Browse ${itemCount} ${tag} products on ${BRAND}`,
    url: canonicalPath,
    numberOfItems: itemCount,
  };
}

// ============================================
// BLOG SEO
// ============================================

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  featured: boolean;
  relatedProducts: string[];
  faqs?: Array<{ question: string; answer: string }>;
  image?: string;
}

export function buildBlogMeta(post: BlogPost) {
  const title = `${post.title} | ${BRAND} Blog`;
  const description = clamp(post.excerpt, 160);
  const keywords = [post.category, ...post.tags].join(", ");
  const canonicalPath = `/marketplace/blog/${post.slug}`;

  return {
    title: optimizeTitlePixelWidth(clamp(title, 60)),
    description,
    keywords,
    canonicalPath,
  };
}

export function buildBlogJsonLd(post: BlogPost, canonicalPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url: canonicalPath,
    keywords: post.tags.join(", "),
  };
}

export function buildBlogFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function buildBlogListJsonLd(canonicalPath: string, blogCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${BRAND} Blog`,
    description: "Latest marketplace news, tutorials, and product reviews",
    url: canonicalPath,
    blogPost: {
      "@type": "ItemList",
      numberOfItems: blogCount,
    },
  };
}

// ============================================
// HOMEPAGE SEO
// ============================================

export function buildHomepageMeta() {
  const title = `Marketplace - 600,000+ Digital Assets | ${BRAND}`;
  const description = `Buy and sell premium code, themes, plugins, and graphics. WordPress, React, Vue, Laravel, and more. Instant download from ${BRAND}.`;
  const keywords = "marketplace, digital assets, code, themes, plugins, wordpress, react, vue, laravel";
  const canonicalPath = "/marketplace";

  return {
    title: optimizeTitlePixelWidth(clamp(title, 60)),
    description: clamp(description, 160),
    keywords,
    canonicalPath,
  };
}

export function buildHomepageJsonLd(canonicalPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${BRAND} Marketplace`,
    url: canonicalPath,
    description: "Premium digital assets marketplace",
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonicalPath}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
