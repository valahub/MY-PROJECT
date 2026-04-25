
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Eye, Edit, Loader2, Search, Plus, Trash2, Folder, FolderOpen, ChevronRight, ChevronDown, Tag, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type Category, type CategoryCreateInput, type CategoryUpdateInput } from "@/lib/api/admin-services";

({ component: AdminMarketplaceCategories, head: () => ({ meta: [{ title: "Marketplace Categories — Admin — ERP Vala" }] }) });

interface CategoryNode extends Category {
  children?: CategoryNode[];
  expanded?: boolean;
}

function AdminMarketplaceCategories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = marketplaceService.getCategories();
      setCategories(cats);
      setCategoryTree(buildCategoryTree(cats));
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const buildCategoryTree = (cats: Category[]): CategoryNode[] => {
    const categoryMap = new Map<string, CategoryNode>();
    cats.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [], expanded: false });
    });

    const root: CategoryNode[] = [];
    cats.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children!.push(node);
      } else {
        root.push(node);
      }
    });

    return root;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await marketplaceService.createCategory({ name: newCategoryName }, "admin");
      toast.success("Category created");
      setNewCategoryName("");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create category");
    }
  };

  const handleCreateChildCategory = async (parentId: string) => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await marketplaceService.createCategory({ name: newCategoryName, parentId }, "admin");
      toast.success("Subcategory created");
      setNewCategoryName("");
      setIsAddingChild(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create subcategory");
    }
  };

  const handleUpdateCategory = async (id: string, input: CategoryUpdateInput) => {
    try {
      await marketplaceService.updateCategory(id, input, "admin");
      toast.success("Category updated");
      loadData();
      setSelectedCategory(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    if (category.isLocked) {
      toast.error("This category is locked and cannot be deleted");
      return;
    }

    if (category.itemCount > 0) {
      // Show reassign dialog
      setSelectedCategory(category);
      setIsReassigning(true);
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await marketplaceService.deleteCategory(id, "admin");
      toast.success("Category deleted");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleReassignAndDelete = async (categoryId: string, targetCategoryId: string) => {
    try {
      await marketplaceService.deleteCategory(categoryId, "admin", targetCategoryId);
      toast.success("Category deleted and items reassigned");
      setIsReassigning(false);
      setSelectedCategory(null);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleToggleExpand = (id: string) => {
    const toggleNode = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setCategoryTree(toggleNode(categoryTree));
  };

  const renderCategoryNode = (node: CategoryNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = level * 20;

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between p-3 border rounded hover:bg-muted"
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button onClick={() => handleToggleExpand(node.id)} className="p-0 hover:bg-muted rounded">
                  {node.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <div className="w-4" />
              )}
              {node.expanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-blue-500" />}
              <p className="font-medium">{node.name}</p>
              <span className="text-xs text-muted-foreground">{node.totalItemCount.toLocaleString()} items</span>
              {node.subcategoryCount > 0 && (
                <span className="text-xs text-muted-foreground">• {node.subcategoryCount} subcategories</span>
              )}
              {!node.isActive && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Inactive</span>}
              {node.isLocked && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">Locked</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{node.slug}</p>
            {node.path !== node.name && (
              <p className="text-xs text-muted-foreground">{node.path}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setSelectedCategory(node)}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedCategory(node)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setIsAddingChild(true); setSelectedCategory(node); }}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(node.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {node.expanded && hasChildren && (
          <div className="mt-1">
            {node.children!.map((child) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Categories" value={categories.length.toString()} icon={Folder} />
        <StatCard title="Root Categories" value={categories.filter((c) => !c.parentId).length.toString()} icon={FolderOpen} />
        <StatCard title="Total Items" value={categories.reduce((sum, c) => sum + c.itemCount, 0).toString()} icon={Tag} />
        <StatCard title="Active Categories" value={categories.filter((c) => c.isActive).length.toString()} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateCategory()}
            />
            <Button onClick={handleCreateCategory} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add Root Category
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : searchQuery ? (
            <div className="space-y-2">
              {filteredCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories found</p>
              ) : (
                filteredCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-blue-500" />
                        <p className="font-medium">{cat.name}</p>
                        <span className="text-xs text-muted-foreground">{cat.totalItemCount.toLocaleString()} items</span>
                        {cat.subcategoryCount > 0 && (
                          <span className="text-xs text-muted-foreground">• {cat.subcategoryCount} subcategories</span>
                        )}
                        {!cat.isActive && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Inactive</span>}
                        {cat.isLocked && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">Locked</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{cat.slug}</p>
                      {cat.path !== cat.name && (
                        <p className="text-xs text-muted-foreground">{cat.path}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedCategory(cat)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCategory(cat)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {categoryTree.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories found</p>
              ) : (
                categoryTree.map((node) => renderCategoryNode(node))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCategory && !isAddingChild} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <Input
                  value={selectedCategory.name}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Slug</label>
                <Input value={selectedCategory.slug} disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Meta Title</label>
                <Input
                  value={selectedCategory.metaTitle || ""}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, metaTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Meta Description</label>
                <Input
                  value={selectedCategory.metaDescription || ""}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, metaDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Icon</label>
                <Input
                  value={selectedCategory.icon || ""}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, icon: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Commission Override (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedCategory.commissionOverride || ""}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, commissionOverride: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <Input
                  type="number"
                  value={selectedCategory.priority}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, priority: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Image URL</label>
                <Input
                  value={selectedCategory.image || ""}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, image: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Active</label>
                <Switch
                  checked={selectedCategory.isActive}
                  onCheckedChange={(checked) => setSelectedCategory({ ...selectedCategory, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Locked</label>
                <Switch
                  checked={selectedCategory.isLocked}
                  onCheckedChange={(checked) => setSelectedCategory({ ...selectedCategory, isLocked: checked })}
                />
              </div>
              <Button onClick={() => handleUpdateCategory(selectedCategory.id, selectedCategory)} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingChild} onOpenChange={() => setIsAddingChild(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subcategory</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Parent</label>
                <p className="text-sm font-medium">{selectedCategory.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subcategory Name</label>
                <Input
                  placeholder="Enter subcategory name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateChildCategory(selectedCategory.id)}
                />
              </div>
              <Button onClick={() => handleCreateChildCategory(selectedCategory.id)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isReassigning} onOpenChange={() => setIsReassigning(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Items Before Delete</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category to Delete</label>
                <p className="text-sm font-medium">{selectedCategory.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCategory.itemCount} items will be moved</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Target Category</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  onChange={(e) => setNewCategoryName(e.target.value)}
                >
                  <option value="">Select target category...</option>
                  {categories
                    .filter((c) => c.id !== selectedCategory.id && c.isActive)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.path}
                      </option>
                    ))}
                </select>
              </div>
              <Button
                onClick={() => handleReassignAndDelete(selectedCategory.id, newCategoryName)}
                className="w-full"
                disabled={!newCategoryName}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete and Reassign Items
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceCategories;
