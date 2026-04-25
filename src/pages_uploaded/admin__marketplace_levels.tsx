
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Eye, Edit, Loader2, Award, DollarSign, TrendingUp, Shield, Gift, Check, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type AuthorLevelConfig, type AuthorBonus } from "@/lib/api/admin-services";

({ component: AdminMarketplaceLevels, head: () => ({ meta: [{ title: "Marketplace Levels — Admin — ERP Vala" }] }) });

function AdminMarketplaceLevels() {
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<AuthorLevelConfig[]>([]);
  const [bonuses, setBonuses] = useState<AuthorBonus[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<AuthorLevelConfig | null>(null);
  const [selectedBonus, setSelectedBonus] = useState<AuthorBonus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const settings = marketplaceService.getSettings();
      setLevels(settings.authorLevels);
      setBonuses(marketplaceService.getAuthorBonuses());
    } catch (error) {
      toast.error("Failed to load levels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleLevel = async (level: AuthorLevelConfig) => {
    try {
      await marketplaceService.updateSettings(
        {
          authorLevels: levels.map((l) =>
            l.level === level.level ? { ...l, isActive: !l.isActive } : l
          ),
        },
        "admin"
      );
      toast.success(`Level ${level.level} ${level.isActive ? "disabled" : "enabled"}`);
      loadData();
    } catch (error) {
      toast.error("Failed to toggle level");
    }
  };

  const handleUpdateLevel = async (level: AuthorLevelConfig) => {
    try {
      await marketplaceService.updateSettings(
        {
          authorLevels: levels.map((l) => (l.level === level.level ? level : l)),
        },
        "admin"
      );
      toast.success("Level updated");
      loadData();
      setSelectedLevel(null);
    } catch (error) {
      toast.error("Failed to update level");
    }
  };

  const handleApplyBonus = async (bonusId: string) => {
    try {
      await marketplaceService.applyBonus(bonusId, "admin");
      toast.success("Bonus applied");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply bonus");
    }
  };

  const handleRecalculateAllLevels = async () => {
    setIsProcessing(true);
    try {
      const authors = marketplaceService.listAuthors();
      for (const author of authors) {
        await marketplaceService.updateAuthorLevelByEarnings(author.id, "admin");
      }
      toast.success("All author levels recalculated");
      loadData();
    } catch (error) {
      toast.error("Failed to recalculate levels");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "platinum": return "text-purple-600";
      case "gold": return "text-yellow-600";
      case "silver": return "text-gray-400";
      case "bronze": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Author Levels</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecalculateAllLevels} disabled={isProcessing || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
            {isProcessing ? "Recalculating..." : "Recalculate All Levels"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Levels" value={levels.length.toString()} icon={Award} />
        <StatCard title="Active Levels" value={levels.filter((l) => l.isActive).length.toString()} icon={Check} />
        <StatCard title="Pending Bonuses" value={bonuses.filter((b) => !b.appliedAt).length.toString()} icon={Gift} />
        <StatCard title="Total Bonuses" value={`$${bonuses.reduce((sum, b) => sum + b.amount, 0).toFixed(0)}`} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Level Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {levels.map((level) => (
                <div key={level.level} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${getLevelColor(level.level)}`}>{level.level.toUpperCase()}</p>
                      <span className="text-sm text-muted-foreground">{level.badge}</span>
                      {!level.isActive && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Min Earnings: {formatCurrency(level.minEarnings, "USD")}</span>
                      <span>Commission: {(level.commissionRate * 100).toFixed(0)}%</span>
                      <span>Sales Threshold: {level.salesThreshold}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {level.benefits.join(" • ")}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Switch
                      checked={level.isActive}
                      onCheckedChange={() => handleToggleLevel(level)}
                    />
                    <Button size="sm" variant="outline" onClick={() => setSelectedLevel(level)}>
                      <Edit className="h-3 w-3" />
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
          <CardTitle>Bonuses</CardTitle>
        </CardHeader>
        <CardContent>
          {bonuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bonuses available</p>
          ) : (
            <div className="space-y-2">
              {bonuses.map((bonus) => (
                <div key={bonus.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{bonus.type.replace("_", " ").toUpperCase()}</p>
                      {bonus.appliedAt ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Applied</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Pending</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{bonus.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{formatCurrency(bonus.amount, bonus.currency)}</span>
                      <span>Triggered: {formatDate(bonus.triggeredAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setSelectedBonus(bonus)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    {!bonus.appliedAt && (
                      <Button size="sm" variant="outline" onClick={() => handleApplyBonus(bonus.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLevel} onOpenChange={() => setSelectedLevel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Level</DialogTitle>
          </DialogHeader>
          {selectedLevel && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Level</label>
                <p className="text-sm font-medium">{selectedLevel.level.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Badge</label>
                <Input
                  value={selectedLevel.badge}
                  onChange={(e) => setSelectedLevel({ ...selectedLevel, badge: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Min Earnings (USD)</label>
                <Input
                  type="number"
                  value={selectedLevel.minEarnings}
                  onChange={(e) => setSelectedLevel({ ...selectedLevel, minEarnings: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedLevel.commissionRate}
                  onChange={(e) => setSelectedLevel({ ...selectedLevel, commissionRate: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sales Threshold</label>
                <Input
                  type="number"
                  value={selectedLevel.salesThreshold}
                  onChange={(e) => setSelectedLevel({ ...selectedLevel, salesThreshold: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Benefits (comma-separated)</label>
                <Input
                  value={selectedLevel.benefits.join(", ")}
                  onChange={(e) => setSelectedLevel({ ...selectedLevel, benefits: e.target.value.split(", ").filter(Boolean) })}
                />
              </div>
              <Button onClick={() => handleUpdateLevel(selectedLevel)} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBonus} onOpenChange={() => setSelectedBonus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bonus Details</DialogTitle>
          </DialogHeader>
          {selectedBonus && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-sm font-medium">{selectedBonus.type.replace("_", " ").toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="text-sm font-medium">{formatCurrency(selectedBonus.amount, selectedBonus.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{selectedBonus.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Triggered At</label>
                <p className="text-sm">{formatDate(selectedBonus.triggeredAt)}</p>
              </div>
              {selectedBonus.appliedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applied At</label>
                  <p className="text-sm">{formatDate(selectedBonus.appliedAt)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceLevels;
