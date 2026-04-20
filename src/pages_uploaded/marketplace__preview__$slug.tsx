import { Link, useParams} from "react-router-dom";
import { ITEMS, coverFor } from "@/lib/marketplace-data";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, ExternalLink, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { buildMarketplaceProductMeta, normalizeSeoSlug } from "@/lib/marketplace-seo";

({
  component: LivePreview,
  head: ({ params }) => {
    const normalized = normalizeSeoSlug(params.slug);
    const item = ITEMS.find((entry) => entry.slug === normalized);
    if (!item) {
      return {
        meta: [{ title: "Preview not found - ERP Vala Marketplace" }],
      };
    }
    const seo = buildMarketplaceProductMeta(item);
    return {
      meta: [
        { title: `${item.title} Live Preview - ERP Vala Marketplace` },
        {
          name: "description",
          content: `Live preview for ${item.title}. ${seo.description}`,
        },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: `/marketplace/preview/${item.slug}` }],
    };
  },
});

function LivePreview() {
  const { slug } = useParams() as Record<string, string>;
  const item = ITEMS.find((i) => i.slug === slug) || (ITEMS.length > 0 ? ITEMS[0] : null);

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Preview not found</h1>
          <p className="text-muted-foreground">The requested preview could not be found.</p>
          <Link to="/marketplace" className="mt-4 inline-block">
            <Button>Return to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const widths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  return (
    <div className="min-h-screen bg-sidebar text-white flex flex-col">
      <header className="bg-sidebar border-b border-white/10 px-4 py-2 flex items-center gap-3">
        <Link
          to="/marketplace/item/$slug"
          className="text-sm flex items-center gap-1 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex-1 text-sm font-medium truncate">{item.title}</div>
        <div className="flex items-center gap-1 bg-white/10 rounded p-1">
          <button
            onClick={() => setDevice("desktop")}
            className={`p-1.5 rounded ${device === "desktop" ? "bg-primary" : ""}`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("tablet")}
            className={`p-1.5 rounded ${device === "tablet" ? "bg-primary" : ""}`}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`p-1.5 rounded ${device === "mobile" ? "bg-primary" : ""}`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.open(`/marketplace/preview/${item.slug}`, "_blank", "noopener,noreferrer");
            }
          }}
        >
          <ExternalLink className="h-3 w-3 mr-1" /> New tab
        </Button>
        <Link to="/marketplace/cart">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Buy ${item.price}
          </Button>
        </Link>
      </header>
      <main className="flex-1 p-6 flex justify-center bg-muted/30 overflow-auto">
        <div
          className="bg-white rounded-lg shadow-2xl transition-all"
          style={{ width: widths[device], maxWidth: "100%" }}
        >
          <div
            className="aspect-[16/10] flex items-center justify-center text-white text-xl font-bold rounded-t-lg"
            style={{ background: coverFor(item.id) }}
          >
            <div className="text-center">
              <div className="text-5xl font-black">{item.title.slice(0, 1)}</div>
              <div className="text-xs mt-2 opacity-80 uppercase tracking-widest">
                Live Demo Preview
              </div>
            </div>
          </div>
          <div className="p-8 text-foreground">
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="aspect-video bg-muted rounded flex items-center justify-center text-xs text-muted-foreground"
                >
                  Section {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LivePreview;
