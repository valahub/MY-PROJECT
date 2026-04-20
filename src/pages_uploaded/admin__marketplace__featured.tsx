
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ITEMS, coverFor } from "@/lib/marketplace-data";
import { useState } from "react";
import { Star, Trophy, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

({ component: FeaturedManager });

function FeaturedManager() {
  const [featured, setFeatured] = useState<string[]>(["i1", "i2", "i3", "i8"]);
  const [hot, setHot] = useState<string[]>(["i8", "i11"]);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const toggle = (id: string, list: string[], setter: (v: string[]) => void, label: string) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    toast.success(`${label} updated`);
  };

  const handleSchedule = async (id: string, title: string) => {
    setSchedulingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Scheduled ${title}`);
    } catch (error) {
      toast.error("Failed to schedule item");
    } finally {
      setSchedulingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-accent" /> Featured Items
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick which items appear in homepage Featured / Trending / Hot sections.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">Homepage Featured</div>
            <div className="text-2xl font-bold">{featured.length} / 8</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">Hot This Week</div>
            <div className="text-2xl font-bold">{hot.length} / 6</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">Available Items</div>
            <div className="text-2xl font-bold">{ITEMS.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All items — toggle featured / hot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {ITEMS.map((i) => (
              <div key={i.id} className="flex items-center gap-3 p-2 rounded border">
                <div
                  className="h-12 w-16 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: coverFor(i.id) }}
                >
                  {i.title.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.author} · {i.sales.toLocaleString()} sales · {i.rating} ★
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-accent" /> Featured
                  </span>
                  <Switch
                    checked={featured.includes(i.id)}
                    onCheckedChange={() => toggle(i.id, featured, setFeatured, "Featured")}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>🔥 Hot</span>
                  <Switch
                    checked={hot.includes(i.id)}
                    onCheckedChange={() => toggle(i.id, hot, setHot, "Hot")}
                  />
                </div>
                <Button size="sm" variant="ghost" disabled={schedulingId === i.id} onClick={() => handleSchedule(i.id, i.title)}>
                  {schedulingId === i.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  {schedulingId === i.id ? "" : " Schedule"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
