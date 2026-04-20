import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMarketplaceCart } from "@/lib/ui-actions-api";

({
  component: MarketplaceLayout,
  head: () => ({
    meta: [
      { title: "ERP Vala Marketplace — Code, Themes, Plugins & Apps" },
      {
        name: "description",
        content:
          "Browse thousands of code scripts, themes, plugins, and digital assets from top authors worldwide.",
      },
    ],
  }),
});

const CATEGORIES = [
  { slug: "wordpress", title: "WordPress", count: 45230 },
  { slug: "html-templates", title: "HTML Templates", count: 12840 },
  { slug: "ecommerce", title: "eCommerce", count: 8120 },
  { slug: "php-scripts", title: "PHP Scripts", count: 9450 },
  { slug: "javascript", title: "JavaScript", count: 6230 },
  { slug: "mobile", title: "Mobile", count: 4120 },
  { slug: "themes", title: "CMS Themes", count: 7890 },
  { slug: "plugins", title: "Plugins", count: 5430 },
];

function MarketplaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const [headerQ, setHeaderQ] = useState("");
  const [heroQ, setHeroQ] = useState("");
  const [mobileQ, setMobileQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const isHome = location.pathname === "/marketplace" || location.pathname === "/marketplace/";
  const submitSearch = (q: string) => navigate({ to: "/marketplace/search", search: { q } });

  useEffect(() => {
    let mounted = true;
    const refreshCartCount = () => {
      void getMarketplaceCart().then((items) => {
        if (!mounted) return;
        setCartCount(items.length);
      });
    };

    refreshCartCount();
    const onStoreUpdate = () => refreshCartCount();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "erpvala.ui.store.v1") refreshCartCount();
    };

    window.addEventListener("erpvala:ui-store-updated", onStoreUpdate);
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("erpvala:ui-store-updated", onStoreUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar — dark navy */}
      <header className="bg-sidebar text-white">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Link to="/marketplace" className="text-lg font-bold whitespace-nowrap">
            ERP Vala<span className="text-primary">Market</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            <Link to="/marketplace" className="px-3 py-1.5 text-sm hover:bg-white/10 rounded">
              Browse
            </Link>
            <Link
              to="/marketplace/category/$slug"
              className="px-3 py-1.5 text-sm hover:bg-white/10 rounded"
            >
              Categories
            </Link>
            <Link
              to="/marketplace/authors"
              className="px-3 py-1.5 text-sm hover:bg-white/10 rounded"
            >
              Authors
            </Link>
            <Link to="/marketplace/blog" className="px-3 py-1.5 text-sm hover:bg-white/10 rounded">
              Blog
            </Link>
            <Link
              to="/marketplace/forums"
              className="px-3 py-1.5 text-sm hover:bg-white/10 rounded"
            >
              Forums
            </Link>
          </nav>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(headerQ);
            }}
            className="flex-1 max-w-xl hidden md:block"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={headerQ}
                onChange={(e) => setHeaderQ(e.target.value)}
                placeholder="Search 600,000+ items..."
                className="pl-9 h-9 bg-white text-foreground"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              to="/marketplace/wishlist"
              className="p-2 hover:bg-white/10 rounded hidden sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <Link to="/marketplace/cart" className="relative p-2 hover:bg-white/10 rounded">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>
            <Link to="/marketplace/author/dashboard" className="hidden sm:inline-flex">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <User className="h-4 w-4 mr-1" /> Author
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            </Link>
            <button onClick={() => setMobileNav(!mobileNav)} className="lg:hidden p-1.5">
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Category strip */}
        <div className="border-t border-white/10 hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-2 text-xs">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  to="/marketplace/category/$slug"
                  className={cn(
                    "px-3 py-1 rounded whitespace-nowrap hover:bg-white/10 transition-colors",
                    location.pathname.includes(c.slug) && "bg-white/10 font-medium",
                  )}
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {mobileNav && (
          <div className="lg:hidden border-t border-white/10 px-4 py-3 space-y-1">
            <div className="md:hidden mb-3">
              <Input
                value={mobileQ}
                onChange={(e) => setMobileQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitSearch(mobileQ);
                    setMobileNav(false);
                  }
                }}
                placeholder="Search..."
                className="bg-white text-foreground"
              />
            </div>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to="/marketplace/category/$slug"
                className="block py-1.5 text-sm"
              >
                {c.title}{" "}
                <span className="text-white/50 text-xs">({c.count.toLocaleString()})</span>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Hero — only on home */}
      {isHome && (
        <section className="bg-gradient-to-br from-secondary via-accent to-info text-white">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">600,000+ digital assets</h1>
            <p className="text-lg text-white/80 mb-6">
              Code, themes, plugins, graphics, and more from world-class creators.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(heroQ);
              }}
              className="max-w-2xl mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={heroQ}
                onChange={(e) => setHeroQ(e.target.value)}
                placeholder="Try 'react dashboard', 'wordpress theme', 'mobile app'..."
                className="pl-12 h-12 bg-white text-foreground text-base"
              />
              <Button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 h-9"
              >
                Search
              </Button>
            </form>
            <div className="mt-4 text-sm text-white/70">
              Popular:{" "}
              <Link
                to="/marketplace/category/$slug"
                className="underline hover:text-white"
              >
                WordPress
              </Link>
              {" · "}
              <Link
                to="/marketplace/category/$slug"
                className="underline hover:text-white"
              >
                HTML Templates
              </Link>
              {" · "}
              <Link
                to="/marketplace/category/$slug"
                className="underline hover:text-white"
              >
                eCommerce
              </Link>
            </div>
          </div>
        </section>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-sidebar text-white/70 mt-12">
        <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="text-white font-bold text-lg mb-2">
              ERP Vala<span className="text-primary">Market</span>
            </div>
            <p className="text-xs">
              The world's largest digital asset marketplace for creators and businesses.
            </p>
          </div>
          <div>
            <div className="text-white font-medium mb-2">Marketplace</div>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to="/marketplace" className="hover:text-white">
                  Browse all
                </Link>
              </li>
              <li>
                <Link to="/marketplace/search" className="hover:text-white">
                  Search
                </Link>
              </li>
              <li>
                <Link to="/marketplace/authors" className="hover:text-white">
                  Authors
                </Link>
              </li>
              <li>
                <Link to="/marketplace/wishlist" className="hover:text-white">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/marketplace/compare" className="hover:text-white">
                  Compare
                </Link>
              </li>
              <li>
                <Link to="/marketplace/blog" className="hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/marketplace/forums" className="hover:text-white">
                  Forums
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-2">Sell</div>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to="/marketplace/become-author" className="hover:text-white">
                  Become an author
                </Link>
              </li>
              <li>
                <Link to="/marketplace/author/dashboard" className="hover:text-white">
                  Author dashboard
                </Link>
              </li>
              <li>
                <Link to="/marketplace/author/upload" className="hover:text-white">
                  Upload item
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-2">Support</div>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to="/" className="hover:text-white">
                  Switch panel
                </Link>
              </li>
              <li>
                <Link to="/admin/marketplace" className="hover:text-white">
                  Marketplace Admin
                </Link>
              </li>
              <li>
                <Link to="/marketplace/forums" className="hover:text-white">
                  Help center
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs">
          © 2024 ERP Vala Marketplace
        </div>
      </footer>
    </div>
  );
}
