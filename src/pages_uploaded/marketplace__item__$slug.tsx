import { Link, useNavigate, useParams} from "react-router-dom";
import { ITEMS, coverFor } from "@/lib/marketplace-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Download, Heart, Share2, ShieldCheck, RefreshCw, Calendar, Tag } from "lucide-react";
import { toast } from "sonner";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  addMarketplaceCartItem,
  addMarketplaceWishlistItem,
  getUiErrorMessage,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";
import {
  buildMarketplaceBreadcrumbJsonLd,
  buildMarketplaceFaqJsonLd,
  buildMarketplaceHreflangLinks,
  buildMarketplaceOrganizationJsonLd,
  buildMarketplaceProductJsonLd,
  buildMarketplaceProductMeta,
  canonicalizeSeoPath,
  normalizeSeoSlug,
  trackMarketplaceSeoMetric,
} from "@/lib/marketplace-seo";

({
  component: ItemDetail,
  head: ({ params }) => {
    const normalized = normalizeSeoSlug(params.slug);
    const item = ITEMS.find((entry) => entry.slug === normalized);
    if (!item) {
      return {
        meta: [
          { title: "Item not found - ERP Vala Marketplace" },
          {
            name: "description",
            content: "The requested marketplace item is unavailable.",
          },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }

    const seo = buildMarketplaceProductMeta(item);
    const hreflang = buildMarketplaceHreflangLinks(seo.canonicalPath);
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { name: "keywords", content: seo.keywords },
        { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large" },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:type", content: "product" },
        { property: "og:image", content: seo.image },
        { property: "og:url", content: seo.canonicalPath },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { name: "twitter:image", content: seo.image },
      ],
      links: [{ rel: "canonical", href: seo.canonicalPath }, ...hreflang],
    };
  },
});

function ItemDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams() as Record<string, string>;
  const normalizedSlug = normalizeSeoSlug(slug);
  const matched = ITEMS.find((i) => i.slug === normalizedSlug);
  const item = matched || (ITEMS.length > 0 ? ITEMS[0] : null);
  const seo = useMemo(() => item ? buildMarketplaceProductMeta(item) : null, [item]);
  const jsonLd = useMemo(
    () => item && seo ? buildMarketplaceProductJsonLd(item, seo.canonicalPath) : null,
    [item, seo?.canonicalPath],
  );
  const faqJsonLd = useMemo(() => item ? buildMarketplaceFaqJsonLd(item) : null, [item]);
  const breadcrumbJsonLd = useMemo(
    () => item && seo ? buildMarketplaceBreadcrumbJsonLd(item, seo.canonicalPath) : null,
    [item, seo?.canonicalPath],
  );
  const organizationJsonLd = useMemo(() => buildMarketplaceOrganizationJsonLd(), []);
  const related = item ? ITEMS.filter((i) => i.category === item.category && i.id !== item.id).slice(0, 4) : [];

  useEffect(() => {
    if (!matched) {
      navigate("/marketplace");
      return;
    }
    if (slug !== matched.slug) {
      navigate(`/marketplace/item/${matched.slug}`);
    }
  }, [matched, navigate, slug]);

  useEffect(() => {
    if (!item) return;
    trackMarketplaceSeoMetric(item.id, "view");
    const startedAt = Date.now();

    const onScroll = () => {
      if (typeof window === "undefined") return;
      const fullHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (fullHeight <= 0) return;
      const depth = Math.round((window.scrollY / fullHeight) * 100);
      trackMarketplaceSeoMetric(item.id, "scroll", depth);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      trackMarketplaceSeoMetric(item.id, "dwell", Date.now() - startedAt);
    };
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const url = new URL(window.location.href);
    const canonical = canonicalizeSeoPath(url.pathname, url.searchParams);
    const current = `${url.pathname}${url.search}`;
    if (canonical !== current) {
      navigate(`/marketplace/item/${item.slug}`);
    }
  }, [item?.slug, location.pathname, navigate]);

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Item not found</h1>
        <p className="text-muted-foreground">The requested marketplace item could not be found.</p>
        <Button className="mt-4" onClick={() => navigate("/marketplace")}>
          Return to Marketplace
        </Button>
      </div>
    );
  }

  const addToCartAction = useSelfHealingAction(
    async (payload: { itemId: string }, signal) => {
      if (signal.aborted) throw new Error("Add to cart aborted");
      return addMarketplaceCartItem(payload.itemId, "regular");
    },
    {
      id: "marketplace-item-add-to-cart",
      retry: { maxAttempts: 2, backoffMs: 500 },
      onSuccess: () => toast.success("Added to cart"),
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not add to cart.")),
    },
  );

  const handleAddToCart = async () => {
    await addToCartAction.trigger({ itemId: item.id });
  };

  const saveWishlistAction = useSelfHealingAction(
    async (payload: { itemId: string }, signal) => {
      if (signal.aborted) throw new Error("Save to wishlist aborted");
      return addMarketplaceWishlistItem(payload.itemId);
    },
    {
      id: "marketplace-item-save-wishlist",
      retry: { maxAttempts: 2, backoffMs: 500 },
      onSuccess: () => toast.success("Saved to wishlist"),
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not save to wishlist.")),
    },
  );

  const handleBuyNow = async () => {
    await addToCartAction.trigger({ itemId: item.id });
    navigate("/marketplace/checkout");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div className="text-xs text-muted-foreground mb-4">
        <Link to="/marketplace" className="hover:text-info">
          Marketplace
        </Link>{" "}
        /{" "}
        <Link
          to="/marketplace/category/$slug"
          className="hover:text-info capitalize"
        >
          {item.category.replace("-", " ")}
        </Link>{" "}
        / {item.title}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Hero */}
          <div
            className="aspect-[16/9] rounded-lg flex items-center justify-center text-white"
            style={{ background: coverFor(item.id) }}
          >
            <div className="text-center">
              <div className="text-6xl font-black">{item.title.slice(0, 1)}</div>
              <div className="mt-2 text-sm uppercase tracking-widest opacity-80">Live Preview</div>
            </div>
          </div>

          {/* Title */}
          <div className="mt-6">
            <h1 className="text-2xl md:text-3xl font-bold">{item.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-semibold">{item.rating}</span>
                <span className="text-muted-foreground">({item.reviews} reviews)</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{item.sales.toLocaleString()} sales</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">v{item.version}</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="mt-6">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({item.reviews})</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4 space-y-3 text-sm leading-relaxed">
              <p>{item.description}</p>
              <p>
                Includes full source code, comprehensive documentation, lifetime free updates, and 6
                months of author support. Built with industry-standard tools and best practices for
                performance, security and maintainability.
              </p>
              <h3 className="font-semibold mt-4">Key features</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fully responsive across all devices</li>
                <li>Clean, well-commented code</li>
                <li>Cross-browser compatibility</li>
                <li>SEO optimized structure</li>
                <li>Free lifetime updates</li>
                <li>Premium 6-month support</li>
              </ul>
            </TabsContent>
            <TabsContent value="reviews" className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                        U{i}
                      </div>
                      <div>
                        <div className="text-sm font-medium">Buyer{i}</div>
                        <div className="flex">
                          {Array(5)
                            .fill(0)
                            .map((_, j) => (
                              <Star key={j} className="h-3 w-3 fill-accent text-accent" />
                            ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">2 weeks ago</span>
                    </div>
                    <p className="text-sm">
                      Excellent quality and great support. Highly recommended for any project.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="comments" className="mt-4 text-sm text-muted-foreground">
              No public comments yet. Sign in to leave a comment.
            </TabsContent>
            <TabsContent value="support" className="mt-4 text-sm space-y-2">
              <p>Item Support includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Availability of the author to answer questions</li>
                <li>Answering technical questions about item's features</li>
                <li>Bug fixes and reported issues</li>
                <li>Help with included 3rd party assets</li>
              </ul>
            </TabsContent>
            <TabsContent value="changelog" className="mt-4 space-y-2 text-sm">
              <div className="border-l-2 border-success pl-3">
                <div className="font-medium">
                  v{item.version} — {item.lastUpdate}
                </div>
                <p className="text-muted-foreground text-xs">
                  Bug fixes, performance improvements, dependency updates.
                </p>
              </div>
              <div className="border-l-2 border-muted pl-3">
                <div className="font-medium">
                  v{(parseFloat(item.version) - 0.1).toFixed(1)}.0 — 2024-09-15
                </div>
                <p className="text-muted-foreground text-xs">
                  New widgets added, improved RTL support.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">${item.price}</span>
                <span className="text-xs text-muted-foreground">Regular License</span>
              </div>
              <Button
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                disabled={addToCartAction.isLoading}
                onClick={() => void handleAddToCart()}
              >
                Add to Cart
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                disabled={addToCartAction.isLoading}
                onClick={() => void handleBuyNow()}
              >
                Buy Now
              </Button>
              <Link
                to="/marketplace/preview/$slug"
                className="block mt-2"
              >
                <Button
                  variant="ghost"
                  className="w-full text-info hover:text-info"
                  onClick={() => trackMarketplaceSeoMetric(item.id, "click")}
                >
                  Live Preview →
                </Button>
              </Link>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  disabled={saveWishlistAction.isLoading}
                  onClick={() => {
                    trackMarketplaceSeoMetric(item.id, "click");
                    void saveWishlistAction.trigger({ itemId: item.id });
                  }}
                >
                  <Heart className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const shareUrl = `${origin}/marketplace/item/${item.slug}`;
                    if (typeof navigator !== "undefined") {
                      void navigator.clipboard?.writeText(shareUrl);
                    }
                    toast.success("Share link copied");
                  }}
                >
                  <Share2 className="h-3 w-3 mr-1" /> Share
                </Button>
              </div>

              <div className="mt-5 pt-5 border-t space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" /> Quality assured by ERP Vala
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 text-info" /> Free lifetime updates
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Download className="h-3.5 w-3.5 text-accent" /> Instant download after purchase
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <Link
                to="/marketplace/author/$username"
                className="flex items-center gap-3 group"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold">
                  {item.authorAvatar}
                </div>
                <div>
                  <div className="font-semibold group-hover:text-info">{item.author}</div>
                  <div className="text-xs text-muted-foreground">Elite Author · 4.7 ★</div>
                </div>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() =>
                  navigate(`/marketplace/author/${item.author}`)
                }
              >
                Contact Author
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Last update:</span>
                <span className="ml-auto">{item.lastUpdate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-auto">{item.created}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <span className="ml-auto capitalize">{item.subcategory}</span>
              </div>
              <div className="pt-2 border-t mt-2">
                <div className="text-muted-foreground mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <span key={t} className="bg-muted px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Related */}
      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">Related Items</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {related.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ItemDetail;
