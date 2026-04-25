
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Loader2, Search, Shield, Award, TrendingUp, AlertTriangle, Check, X, Ban, Users, DollarSign, Star, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type MarketplaceAuthor } from "@/lib/api/admin-services";

({ component: AdminMarketplaceAuthors, head: () => ({ meta: [{ title: "Marketplace Authors — Admin — ERP Vala" }] }) });

function AdminMarketplaceAuthors() {
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<MarketplaceAuthor[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<MarketplaceAuthor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      setAuthors(marketplaceService.listAuthors({ search: searchQuery || undefined }));
    } catch (error) {
      toast.error("Failed to load authors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleVerifyAuthor = async (id: string) => {
    try {
      await marketplaceService.updateAuthor(id, { status: "verified" }, "admin");
      toast.success("Author verified");
      loadData();
    } catch (error) {
      toast.error("Failed to verify author");
    }
  };

  const handleBanAuthor = async (id: string) => {
    if (!confirm("Are you sure you want to ban this author? All their items will be hidden.")) return;
    try {
      await marketplaceService.updateAuthor(id, { status: "banned" }, "admin");
      toast.success("Author banned");
      loadData();
    } catch (error) {
      toast.error("Failed to ban author");
    }
  };

  const handleResetRisk = async (id: string) => {
    try {
      await marketplaceService.resetRiskScore(id, "admin");
      toast.success("Risk score reset");
      loadData();
    } catch (error) {
      toast.error("Failed to reset risk score");
    }
  };

  const handleRecalculateEarnings = async (id: string) => {
    try {
      await marketplaceService.recalculateAuthorEarnings(id);
      toast.success("Earnings recalculated");
      loadData();
    } catch (error) {
      toast.error("Failed to recalculate earnings");
    }
  };

  const handleUpdateTier = async (id: string) => {
    try {
      await marketplaceService.updateAuthorTier(id, "admin");
      toast.success("Tier updated");
      loadData();
    } catch (error) {
      toast.error("Failed to update tier");
    }
  };

  const handleUpdateLevel = async (id: string) => {
    try {
      await marketplaceService.updateAuthorLevelAdvanced(id);
      toast.success("Level updated");
      loadData();
    } catch (error) {
      toast.error("Failed to update level");
    }
  };

  const handleCalculateRisk = async (id: string) => {
    try {
      await marketplaceService.calculateRiskScore(id);
      toast.success("Risk score calculated");
      loadData();
    } catch (error) {
      toast.error("Failed to calculate risk score");
    }
  };

  const handleCalculateReputation = async (id: string) => {
    try {
      await marketplaceService.calculateReputationScore(id);
      toast.success("Reputation score calculated");
      loadData();
    } catch (error) {
      toast.error("Failed to calculate reputation score");
    }
  };

  const handleBulkRecalculate = async () => {
    setIsProcessing(true);
    try {
      for (const author of authors) {
        await marketplaceService.recalculateAuthorEarnings(author.id);
        await marketplaceService.calculateRiskScore(author.id);
        await marketplaceService.calculateReputationScore(author.id);
        await marketplaceService.updateAuthorTier(author.id, "admin");
        await marketplaceService.updateAuthorLevelAdvanced(author.id);
      }
      toast.success("Bulk recalculation completed");
      loadData();
    } catch (error) {
      toast.error("Bulk recalculation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "text-green-600";
      case "unverified": return "text-yellow-600";
      case "banned": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "premium": return "text-purple-600";
      case "trusted": return "text-blue-600";
      case "new": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace Authors</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkRecalculate} disabled={isProcessing || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
            {isProcessing ? "Recalculating..." : "Bulk Recalculate"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Authors" value={authors.length.toString()} icon={Users} />
        <StatCard title="Verified" value={authors.filter((a) => a.status === "verified").length.toString()} icon={Check} />
        <StatCard title="Total Sales" value={authors.reduce((sum, a) => sum + a.totalSales, 0).toString()} icon={TrendingUp} />
        <StatCard title="Total Revenue" value={`$${authors.reduce((sum, a) => sum + a.totalRevenue, 0).toFixed(0)}`} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by author name or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {authors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No authors found</p>
              ) : (
                authors.map((author) => (
                  <div key={author.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{author.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${getTierColor(author.tier)}`}>
                          {author.tier.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                          L{author.level}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{author.email} • {author.country || "N/A"}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{author.itemCount} items</span>
                        <span>{author.totalSales} sales</span>
                        <span>{formatCurrency(author.totalRevenue, "USD")}</span>
                        <span className={getStatusColor(author.status)}>{author.status}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className={getRiskColor(author.riskScore)}>Risk: {author.riskScore}</span>
                        <span className={getReputationColor(author.reputationScore)}>Reputation: {author.reputationScore}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedAuthor(author)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      {author.status === "unverified" && (
                        <Button size="sm" variant="outline" onClick={() => handleVerifyAuthor(author.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      {author.status === "verified" && (
                        <Button size="sm" variant="outline" onClick={() => handleBanAuthor(author.id)}>
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAuthor} onOpenChange={() => setSelectedAuthor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Author Details</DialogTitle>
          </DialogHeader>
          {selectedAuthor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm font-medium">{selectedAuthor.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedAuthor.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Country</label>
                  <p className="text-sm">{selectedAuthor.country || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className={`text-sm ${getStatusColor(selectedAuthor.status)}`}>{selectedAuthor.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tier</label>
                  <p className={`text-sm ${getTierColor(selectedAuthor.tier)}`}>{selectedAuthor.tier.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Level</label>
                  <p className="text-sm">L{selectedAuthor.level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Items</label>
                  <p className="text-sm">{selectedAuthor.itemCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sales</label>
                  <p className="text-sm">{selectedAuthor.totalSales}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Revenue</label>
                  <p className="text-sm">{formatCurrency(selectedAuthor.totalRevenue, "USD")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pending Payout</label>
                  <p className="text-sm">{formatCurrency(selectedAuthor.pendingPayout, "USD")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
                  <p className="text-sm">{(selectedAuthor.commissionRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Risk Score</label>
                  <p className={`text-sm ${getRiskColor(selectedAuthor.riskScore)}`}>{selectedAuthor.riskScore}/100</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reputation Score</label>
                  <p className={`text-sm ${getReputationColor(selectedAuthor.reputationScore)}`}>{selectedAuthor.reputationScore}/100</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{formatDate(selectedAuthor.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verified At</label>
                  <p className="text-sm">{selectedAuthor.verifiedAt ? formatDate(selectedAuthor.verifiedAt) : "N/A"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Actions</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => handleRecalculateEarnings(selectedAuthor.id)}>
                    <DollarSign className="mr-2 h-3 w-3" />
                    Recalculate Earnings
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateTier(selectedAuthor.id)}>
                    <Award className="mr-2 h-3 w-3" />
                    Update Tier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateLevel(selectedAuthor.id)}>
                    <Star className="mr-2 h-3 w-3" />
                    Update Level
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCalculateRisk(selectedAuthor.id)}>
                    <AlertTriangle className="mr-2 h-3 w-3" />
                    Calculate Risk
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCalculateReputation(selectedAuthor.id)}>
                    <Star className="mr-2 h-3 w-3" />
                    Calculate Reputation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleResetRisk(selectedAuthor.id)}>
                    <Shield className="mr-2 h-3 w-3" />
                    Reset Risk
                  </Button>
                  {selectedAuthor.status === "unverified" && (
                    <Button size="sm" variant="outline" onClick={() => handleVerifyAuthor(selectedAuthor.id)}>
                      <Check className="mr-2 h-3 w-3" />
                      Verify
                    </Button>
                  )}
                  {selectedAuthor.status === "verified" && (
                    <Button size="sm" variant="destructive" onClick={() => handleBanAuthor(selectedAuthor.id)}>
                      <Ban className="mr-2 h-3 w-3" />
                      Ban
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceAuthors;
