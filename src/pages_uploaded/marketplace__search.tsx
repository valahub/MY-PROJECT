import { Link } from "react-router-dom";
import { ITEMS } from "@/lib/marketplace-data";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { useState } from "react";

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

function SearchResults() {
  const { q: initial } = (Object.fromEntries(new URLSearchParams(window.location.search)) as Record<string, string>);
  const [q, setQ] = useState(initial);
  const [tag, setTag] = useState<string | null>(null);

  const query = q.toLowerCase().trim();
  let results = ITEMS.filter(
    (i) =>
      !query ||
      i.title.toLowerCase().includes(query) ||
      i.tags.some((t) => t.toLowerCase().includes(query)) ||
      i.author.toLowerCase().includes(query) ||
      i.category.includes(query),
  );
  if (tag) results = results.filter((i) => i.tags.includes(tag));

  const allTags = Array.from(new Set(ITEMS.flatMap((i) => i.tags))).slice(0, 14);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items, tags, authors..."
          className="pl-9 h-11"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => setTag(tag === t ? null : t)}
            className={`text-xs px-3 py-1 rounded-full border transition ${tag === t ? "bg-primary text-white border-primary" : "border-border hover:bg-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="text-sm text-muted-foreground mb-3">
        {results.length} result{results.length === 1 ? "" : "s"}{" "}
        {q && (
          <>
            for "<span className="text-foreground font-medium">{q}</span>"
          </>
        )}
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
