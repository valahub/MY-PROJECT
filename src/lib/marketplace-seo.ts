import type { MarketItem } from "@/lib/marketplace-data";

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
  const faq = buildMarketplaceFaq(item);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
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
