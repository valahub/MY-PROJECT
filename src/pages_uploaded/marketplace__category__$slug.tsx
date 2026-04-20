
import { ITEMS, CATEGORY_TREE } from "@/lib/marketplace-data";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

({ component: CategoryPage });

function CategoryPage() {
  const { slug } = Route.useParams();
  const [sort, setSort] = useState("popular");
  const [price, setPrice] = useState([0, 200]);
  const [ratings, setRatings] = useState<number[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const cat = CATEGORY_TREE.find((c) => c.slug === slug) || CATEGORY_TREE[0];
  let items = ITEMS.filter((i) => i.category === slug);
  if (items.length === 0) items = ITEMS;

  items = items.filter((i) => i.price >= price[0] && i.price <= price[1]);
  if (ratings.length) items = items.filter((i) => ratings.some((r) => i.rating >= r));
  if (subs.length) items = items.filter((i) => subs.includes(i.subcategory));
  if (tags.length) items = items.filter((i) => i.tags.some((tag) => tags.includes(tag)));

  if (sort === "newest") items = [...items].sort((a, b) => b.created.localeCompare(a.created));
  if (sort === "price-low") items = [...items].sort((a, b) => a.price - b.price);
  if (sort === "price-high") items = [...items].sort((a, b) => b.price - a.price);
  if (sort === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
  if (sort === "popular") items = [...items].sort((a, b) => b.sales - a.sales);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground">Marketplace / Category</div>
        <h1 className="text-2xl font-bold mt-1">{cat.title}</h1>
        <p className="text-sm text-muted-foreground">
          {cat.count.toLocaleString()} items · Showing {items.length}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3">Subcategories</div>
              <div className="space-y-2">
                {cat.subs.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={subs.includes(s)}
                      onCheckedChange={(checked) =>
                        setSubs(checked ? [...subs, s] : subs.filter((entry) => entry !== s))
                      }
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3">Price Range</div>
              <Slider
                value={price}
                onValueChange={setPrice}
                min={0}
                max={200}
                step={5}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${price[0]}</span>
                <span>${price[1]}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3">Rating</div>
              <div className="space-y-2">
                {[4.5, 4, 3.5, 3].map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={ratings.includes(r)}
                      onCheckedChange={(c) =>
                        setRatings(c ? [...ratings, r] : ratings.filter((x) => x !== r))
                      }
                    />
                    <span>{r}+ stars</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3">Tags</div>
              <div className="flex flex-wrap gap-1">
                {["react", "vue", "tailwind", "wordpress", "laravel", "flutter"].map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      setTags((prev) =>
                        prev.includes(t) ? prev.filter((entry) => entry !== t) : [...prev, t],
                      )
                    }
                    className={`text-xs px-2 py-1 rounded transition-colors ${tags.includes(t) ? "bg-info text-white" : "bg-muted hover:bg-info hover:text-white"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Items grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">{items.length} results</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Best selling</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
                <SelectItem value="price-low">Price: low to high</SelectItem>
                <SelectItem value="price-high">Price: high to low</SelectItem>
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
