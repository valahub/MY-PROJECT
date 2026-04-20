
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ITEMS, coverFor } from "@/lib/marketplace-data";
import { Plus, Calendar, Trash2, Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: Collections });

const COLLECTIONS = [
  {
    id: "c1",
    name: "Black Friday 2024",
    items: 24,
    scheduled: "2024-11-29 → 2024-12-02",
    status: "ended",
    curator: "marketing@erpvala",
  },
  {
    id: "c2",
    name: "Best of 2024",
    items: 50,
    scheduled: "2024-12-15 → 2025-01-15",
    status: "live",
    curator: "editorial@erpvala",
  },
  {
    id: "c3",
    name: "WordPress Theme of the Month",
    items: 12,
    scheduled: "2024-12-01 → 2024-12-31",
    status: "live",
    curator: "editorial@erpvala",
  },
  {
    id: "c4",
    name: "Mobile App Templates",
    items: 18,
    scheduled: "Always",
    status: "live",
    curator: "system",
  },
  {
    id: "c5",
    name: "New Year 2025 Collection",
    items: 30,
    scheduled: "2025-01-01 → 2025-01-15",
    status: "scheduled",
    curator: "marketing@erpvala",
  },
];

function Collections() {
  const sample = ITEMS.slice(0, 4);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Curated Collections</h1>
          <p className="text-sm text-muted-foreground">
            Editorial collections shown on the marketplace homepage and category pages.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          disabled={isCreating}
          onClick={async () => {
            setIsCreating(true);
            try {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              toast.success("Collection created");
            } catch (error) {
              toast.error("Failed to create collection");
            } finally {
              setIsCreating(false);
            }
          }}
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreating ? "Creating..." : "New collection"}
        </Button>
      </div>

      <div className="grid gap-3">
        {COLLECTIONS.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex -space-x-2">
                {sample.map((i) => (
                  <div
                    key={i.id}
                    className="h-10 w-10 rounded border-2 border-background"
                    style={{ background: coverFor(i.id) }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <Calendar className="h-3 w-3" /> {c.scheduled} · {c.items} items · curated by{" "}
                  {c.curator}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded ${c.status === "live" ? "bg-success/15 text-success" : c.status === "scheduled" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}
              >
                {c.status}
              </span>
              <Button size="sm" variant="outline" disabled={editingId === c.id} onClick={async () => {
                setEditingId(c.id);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  toast.info(`Editing ${c.name}`);
                } catch (error) {
                  toast.error("Failed to edit collection");
                } finally {
                  setEditingId(null);
                }
              }}>
                {editingId === c.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                {editingId === c.id ? "" : " Edit"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={deletingId === c.id}
                onClick={async () => {
                  setDeletingId(c.id);
                  try {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    toast.success(`Deleted ${c.name}`);
                  } catch (error) {
                    toast.error("Failed to delete collection");
                  } finally {
                    setDeletingId(null);
                  }
                }}
              >
                {deletingId === c.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Homepage layout</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Drag collections to reorder how they appear on the marketplace homepage. Top section:{" "}
            <span className="text-foreground font-medium">Featured Items</span> (auto from
            /admin/marketplace/featured), followed by collection slots.
          </p>
          <div className="grid sm:grid-cols-3 gap-2 pt-2">
            <div className="border rounded p-3 text-center text-xs">Slot 1: Best of 2024</div>
            <div className="border rounded p-3 text-center text-xs">Slot 2: WP Theme of Month</div>
            <div className="border rounded p-3 text-center text-xs">Slot 3: Mobile Templates</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default COLLECTIONS;