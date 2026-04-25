// Marketplace Categories Listing Page
// Shows all categories with item counts

import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, ChevronRight } from 'lucide-react';
import { CATEGORY_TREE } from '@/lib/marketplace-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CategoriesPage() {
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
              <Link to="/marketplace/categories" className="text-sm text-primary font-semibold">
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
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search 600,000+ items..."
                  className="pl-10"
                />
              </div>
            </div>

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
            <span className="text-foreground">Categories</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">All Categories</h1>
          <p className="text-muted-foreground mt-1">
            Browse our marketplace categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_TREE.map((category) => (
            <Link
              key={category.slug}
              to={`/marketplace/category?category=${category.slug}`}
              className="group block p-6 rounded-lg border bg-card hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {category.count.toLocaleString()} items
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.subs.slice(0, 3).map((sub) => (
                  <span
                    key={sub}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {sub}
                  </span>
                ))}
                {category.subs.length > 3 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    +{category.subs.length - 3} more
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
