
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_TREE } from "@/lib/marketplace-data";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

({
  component: CategoriesManager,
});

function CategoriesManager() {
  const [tree, setTree] = useState(CATEGORY_TREE);
  const [open, setOpen] = useState<string[]>([CATEGORY_TREE[0].slug]);
  const [newCat, setNewCat] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggle = (slug: string) =>
    setOpen((o) => (o.includes(slug) ? o.filter((s) => s !== slug) : [...o, slug]));

  const addCat = async () => {
    if (!newCat) return;
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTree([
        ...tree,
        { slug: newCat.toLowerCase().replace(/\s+/g, "-"), title: newCat, count: 0, subs: [] },
      ]);
      toast.success(`Added category "${newCat}"`);
      setNewCat("");
    } catch (error) {
      toast.error("Failed to add category");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add new category</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="e.g. Game Assets"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <Button disabled={isAdding} onClick={addCat} className="bg-primary hover:bg-primary/90">
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category tree</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {tree.map((cat) => {
              const isOpen = open.includes(cat.slug);
              return (
                <div key={cat.slug} className="border rounded">
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50">
                    <button onClick={() => toggle(cat.slug)} className="text-muted-foreground">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium">{cat.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {cat.count.toLocaleString()} items · {cat.subs.length} subcategories
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={editingId === cat.slug}
                      onClick={async () => {
                        setEditingId(cat.slug);
                        try {
                          await new Promise((resolve) => setTimeout(resolve, 500));
                          toast.info(`Edit ${cat.title}`);
                        } catch (error) {
                          toast.error("Failed to edit category");
                        } finally {
                          setEditingId(null);
                        }
                      }}
                    >
                      {editingId === cat.slug ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Pencil className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={deletingId === cat.slug}
                      onClick={async () => {
                        setDeletingId(cat.slug);
                        try {
                          await new Promise((resolve) => setTimeout(resolve, 500));
                          toast.warning(`Delete ${cat.title}`);
                        } catch (error) {
                          toast.error("Failed to delete category");
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                    >
                      {deletingId === cat.slug ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {isOpen && (
                    <div className="border-t p-3 pl-10 space-y-1">
                      {cat.subs.map((s) => (
                        <div key={s} className="flex items-center gap-2 text-sm py-1">
                          <span className="flex-1">{s}</span>
                          <Button size="sm" variant="ghost" disabled={editingId === s} onClick={async () => {
                            setEditingId(s);
                            try {
                              await new Promise((resolve) => setTimeout(resolve, 500));
                              toast.info(`Edit ${s}`);
                            } catch (error) {
                              toast.error("Failed to edit subcategory");
                            } finally {
                              setEditingId(null);
                            }
                          }}>
                            {editingId === s ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Pencil className="h-3 w-3" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" disabled={deletingId === s} onClick={async () => {
                            setDeletingId(s);
                            try {
                              await new Promise((resolve) => setTimeout(resolve, 500));
                              toast.warning(`Delete ${s}`);
                            } catch (error) {
                              toast.error("Failed to delete subcategory");
                            } finally {
                              setDeletingId(null);
                            }
                          }}>
                            {deletingId === s ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" className="mt-2" disabled={isAddingSub} onClick={async () => {
                        setIsAddingSub(true);
                        try {
                          await new Promise((resolve) => setTimeout(resolve, 500));
                          toast.success("Subcategory added");
                        } catch (error) {
                          toast.error("Failed to add subcategory");
                        } finally {
                          setIsAddingSub(false);
                        }
                      }}>
                        {isAddingSub ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        {isAddingSub ? "Adding..." : "Add subcategory"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
