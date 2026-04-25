
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Eye, Edit, Loader2, Star, Flame, Calendar, RefreshCw, TrendingUp, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type MarketplaceItem, type FeatureSchedule, type FeatureScheduleCreateInput } from "@/lib/api/admin-services";

({ component: AdminMarketplaceFeatured, head: () => ({ meta: [{ title: "Marketplace Featured — Admin — ERP Vala" }] }) });

function AdminMarketplaceFeatured() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MarketplaceItem[]>([]);
  const [hotItems, setHotItems] = useState<MarketplaceItem[]>([]);
  const [schedules, setSchedules] = useState<FeatureSchedule[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<FeatureSchedule | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scheduleInput, setScheduleInput] = useState<FeatureScheduleCreateInput>({
    itemId: "",
    itemType: "featured",
    startAt: "",
    endAt: "",
    priority: 1,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const allItems = marketplaceService.listItems();
      setItems(allItems);
      setFeaturedItems(marketplaceService.getFeaturedItems());
      setHotItems(marketplaceService.getHotItems());
      setSchedules(marketplaceService.getFeatureSchedules());
    } catch (error) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFeatured = async (id: string) => {
    try {
      await marketplaceService.toggleFeaturedItem(id, "admin");
      toast.success("Featured status toggled");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to toggle featured");
    }
  };

  const handleToggleHot = async (id: string) => {
    try {
      await marketplaceService.toggleHotItem(id, "admin");
      toast.success("Hot status toggled");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to toggle hot");
    }
  };

  const handleAutoFill = async () => {
    setIsProcessing(true);
    try {
      await marketplaceService.autoFillFeaturedSlots();
      toast.success("Featured slots auto-filled");
      loadData();
    } catch (error) {
      toast.error("Failed to auto-fill slots");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessSchedules = async () => {
    setIsProcessing(true);
    try {
      await marketplaceService.processFeatureSchedules();
      toast.success("Schedules processed");
      loadData();
    } catch (error) {
      toast.error("Failed to process schedules");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      await marketplaceService.createFeatureSchedule(scheduleInput, "admin");
      toast.success("Schedule created");
      setIsScheduling(false);
      setScheduleInput({ itemId: "", itemType: "featured", startAt: "", endAt: "", priority: 1 });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create schedule");
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Featured & Hot Items</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoFill} disabled={isProcessing || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
            Auto-Fill Slots
          </Button>
          <Button variant="outline" onClick={handleProcessSchedules} disabled={isProcessing || loading}>
            <Calendar className="mr-2 h-4 w-4" />
            Process Schedules
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Featured Items" value={featuredItems.length.toString()} icon={Star} />
        <StatCard title="Hot Items" value={hotItems.length.toString()} icon={Flame} />
        <StatCard title="Active Schedules" value={schedules.filter((s) => s.isActive).length.toString()} icon={Calendar} />
        <StatCard title="Total Items" value={items.length.toString()} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Featured Items ({featuredItems.length}/8)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : featuredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No featured items</p>
          ) : (
            <div className="space-y-2">
              {featuredItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <p className="font-medium">{item.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Priority {item.featuredPriority}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{item.authorName}</span>
                      <span>{item.totalSales} sales</span>
                      <span>★ {item.rating.toFixed(1)}</span>
                      <span>{formatCurrency(item.price, item.currency)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Switch
                      checked={item.isFeatured}
                      onCheckedChange={() => handleToggleFeatured(item.id)}
                    />
                    <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hot Items ({hotItems.length}/6)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : hotItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hot items</p>
          ) : (
            <div className="space-y-2">
              {hotItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <p className="font-medium">{item.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800">Priority {item.hotPriority}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{item.authorName}</span>
                      <span>{item.totalSales} sales</span>
                      <span>★ {item.rating.toFixed(1)}</span>
                      <span>{formatCurrency(item.price, item.currency)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Switch
                      checked={item.isHot}
                      onCheckedChange={() => handleToggleHot(item.id)}
                    />
                    <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {items.filter((i) => i.status === "approved").map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      {item.isFeatured && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      {item.isHot && <Flame className="h-3 w-3 text-orange-500" />}
                      {item.isFlagged && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">Flagged</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{item.authorName}</span>
                      <span>{item.totalSales} sales</span>
                      <span>★ {item.rating.toFixed(1)}</span>
                      <span>{formatCurrency(item.price, item.currency)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Switch
                      checked={item.isFeatured}
                      onCheckedChange={() => handleToggleFeatured(item.id)}
                    />
                    <Switch
                      checked={item.isHot}
                      onCheckedChange={() => handleToggleHot(item.id)}
                    />
                    <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setIsScheduling(true); setScheduleInput({ ...scheduleInput, itemId: item.id }); }}>
                      <Calendar className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedules</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{schedule.itemType.toUpperCase()}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">Priority {schedule.priority}</span>
                      {!schedule.isActive && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Start: {formatDateTime(schedule.startAt)}</span>
                      <span>End: {formatDateTime(schedule.endAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setSelectedSchedule(schedule)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem && !isScheduling} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm font-medium">{selectedItem.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Author</label>
                <p className="text-sm">{selectedItem.authorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price</label>
                <p className="text-sm">{formatCurrency(selectedItem.price, selectedItem.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sales</label>
                <p className="text-sm">{selectedItem.totalSales}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rating</label>
                <p className="text-sm">★ {selectedItem.rating.toFixed(1)} ({selectedItem.reviewCount} reviews)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Featured</label>
                <p className="text-sm">{selectedItem.isFeatured ? "Yes (Priority " + selectedItem.featuredPriority + ")" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hot</label>
                <p className="text-sm">{selectedItem.isHot ? "Yes (Priority " + selectedItem.hotPriority + ")" : "No"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduling} onOpenChange={() => setIsScheduling(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={scheduleInput.itemType}
                onChange={(e) => setScheduleInput({ ...scheduleInput, itemType: e.target.value as "featured" | "hot" })}
              >
                <option value="featured">Featured</option>
                <option value="hot">Hot</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Start Date & Time</label>
              <Input
                type="datetime-local"
                value={scheduleInput.startAt}
                onChange={(e) => setScheduleInput({ ...scheduleInput, startAt: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">End Date & Time</label>
              <Input
                type="datetime-local"
                value={scheduleInput.endAt}
                onChange={(e) => setScheduleInput({ ...scheduleInput, endAt: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <Input
                type="number"
                value={scheduleInput.priority}
                onChange={(e) => setScheduleInput({ ...scheduleInput, priority: parseInt(e.target.value) })}
              />
            </div>
            <Button onClick={handleCreateSchedule} className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-sm font-medium">{selectedSchedule.itemType.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <p className="text-sm">{selectedSchedule.priority}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start</label>
                <p className="text-sm">{formatDateTime(selectedSchedule.startAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">End</label>
                <p className="text-sm">{formatDateTime(selectedSchedule.endAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedSchedule.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceFeatured;
