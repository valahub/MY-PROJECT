// ItemList Schema for Category Pages
// Generates JSON-LD ItemList schema for category/product listing pages

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';

export interface ItemListSchemaItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  url: string;
  image?: string;
  description?: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

export interface ItemListSchema {
  '@context': string;
  '@type': 'ItemList';
  itemListElement: ItemListSchemaItem[];
  itemListOrder: 'Ascending' | 'Descending' | 'Unordered';
}

// Generate ItemList schema for category page
export function generateCategoryItemListSchema(categorySlug: string, limit: number = 20): ItemListSchema {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  if (!category) {
    return generateEmptyItemList();
  }

  const categoryProducts = ITEMS.filter((item) => item.category === categorySlug);
  const products = categoryProducts.slice(0, limit);

  const itemListElement: ItemListSchemaItem[] = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://erpvala.com/marketplace/item/${product.slug}`,
    image: product.thumbnail,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
    itemListOrder: 'Ascending',
  };
}

// Generate ItemList schema for tag page
export function generateTagItemListSchema(tag: string, limit: number = 20): ItemListSchema {
  const tagProducts = ITEMS.filter((item) =>
    item.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
  const products = tagProducts.slice(0, limit);

  const itemListElement: ItemListSchemaItem[] = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://erpvala.com/marketplace/item/${product.slug}`,
    image: product.thumbnail,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
    itemListOrder: 'Ascending',
  };
}

// Generate ItemList schema for author page
export function generateAuthorItemListSchema(authorName: string, limit: number = 20): ItemListSchema {
  const authorProducts = ITEMS.filter((item) => item.author === authorName);
  const products = authorProducts.slice(0, limit);

  const itemListElement: ItemListSchemaItem[] = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://erpvala.com/marketplace/item/${product.slug}`,
    image: product.thumbnail,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
    itemListOrder: 'Ascending',
  };
}

// Generate ItemList schema for search results
export function generateSearchResultsItemListSchema(
  query: string,
  results: Array<{ id: string; title: string; slug: string; thumbnail: string; description: string; price: number }>,
  limit: number = 20
): ItemListSchema {
  const products = results.slice(0, limit);

  const itemListElement: ItemListSchemaItem[] = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://erpvala.com/marketplace/item/${product.slug}`,
    image: product.thumbnail,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
    itemListOrder: 'Ascending',
  };
}

// Generate empty ItemList schema
function generateEmptyItemList(): ItemListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [],
    itemListOrder: 'Ascending',
  };
}

// Generate ItemList schema script tag
export function generateItemListSchemaScript(schema: ItemListSchema): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// Generate ItemList schema for all categories
export function generateAllCategoryItemLists(): Map<string, ItemListSchema> {
  const schemas = new Map<string, ItemListSchema>();

  CATEGORY_TREE.forEach((category) => {
    const schema = generateCategoryItemListSchema(category.slug);
    schemas.set(category.slug, schema);
  });

  return schemas;
}

// Validate ItemList schema
export function validateItemListSchema(schema: ItemListSchema): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!schema['@context']) {
    errors.push('Missing @context');
  }

  if (schema['@type'] !== 'ItemList') {
    errors.push('Invalid @type, expected ItemList');
  }

  if (!schema.itemListElement || schema.itemListElement.length === 0) {
    errors.push('Missing or empty itemListElement');
  }

  schema.itemListElement.forEach((item, index) => {
    if (!item['@type'] || item['@type'] !== 'ListItem') {
      errors.push(`Item ${index}: Invalid @type, expected ListItem`);
    }

    if (!item.name) {
      errors.push(`Item ${index}: Missing name`);
    }

    if (!item.url) {
      errors.push(`Item ${index}: Missing url`);
    }

    if (item.position !== index + 1) {
      errors.push(`Item ${index}: Invalid position, expected ${index + 1}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get ItemList statistics
export function getItemListStats(): {
  totalCategories: number;
  totalItems: number;
  averageItemsPerCategory: number;
} {
  const schemas = generateAllCategoryItemLists();
  const totalCategories = schemas.size;
  const totalItems = Array.from(schemas.values()).reduce(
    (sum, schema) => sum + schema.itemListElement.length,
    0
  );
  const averageItemsPerCategory = totalCategories > 0 ? totalItems / totalCategories : 0;

  return {
    totalCategories,
    totalItems,
    averageItemsPerCategory,
  };
}

// Export ItemList schemas
export function exportItemLists(): string {
  const schemas = generateAllCategoryItemLists();
  return JSON.stringify(Array.from(schemas.entries()), null, 2);
}

// Import ItemList schemas
export function importItemLists(json: string): Map<string, ItemListSchema> {
  const data = JSON.parse(json) as Array<[string, ItemListSchema]>;
  const schemas = new Map<string, ItemListSchema>();
  data.forEach(([key, value]) => {
    schemas.set(key, value);
  });
  return schemas;
}

// Generate ItemList schema with custom ordering
export function generateOrderedItemListSchema(
  products: Array<{ id: string; title: string; slug: string; thumbnail: string; description: string; price: number }>,
  orderBy: 'price' | 'rating' | 'name' | 'sales',
  order: 'Ascending' | 'Descending' = 'Ascending'
): ItemListSchema {
  const sorted = [...products].sort((a, b) => {
    let comparison = 0;

    switch (orderBy) {
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'rating':
        comparison = (a as any).rating - (b as any).rating;
        break;
      case 'name':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'sales':
        comparison = ((a as any).reviews || 0) - ((b as any).reviews || 0);
        break;
    }

    return order === 'Descending' ? -comparison : comparison;
  });

  const itemListElement: ItemListSchemaItem[] = sorted.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://erpvala.com/marketplace/item/${product.slug}`,
    image: product.thumbnail,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
    itemListOrder: order,
  };
}

// Generate ItemList schema for featured products
export function generateFeaturedItemListSchema(productIds: string[]): ItemListSchema {
  const featuredProducts = ITEMS.filter((item) => productIds.includes(item.id));

  const itemListElement: ItemListSchemaItem[] = featuredProducts.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://erpvala.com/marketplace/item/${product.slug}`,
    image: product.thumbnail,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
    itemListOrder: 'Ascending',
  };
}

// Generate ItemList schema for best sellers
export function generateBestSellersItemListSchema(limit: number = 10): ItemListSchema {
  const sortedBySales = [...ITEMS].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  const bestSellers = sortedBySales.slice(0, limit);

  const itemListElement: ItemListSchemaItem[] = bestSellers.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://erpvala.com/marketplace/item/${product.slug}`,
    image: product.thumbnail,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
    itemListOrder: 'Descending',
  };
}
