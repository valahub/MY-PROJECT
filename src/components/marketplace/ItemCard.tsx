import { Link } from "@tanstack/react-router";
import { Star, ShoppingCart } from "lucide-react";
import { coverFor, type MarketItem } from "@/lib/marketplace-data";
import { Button } from "@/components/ui/button";

export function ItemCard({ item }: { item: MarketItem }) {
  return (
    <Link
      to="/marketplace/item/$slug"
      params={{ slug: item.slug }}
      className="group block rounded-lg border bg-card overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all"
    >
      <div
        className="aspect-[4/3] relative flex items-center justify-center text-white text-xs font-medium"
        style={{ background: coverFor(item.id) }}
      >
        <div className="absolute top-2 left-2 bg-white/95 text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
          {item.category.replace("-", " ")}
        </div>
        <div className="text-center px-3 opacity-90">
          <div className="text-2xl font-black">{item.title.slice(0, 1)}</div>
          <div className="text-[10px] mt-1 uppercase tracking-wider">{item.subcategory}</div>
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90">
            <ShoppingCart className="h-3 w-3 mr-1" /> Buy
          </Button>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <div className="mt-1 text-xs text-muted-foreground">
          by <span className="text-info">{item.author}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="font-medium">{item.rating}</span>
            <span className="text-muted-foreground">({item.reviews})</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{item.sales.toLocaleString()} sales</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">${item.price}</span>
          <span className="text-[10px] text-muted-foreground">v{item.version}</span>
        </div>
      </div>
    </Link>
  );
}
