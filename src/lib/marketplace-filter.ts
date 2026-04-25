// Marketplace Filter and Sort Service
// Filters and sorts marketplace items based on category, subcategory, price, and sort options

import type { MarketItem } from './marketplace-data';

export interface FilterOptions {
  category?: string;
  categories?: string[];
  subcategories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string[];
  searchQuery?: string;
}

export type SortOption = 'best-selling' | 'newest' | 'price-low-high' | 'price-high-low';

export interface MarketplaceFilterResult {
  items: MarketItem[];
  totalCount: number;
  filteredCount: number;
}

export class MarketplaceFilterService {
  // ============================================
  // FILTER ITEMS
  // ============================================

  filterItems(items: MarketItem[], options: FilterOptions): MarketItem[] {
    let filtered = [...items];

    // Filter by category
    if (options.category) {
      filtered = filtered.filter((item) => item.category === options.category);
    }

    // Filter by categories (multiple)
    if (options.categories && options.categories.length > 0) {
      filtered = filtered.filter((item) =>
        options.categories!.includes(item.category)
      );
    }

    // Filter by subcategories
    if (options.subcategories && options.subcategories.length > 0) {
      filtered = filtered.filter((item) =>
        options.subcategories!.includes(item.subcategory)
      );
    }

    // Filter by price range
    if (options.minPrice !== undefined) {
      filtered = filtered.filter((item) => item.price >= options.minPrice!);
    }

    if (options.maxPrice !== undefined) {
      filtered = filtered.filter((item) => item.price <= options.maxPrice!);
    }

    // Filter by rating
    if (options.minRating !== undefined) {
      filtered = filtered.filter((item) => item.rating >= options.minRating!);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter((item) =>
        options.tags!.some((tag) => item.tags.includes(tag))
      );
    }

    // Filter by search query
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  // ============================================
  // SORT ITEMS
  // ============================================

  sortItems(items: MarketItem[], sortOption: SortOption): MarketItem[] {
    const sorted = [...items];

    switch (sortOption) {
      case 'best-selling':
        sorted.sort((a, b) => b.sales - a.sales);
        break;

      case 'newest':
        sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        break;

      case 'price-low-high':
        sorted.sort((a, b) => a.price - b.price);
        break;

      case 'price-high-low':
        sorted.sort((a, b) => b.price - a.price);
        break;

      default:
        break;
    }

    return sorted;
  }

  // ============================================
  // FILTER AND SORT
  // ============================================

  filterAndSort(items: MarketItem[], options: FilterOptions, sortOption: SortOption): MarketplaceFilterResult {
    const filtered = this.filterItems(items, options);
    const sorted = this.sortItems(filtered, sortOption);

    return {
      items: sorted,
      totalCount: items.length,
      filteredCount: sorted.length,
    };
  }

  // ============================================
  // GET PRICE RANGE
  // ============================================

  getPriceRange(items: MarketItem[]): { min: number; max: number } {
    if (items.length === 0) {
      return { min: 0, max: 100 };
    }

    const prices = items.map((item) => item.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  // ============================================
  // GET SUBCATEGORIES FOR CATEGORY
  // ============================================

  getSubcategoriesForCategory(items: MarketItem[], category: string): string[] {
    const subcategories = new Set(
      items
        .filter((item) => item.category === category)
        .map((item) => item.subcategory)
    );
    return Array.from(subcategories).sort();
  }

  // ============================================
  // GET CATEGORY COUNT
  // ============================================

  getCategoryCount(items: MarketItem[], category: string): number {
    return items.filter((item) => item.category === category).length;
  }
}

// Export singleton instance
export const marketplaceFilterService = new MarketplaceFilterService();
