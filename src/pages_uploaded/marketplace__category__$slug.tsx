import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";

import {
  ITEMS,
  CATEGORY_TREE,
  PRICE_BUCKETS,
  RATING_BUCKETS,
  SORT_OPTIONS,
  resolveCategory,
  flattenCategoryTree,
  countItemsForSub,
} from "@/lib/marketplace-data";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

({ component: CategoryPage });

function CategoryPage() {
  const { slug } = useParams() as Record<string, string>;
  const [sort, setSort] = useState("best-sellers");
  const [price, setPrice] = useState<number[]>([0, 200]);
  const [ratings, setRatings] = useState<number[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [nanos, setNanos] = useState<string[]>([]); // nano titles
  const [micros, setMicros] = useState<string[]>([]); // micro labels
  const [tags, setTags] = useState<string[]>([]);
  const [compat, setCompat] = useState<string[]>([]);

  const cat = resolveCategory(slug) || CATEGORY_TREE[0];
  const tagPool = cat.tagPool ?? [];
  const compatList = cat.compatibility ?? [];
  const flat = useMemo(() => flattenCategoryTree(cat), [cat]);

  // Base items: this category, with legacy fallback
  let items = ITEMS.filter((i) => i.category === cat.slug);
  if (items.length === 0) items = ITEMS;

  // Sub filter (works for both tree and legacy subs)
  if (subs.length) items = items.filter((i) => subs.includes(i.subcategory));

  // Nano filter — match nano title against tags/title/description
  if (nanos.length) {
    items = items.filter((i) =>
      nanos.some((n) => {
        const needle = n.toLowerCase();
        return (
          i.tags.some((t) => t.toLowerCase().includes(needle)) ||
          i.title.toLowerCase().includes(needle) ||
          i.description.toLowerCase().includes(needle)
        );
      }),
    );
  }

  // Micro filter — same matching strategy
  if (micros.length) {
    items = items.filter((i) =>
      micros.some((m) => {
        const needle = m.toLowerCase();
        return (
          i.tags.some((t) => t.toLowerCase().includes(needle)) ||
          i.title.toLowerCase().includes(needle) ||
          i.description.toLowerCase().includes(needle)
        );
      }),
    );
  }

  // Price + rating + tags + compatibility
  items = items.filter((i) => i.price >= price[0] && i.price <= price[1]);
  if (ratings.length) items = items.filter((i) => ratings.some((r) => i.rating >= r));
  if (tags.length) items = items.filter((i) => tags.every((t) => i.tags.includes(t))); // multi-tag = AND
  if (compat.length) {
    items = items.filter((i) =>
      compat.some((c) => {
        const needle = c.toLowerCase().split(/\s+/)[0];
        return i.tags.some((t) => t.toLowerCase().includes(needle));
      }),
    );
  }

  // Sort
  if (sort === "newest") items = [...items].sort((a, b) => b.created.localeCompare(a.created));
  if (sort === "updated") items = [...items].sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
  if (sort === "price-low") items = [...items].sort((a, b) => a.price - b.price);
  if (sort === "price-high") items = [...items].sort((a, b) => b.price - a.price);
  if (sort === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
  if (sort === "best-sellers" || sort === "trending")
    items = [...items].sort((a, b) => b.sales - a.sales);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground">Marketplace / Category</div>
        <h1 className="text-2xl font-bold mt-1">{cat.title}</h1>
        <p className="text-sm text-muted-foreground">
          {cat.count.toLocaleString()} items · Showing {items.length}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          {/* Subcategories with nano / micro tree + counts */}
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3">Categories</div>
              {cat.tree && cat.tree.length > 0 ? (
                <div className="space-y-3">
                  {cat.tree.map((sub) => {
                    const subCount = sub.count ?? countItemsForSub(cat.slug, sub.title);
                    return (
                      <div key={sub.slug}>
                        <label className="flex items-center justify-between gap-2 text-sm cursor-pointer">
                          <span className="flex items-center gap-2">
                            <Checkbox
                              checked={subs.includes(sub.title)}
                              onCheckedChange={() => toggle(subs, setSubs, sub.title)}
                            />
                            <span className="font-medium">{sub.title}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">{subCount.toLocaleString()}</span>
                        </label>
                        {sub.nano && (
                          <div className="ml-6 mt-1 space-y-1">
                            {sub.nano.map((n) => {
                              const node = flat.find(
                                (f) => f.path[0] === sub.title && f.path[1] === n.title && !f.micro,
                              );
                              return (
                                <div key={n.slug}>
                                  <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
                                    <span className="flex items-center gap-2">
                                      <Checkbox
                                        checked={nanos.includes(n.title)}
                                        onCheckedChange={() => toggle(nanos, setNanos, n.title)}
                                      />
                                      <span>{n.title}</span>
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {(node?.count ?? 0).toLocaleString()}
                                    </span>
                                  </label>
                                  {n.micro && nanos.includes(n.title) && (
                                    <div className="ml-5 mt-1 flex flex-wrap gap-1">
                                      {n.micro.map((m) => {
                                        const microNode = flat.find(
                                          (f) =>
                                            f.path[0] === sub.title &&
                                            f.path[1] === n.title &&
                                            f.micro === m,
                                        );
                                        return (
                                          <button
                                            key={m}
                                            onClick={() => toggle(micros, setMicros, m)}
                                            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${micros.includes(m) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
                                          >
                                            {m}
                                            <span className="ml-1 opacity-60">{microNode?.count ?? 0}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {cat.subs.map((s) => (
                    <label key={s} className="flex items-center justify-between gap-2 text-sm cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={subs.includes(s)}
                          onCheckedChange={() => toggle(subs, setSubs, s)}
                        />
                        <span>{s}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {countItemsForSub(cat.slug, s).toLocaleString()}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price */}
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3">Price Range</div>
              <Slider value={price} onValueChange={setPrice} min={0} max={200} step={5} className="mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${price[0]}</span>
                <span>${price[1]}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {PRICE_BUCKETS.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => setPrice([b.min, b.max])}
                    className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-accent"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3">Rating</div>
              <div className="space-y-2">
                {RATING_BUCKETS.filter((r) => r >= 3).map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={ratings.includes(r)}
                      onCheckedChange={() => toggle(ratings.map(String), (v) => setRatings(v.map(Number)), String(r))}
                    />
                    <span>{r}+ stars</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tag pool */}
          {tagPool.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-3">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {tagPool.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggle(tags, setTags, t)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${tags.includes(t) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {tags.length > 0 && (
                  <button
                    onClick={() => setTags([])}
                    className="mt-2 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear tags
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compatibility */}
          {compatList.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-3">Compatibility</div>
                <div className="flex flex-wrap gap-1">
                  {compatList.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggle(compat, setCompat, c)}
                      className={`text-[11px] px-2 py-1 rounded border transition-colors ${compat.includes(c) ? "bg-info text-white border-info" : "border-border hover:bg-muted"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>

        {/* Items grid */}
        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{items.length} results</span>
              {(subs.length || nanos.length || micros.length || tags.length || compat.length) > 0 && (
                <button
                  onClick={() => {
                    setSubs([]); setNanos([]); setMicros([]); setTags([]); setCompat([]);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear all
                </button>
              )}
              {[...subs, ...nanos, ...micros].slice(0, 4).map((f) => (
                <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
              ))}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No items match your filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
