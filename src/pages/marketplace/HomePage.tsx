// Marketplace Homepage
// Full homepage with hero section, featured items, and navigation

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, ArrowRight } from 'lucide-react';
import { ITEMS, CATEGORY_TREE } from '@/lib/marketplace-data';
import { ItemCard } from '@/components/marketplace/ItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { buildHomepageMeta, buildHomepageJsonLd } from '@/lib/marketplace-seo';

export default function HomePage() {
  const navigate = useNavigate();
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  // Featured items (top rated/high sales)
  const featuredItems = ITEMS.filter((item) => item.status === 'live')
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 8);

  // SEO Meta
  const seoMeta = buildHomepageMeta();
  const jsonLd = buildHomepageJsonLd(seoMeta.canonicalPath);

  // Handle hero search
  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      navigate(`/marketplace/search?q=${encodeURIComponent(heroSearchQuery)}`);
    }
  };

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
              <Link to="/marketplace" className="text-sm text-primary font-semibold">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            600,000+ digital assets
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Code, themes, plugins, graphics, and more from creators worldwide
          </p>

          {/* Hero Search Bar */}
          <form onSubmit={handleHeroSearch} className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Try 'react dashboard', 'wordpress theme', 'mobile app'..."
                  className="pl-12 h-12 text-lg"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Search
              </Button>
            </div>
          </form>

          {/* Popular Links */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Popular:</span>
            <Link
              to="/marketplace/category?category=wordpress"
              className="text-primary hover:underline"
            >
              WordPress
            </Link>
            <Link
              to="/marketplace/category?category=html-templates"
              className="text-primary hover:underline"
            >
              HTML Templates
            </Link>
            <Link
              to="/marketplace/category?category=ecommerce"
              className="text-primary hover:underline"
            >
              eCommerce
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Featured Items Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Featured Items</h2>
            <Link
              to="/marketplace/category?category=wordpress"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <ItemCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No featured items available
            </div>
          )}
        </section>

        {/* Categories Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_TREE.map((cat) => (
              <Link
                key={cat.slug}
                to={`/marketplace/category?category=${cat.slug}`}
                className="group block p-6 rounded-lg border bg-card hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cat.count.toLocaleString()} items
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {cat.subs.slice(0, 3).map((sub) => (
                    <span
                      key={sub}
                      className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {sub}
                    </span>
                  ))}
                  {cat.subs.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      +{cat.subs.length - 3} more
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Items */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Trending This Week</h2>
            <Link
              to="/marketplace/category?category=wordpress"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ITEMS.slice(0, 8).map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
