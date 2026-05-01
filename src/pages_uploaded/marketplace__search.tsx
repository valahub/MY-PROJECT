import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ITEMS,
  ALL_TAGS,
  TRENDING_SEARCHES,
  CATEGORY_TREE,
  SORT_OPTIONS,
} from "@/lib/marketplace-data";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, TrendingUp } from "lucide-react";

({
  component: SearchResults,
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({
    meta: [
      { title: "Marketplace Search - ERP Vala" },
      {
        name: "description",
        content: "Find scripts, templates, and digital products in ERP Vala Marketplace.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "/marketplace/search" }],
  }),
});

// All compatibility values across categories, deduped
const ALL_COMPAT = Array.from(
  new Set(CATEGORY_TREE.flatMap((c) => c.compatibility ?? [])),
).sort();

function SearchResults() {
  const initialQ =
    (Object.fromEntries(new URLSearchParams(window.location.search)) as Record<string, string>).q ||
    "";
  const [q, setQ] = useState(initialQ);
  const [tags, setTags] = useState<string[]>([]); // multi-tag (AND)
  const [compat, setCompat] = useState<string[]>([]);
  const [sort, setSort] = useState("best-sellers");
  const [showSuggest, setShowSuggest] = useState(false);

  const query = q.toLowerCase().trim();

  // Autosuggest: tags from ALL_TAGS + trending matches + product titles
  const suggestions = useMemo(() => {
    if (!query || query.length < 1) return [];
    const list: { type: "tag" | "trend" | "product"; label: string; sub?: string }[] = [];
    ALL_TAGS.filter((t) => t.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach((t) => list.push({ type: "tag", label: t }));
    TRENDING_SEARCHES.filter((t) => t.toLowerCase().includes(query))
      .slice(0, 4)
      .forEach((t) => list.push({ type: "trend", label: t }));
    ITEMS.filter((i) => i.title.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach((i) => list.push({ type: "product", label: i.title, sub: i.category }));
    return list.slice(0, 10);
  }, [query]);

  // Filter
  let results = ITEMS.filter((i) => {
    if (!query) return true;
    return (
      i.title.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      i.tags.some((t) => t.toLowerCase().includes(query)) ||
      i.author.toLowerCase().includes(query) ||
      i.category.includes(query) ||
      i.subcategory.toLowerCase().includes(query)
    );
  });

  // Multi-tag = AND match
  if (tags.length) results = results.filter((i) => tags.every((t) => i.tags.includes(t)));

  // Compatibility filter (match first token of compat string against tags)
  if (compat.length) {
    results = results.filter((i) =>
      compat.some((c) => {
        const needle = c.toLowerCase().split(/\s+/)[0];
        return i.tags.some((t) => t.toLowerCase().includes(needle));
      }),
    );
  }

  // Sort
  if (sort === "newest") results = [...results].sort((a, b) => b.created.localeCompare(a.created));
  if (sort === "updated")
    results = [...results].sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
  if (sort === "price-low") results = [...results].sort((a, b) => a.price - b.price);
  if (sort === "price-high") results = [...results].sort((a, b) => b.price - a.price);
  if (sort === "rating") results = [...results].sort((a, b) => b.rating - a.rating);
  if (sort === "best-sellers" || sort === "trending")
    results = [...results].sort((a, b) => b.sales - a.sales);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search bar with autosuggest */}
      <div className="max-w-2xl relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShowSuggest(true);
          }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          placeholder="Search items, tags, authors..."
          className="pl-9 h-11"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {showSuggest && suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-auto">
            {suggestions.map((s, idx) => (
              <button
                key={`${s.type}-${s.label}-${idx}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (s.type === "tag") {
                    if (!tags.includes(s.label)) setTags([...tags, s.label]);
                    setQ("");
                  } else {
                    setQ(s.label);
                  }
                  setShowSuggest(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
              >
                {s.type === "tag" && <Badge variant="secondary" className="text-[9px]">tag</Badge>}
                {s.type === "trend" && <TrendingUp className="h-3 w-3 text-info" />}
                {s.type === "product" && <Search className="h-3 w-3 text-muted-foreground" />}
                <span className="flex-1 truncate">{s.label}</span>
                {s.sub && <span className="text-xs text-muted-foreground">{s.sub}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trending searches */}
      {!query && (
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Trending searches
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((t) => (
              <button
                key={t}
                onClick={() => setQ(t)}
                className="text-xs px-3 py-1 rounded-full border border-border hover:bg-muted transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag pool from ALL_TAGS — multi-select (AND) */}
      <div className="mb-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Tags {tags.length > 0 && `· ${tags.length} selected (AND)`}
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.slice(0, 20).map((t) => (
            <button
              key={t}
              onClick={() => toggle(tags, setTags, t)}
              className={`text-xs px-3 py-1 rounded-full border transition ${tags.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Compatibility filter */}
      <div className="mb-4">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Compatibility {compat.length > 0 && `· ${compat.length} selected`}
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_COMPAT.slice(0, 16).map((c) => (
            <button
              key={c}
              onClick={() => toggle(compat, setCompat, c)}
              className={`text-[11px] px-2 py-1 rounded border transition ${compat.includes(c) ? "bg-info text-white border-info" : "border-border hover:bg-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {results.length} result{results.length === 1 ? "" : "s"}{" "}
          {q && (
            <>
              for "<span className="text-foreground font-medium">{q}</span>"
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(tags.length > 0 || compat.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTags([]);
                setCompat([]);
              }}
            >
              Clear filters
            </Button>
          )}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No items found.</p>
            <Link to="/marketplace">
              <Button>Browse all items</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {results.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
