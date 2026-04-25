// Marketplace Category Page
// WordPress category page with full filtering, sorting, and product grid

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, ChevronRight, SlidersHorizontal, Star } from 'lucide-react';
import { ITEMS, CATEGORY_TREE, type MarketItem } from '@/lib/marketplace-data';
import { marketplaceFilterService, type FilterOptions, type SortOption } from '@/lib/marketplace-filter';
import { ItemCard } from '@/components/marketplace/ItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { buildCategoryMeta, buildCategoryJsonLd } from '@/lib/marketplace-seo';
import { validateCategorySlug, validateSearchQuery, validateQueryParams } from '@/lib/marketplace/access-control';

export default function CategoryPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Security: Validate category slug
  const slugValidation = validateCategorySlug(slug || '');
  const categorySlug = slugValidation.valid ? slugValidation.sanitized : 'plugins';
  
  // Redirect if invalid slug
  useEffect(() => {
    if (!slugValidation.valid && slug) {
      navigate('/marketplace', { replace: true });
    }
  }, [slugValidation.valid, slug, navigate]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([0, 100]);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('best-selling');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Get category info
  const categoryInfo = CATEGORY_TREE.find((cat) => cat.slug === categorySlug) || CATEGORY_TREE[0];

  // Get subcategories for current category
  const availableSubcategories = useMemo(() => {
    // For plugins category, use specific framework options
    if (categorySlug === 'plugins') {
      return ['jQuery', 'Vue', 'React', 'Angular'];
    }
    // For themes category, use CMS options
    if (categorySlug === 'themes') {
      return ['Drupal', 'Joomla', 'Ghost', 'Concrete5'];
    }
    // For javascript category, use functional options
    if (categorySlug === 'javascript') {
      return ['UI', 'POS', 'Charts', 'Forms', 'Tools'];
    }
    // For mobile category, use app category options
    if (categorySlug === 'mobile') {
      return ['Food', 'Social', 'Health', 'Fitness', 'Travel'];
    }
    // For php-scripts category, use script type options
    if (categorySlug === 'php-scripts') {
      return ['CRM', 'CMS', 'Productivity', 'Starter', 'Forms'];
    }
    // For ecommerce category, use platform options
    if (categorySlug === 'ecommerce') {
      return ['Shopify', 'WooCommerce', 'Magento', 'Marketplace'];
    }
    // For html-templates category, use template type options
    if (categorySlug === 'html-templates') {
      return ['Admin', 'Landing', 'Retail', 'Corporate', 'Portfolio'];
    }
    return marketplaceFilterService.getSubcategoriesForCategory(ITEMS, categorySlug);
  }, [categorySlug]);

  // Get price range for current category
  const categoryPriceRange = useMemo(() => {
    // For plugins category, use $0-$200 range
    if (categorySlug === 'plugins') {
      return { min: 0, max: 200 };
    }
    // For themes category, use $0-$200 range
    if (categorySlug === 'themes') {
      return { min: 0, max: 200 };
    }
    // For javascript category, use $0-$200 range
    if (categorySlug === 'javascript') {
      return { min: 0, max: 200 };
    }
    // For mobile category, use $0-$200 range
    if (categorySlug === 'mobile') {
      return { min: 0, max: 200 };
    }
    // For php-scripts category, use $0-$200 range
    if (categorySlug === 'php-scripts') {
      return { min: 0, max: 200 };
    }
    // For ecommerce category, use $0-$200 range
    if (categorySlug === 'ecommerce') {
      return { min: 0, max: 200 };
    }
    // For html-templates category, use $0-$200 range
    if (categorySlug === 'html-templates') {
      return { min: 0, max: 200 };
    }
    const categoryItems = ITEMS.filter((item) => item.category === categorySlug);
    return marketplaceFilterService.getPriceRange(categoryItems);
  }, [categorySlug]);

  // Get all available tags for current category
  const availableTags = useMemo(() => {
    // For plugins category, use specific tag options
    if (categorySlug === 'plugins') {
      return ['react', 'vue', 'tailwind', 'wordpress', 'laravel', 'flutter'];
    }
    // For themes category, use specific tag options
    if (categorySlug === 'themes') {
      return ['react', 'vue', 'tailwind', 'wordpress', 'laravel', 'flutter'];
    }
    // For javascript category, use specific tag options
    if (categorySlug === 'javascript') {
      return ['react', 'vue', 'tailwind', 'wordpress', 'laravel', 'flutter'];
    }
    // For mobile category, use specific tag options
    if (categorySlug === 'mobile') {
      return ['react', 'vue', 'tailwind', 'wordpress', 'laravel', 'flutter'];
    }
    // For php-scripts category, use specific tag options
    if (categorySlug === 'php-scripts') {
      return ['react', 'vue', 'tailwind', 'wordpress', 'laravel', 'flutter'];
    }
    // For ecommerce category, use specific tag options
    if (categorySlug === 'ecommerce') {
      return ['react', 'vue', 'tailwind', 'wordpress', 'laravel', 'flutter'];
    }
    // For html-templates category, use specific tag options
    if (categorySlug === 'html-templates') {
      return ['react', 'vue', 'tailwind', 'wordpress', 'laravel', 'flutter'];
    }
    const categoryItems = ITEMS.filter((item) => item.category === categorySlug);
    const tags = new Set<string>();
    categoryItems.forEach((item) => {
      item.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [categorySlug]);

  // Rating options
  const ratingOptions = [
    { value: 4.5, label: '4.5+ stars' },
    { value: 4.0, label: '4+ stars' },
    { value: 3.5, label: '3.5+ stars' },
    { value: 3.0, label: '3+ stars' },
  ];

  // Initialize price range
  useEffect(() => {
    setPriceRange([categoryPriceRange.min, categoryPriceRange.max]);
    setDebouncedPriceRange([categoryPriceRange.min, categoryPriceRange.max]);
  }, [categoryPriceRange]);

  // Initialize filters from URL params
  useEffect(() => {
    const subcategory = searchParams.get('subcategory');
    const minPrice = searchParams.get('min');
    const maxPrice = searchParams.get('max');
    const rating = searchParams.get('rating');
    const tags = searchParams.get('tags');
    const sort = searchParams.get('sort');

    if (subcategory) {
      setSelectedSubcategories(subcategory.split(','));
    }
    if (minPrice && maxPrice) {
      setPriceRange([parseInt(minPrice), parseInt(maxPrice)]);
      setDebouncedPriceRange([parseInt(minPrice), parseInt(maxPrice)]);
    }
    if (rating) {
      setSelectedRating(parseFloat(rating));
    }
    if (tags) {
      setSelectedTags(tags.split(','));
    }
    if (sort) {
      setSortOption(sort as SortOption);
    }
  }, [searchParams]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedSubcategories.length > 0) {
      params.set('subcategory', selectedSubcategories.join(','));
    }
    if (debouncedPriceRange[0] !== categoryPriceRange.min || debouncedPriceRange[1] !== categoryPriceRange.max) {
      params.set('min', debouncedPriceRange[0].toString());
      params.set('max', debouncedPriceRange[1].toString());
    }
    if (selectedRating !== undefined) {
      params.set('rating', selectedRating.toString());
    }
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
    }
    if (sortOption !== 'best-selling') {
      params.set('sort', sortOption);
    }

    setSearchParams(params);
  }, [selectedSubcategories, debouncedPriceRange, selectedRating, selectedTags, sortOption, categoryPriceRange, setSearchParams]);

  // Debounce price range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 300);
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Filter and sort items
  const { items: filteredItems, filteredCount } = useMemo(() => {
    const filterOptions: FilterOptions = {
      category: categorySlug,
      subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : undefined,
      minPrice: debouncedPriceRange[0],
      maxPrice: debouncedPriceRange[1],
      minRating: selectedRating,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      searchQuery: searchQuery || undefined,
    };

    const result = marketplaceFilterService.filterAndSort(ITEMS, filterOptions, sortOption);
    
    // Self-heal: Skip broken products (missing title, price, or thumbnail)
    const validItems = result.items.filter((item) => {
      return item.title && item.price !== undefined && item.price >= 0 && item.thumbnail;
    });

    return {
      items: validItems,
      filteredCount: validItems.length,
    };
  }, [categorySlug, selectedSubcategories, debouncedPriceRange, selectedRating, selectedTags, sortOption, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredCount / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Security: Validate search query
    const validation = validateSearchQuery(searchQuery);
    if (validation.valid && searchQuery.trim()) {
      navigate(`/marketplace/search?q=${encodeURIComponent(validation.sanitized)}`);
    }
  };

  // Toggle subcategory
  const toggleSubcategory = (subcategory: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategory)
        ? prev.filter((s) => s !== subcategory)
        : [...prev, subcategory]
    );
    setCurrentPage(1);
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SEO Meta
  const seoMeta = buildCategoryMeta(categorySlug);
  const jsonLd = buildCategoryJsonLd(categorySlug, seoMeta.canonicalPath);

  return (
    <>
      <SeoMeta
        title={seoMeta.title}
        description={seoMeta.description}
        keywords={seoMeta.keywords}
        canonicalPath={seoMeta.canonicalPath}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/marketplace" className="text-xl font-bold text-foreground">
              ERP ValaMarket
            </Link>

            {/* Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/marketplace" className="text-sm text-foreground hover:text-primary transition-colors">
                Browse
              </Link>
              <Link to="/marketplace/categories" className="text-sm text-foreground hover:text-primary transition-colors">
                Categories
              </Link>
              <Link to="/marketplace/authors" className="text-sm text-foreground hover:text-primary transition-colors">
                Authors
              </Link>
              <Link to="/marketplace/blog" className="text-sm text-foreground hover:text-primary transition-colors">
                Blog
              </Link>
              <Link to="/marketplace/forums" className="text-sm text-foreground hover:text-primary transition-colors">
                Forums
              </Link>
            </nav>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search 600,000+ items..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Header Right Icons */}
            <div className="flex items-center gap-4">
              <Link to="/marketplace/wishlist" className="text-muted-foreground hover:text-foreground transition-colors">
                <Heart className="h-5 w-5" />
              </Link>
              <Link to="/marketplace/cart" className="text-muted-foreground hover:text-foreground transition-colors">
                <ShoppingCart className="h-5 w-5" />
              </Link>
              <Link to="/marketplace/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-5 w-5" />
              </Link>
              <Link to="/login">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Nav Strip */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto py-3">
            {CATEGORY_TREE.map((cat) => (
              <Link
                key={cat.slug}
                to={`/marketplace/category/${cat.slug}`}
                className={`text-sm whitespace-nowrap transition-colors ${
                  cat.slug === categorySlug
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/marketplace" className="hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{categoryInfo.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Category Title Block */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{categoryInfo.title}</h1>
          <p className="text-muted-foreground mt-1">
            {categoryInfo.count.toLocaleString()} items
          </p>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Filter Panel */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </div>

              {/* Subcategories */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Subcategories</h3>
                <div className="space-y-2">
                  {availableSubcategories.map((sub) => (
                    <label key={sub} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedSubcategories.includes(sub)}
                        onCheckedChange={() => toggleSubcategory(sub)}
                      />
                      <span className="text-muted-foreground">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Price Range</h3>
                <div className="space-y-4">
                  <Slider
                    min={categoryPriceRange.min}
                    max={categoryPriceRange.max}
                    step={1}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Rating</h3>
                <div className="space-y-2">
                  {ratingOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedRating === option.value}
                        onCheckedChange={() => setSelectedRating(selectedRating === option.value ? undefined : option.value)}
                      />
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span className="text-muted-foreground">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {(selectedSubcategories.length > 0 ||
                priceRange[0] !== categoryPriceRange.min ||
                priceRange[1] !== categoryPriceRange.max ||
                selectedRating !== undefined ||
                selectedTags.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubcategories([]);
                    setPriceRange([categoryPriceRange.min, categoryPriceRange.max]);
                    setSelectedRating(undefined);
                    setSelectedTags([]);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Sort and Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {filteredCount} result{filteredCount !== 1 ? 's' : ''}
              </p>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best-selling">Best selling</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="highest-rated">Highest rated</SelectItem>
                  <SelectItem value="price-low-high">Price Low → High</SelectItem>
                  <SelectItem value="price-high-low">Price High → Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Grid */}
            {paginatedItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedItems.map((item) => (
                    <ItemCard item={item} key={item.id} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              // Empty State
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your filters or search terms
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubcategories([]);
                    setPriceRange([categoryPriceRange.min, categoryPriceRange.max]);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
