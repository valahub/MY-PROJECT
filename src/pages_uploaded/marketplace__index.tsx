import { Link } from "react-router-dom";
import { ITEMS, CATEGORY_TREE, AUTHORS } from "@/lib/marketplace-data";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Award, Sparkles, Users } from "lucide-react";

({ component: MarketplaceHome });

function MarketplaceHome() {
  const featured = ITEMS.slice(0, 4);
  const trending = ITEMS.slice(4, 12);
  const topAuthors = AUTHORS.filter((a) => a.featured).slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Featured */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Featured Items</h2>
          </div>
          <Link
            to="/marketplace/authors"
            className="text-sm text-info hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-bold">Browse Categories</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {CATEGORY_TREE.map((cat) => (
            <Link
              key={cat.slug}
              to={`/marketplace/category/${cat.slug}`}
              className="rounded-lg border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="font-semibold">{cat.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {cat.count.toLocaleString()} items
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {cat.subs.slice(0, 3).map((s) => (
                  <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-success" />
          <h2 className="text-xl font-bold">Trending This Week</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {trending.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Top authors */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-secondary" />
          <h2 className="text-xl font-bold">Featured Authors</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {topAuthors.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold">
                  {a.avatar}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{a.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.level} · {a.country}
                  </div>
                  <div className="text-xs mt-1">
                    {a.items} items · {a.sales.toLocaleString()} sales
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Become author CTA */}
      <section className="rounded-xl bg-gradient-to-br from-secondary to-accent text-white p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Sell your work to a global audience</h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">
          Join 60,000+ authors earning passive income from their digital creations.
        </p>
        <Link
          to="/marketplace/become-author"
          className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-md transition-colors"
        >
          Become an author →
        </Link>
      </section>
    </div>
  );
}

export default MarketplaceHome;
