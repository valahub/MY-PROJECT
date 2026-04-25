// Marketplace Search Page
// Search results page with filtering and sorting

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { ITEMS, CATEGORY_TREE, type MarketItem } from '@/lib/marketplace-data';
import { marketplaceFilterService, type FilterOptions, type SortOption } from '@/lib/marketplace-filter';
import { ItemCard } from '@/components/marketplace/ItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [sortOption, setSortOption] = useState<SortOption>('best-selling');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Get all categories and subcategories
  const allCategories = CATEGORY_TREE.map((cat) => cat.slug);
  const allSubcategories = useMemo(() => {
    const subs = new Set(ITEMS.map((item) => item.subcategory));
    return Array.from(subs).sort();
  }, []);

  // Get price range for all items
  const globalPriceRange = useMemo(() => {
    return marketplaceFilterService.getPriceRange(ITEMS);
  }, []);

  // Initialize price range
  useEffect(() => {
    setPriceRange([globalPriceRange.min, globalPriceRange.max]);
  }, [globalPriceRange]);

  // Filter and sort items
  const { items: filteredItems, filteredCount } = useMemo(() => {
    const filterOptions: FilterOptions = {
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      searchQuery: searchQuery || undefined,
    };

    return marketplaceFilterService.filterAndSort(ITEMS, filterOptions, sortOption);
  }, [selectedCategories, selectedSubcategories, priceRange, sortOption, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredCount / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Toggle category
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
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
              <Link to="/marketplace/profile" className="text-muted-foreground hover:text-foreground transition-colors">
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
                to={`/marketplace/category?category=${cat.slug}`}
                className="text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
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
            <span className="text-foreground">Search</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Search Title Block */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Search'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredCount} result{filteredCount !== 1 ? 's' : ''}
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

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                  {CATEGORY_TREE.map((cat) => (
                    <label key={cat.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedCategories.includes(cat.slug)}
                        onCheckedChange={() => toggleCategory(cat.slug)}
                      />
                      <span className="text-muted-foreground">{cat.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Subcategories</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allSubcategories.map((sub) => (
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
                    min={globalPriceRange.min}
                    max={globalPriceRange.max}
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

              {/* Clear Filters */}
              {(selectedCategories.length > 0 ||
                selectedSubcategories.length > 0 ||
                priceRange[0] !== globalPriceRange.min ||
                priceRange[1] !== globalPriceRange.max) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedSubcategories([]);
                    setPriceRange([globalPriceRange.min, globalPriceRange.max]);
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
                    setSelectedCategories([]);
                    setSelectedSubcategories([]);
                    setPriceRange([globalPriceRange.min, globalPriceRange.max]);
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
  );
}
