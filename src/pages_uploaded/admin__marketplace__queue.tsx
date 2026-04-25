
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { SUBMISSIONS, coverFor } from "@/lib/marketplace-data";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, MessageSquare, ExternalLink, Loader2, Download, Search, Zap } from "lucide-react";
import {
  bulkDecideMarketplaceSubmissions,
  decideMarketplaceSubmission,
  getMarketplaceSubmissions,
  getUiErrorMessage,
  runMarketplaceSubmissionQualityChecks,
  type MarketplaceSubmission,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";

({ component: ReviewQueue });

function ReviewQueue() {
  const [items, setItems] = useState<MarketplaceSubmission[]>(SUBMISSIONS);
  const [selected, setSelected] = useState<MarketplaceSubmission>(SUBMISSIONS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isRunningQualityScan, setIsRunningQualityScan] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isBulkSoftRejecting, setIsBulkSoftRejecting] = useState(false);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSoftRejecting, setIsSoftRejecting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    void getMarketplaceSubmissions()
      .then((next) => {
        setItems(next);
        if (next.length > 0) setSelected(next[0]);
      })
      .catch((error) => toast.error(getUiErrorMessage(error, "Failed to load review queue.")));
  }, []);

  const decideAction = useSelfHealingAction(
    async (
      payload: { id: string; status: "live" | "rejected" | "soft_rejected"; note: string },
      signal,
    ) => {
      if (signal.aborted) throw new Error("Review action aborted");
      return decideMarketplaceSubmission(payload.id, payload.status, payload.note);
    },
    {
      id: "admin-marketplace-review-decision",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: (next) => {
        setItems(next);
        const current = next.find((item) => item.id === selected.id);
        if (current) setSelected(current);
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Review action failed.")),
    },
  );

  const decide = async (status: "live" | "rejected" | "soft_rejected") => {
    const setLoading = status === "live" ? setIsApproving : status === "rejected" ? setIsRejecting : setIsSoftRejecting;
    setLoading(true);
    try {
      // Use the new author-items-api for approval/rejection
      if (status === "live") {
        await authorItemsApiService.approveItem(selected.id, "admin");
      } else if (status === "rejected") {
        await authorItemsApiService.rejectItem(selected.id, note, "admin");
      }
      // Also update the existing ui-actions-api for backward compatibility
      await decideAction.trigger({ id: selected.id, status, note });
      toast.success(
        `Item ${status === "live" ? "approved" : status === "rejected" ? "rejected" : "sent back to author"}`,
      );
      setNote("");
    } finally {
      setLoading(false);
    }
  };

  const runQualityScan = async () => {
    setIsRunningQualityScan(true);
    try {
      const result = await runMarketplaceSubmissionQualityChecks(selected.id);
      const failedChecks = result.checks.filter((check) => !check.passed).length;
      toast.success(`Quality scan complete: risk ${result.risk}, failed checks ${failedChecks}`);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Quality scan failed."));
    } finally {
      setIsRunningQualityScan(false);
    }
  };

  const bulkDecide = async (status: "live" | "rejected" | "soft_rejected") => {
    if (selectedIds.length === 0) {
      toast.info("Select one or more submissions first.");
      return;
    }
    const setLoading = status === "live" ? setIsBulkApproving : status === "rejected" ? setIsBulkRejecting : setIsBulkSoftRejecting;
    setLoading(true);
    try {
      const next = await bulkDecideMarketplaceSubmissions({
        ids: selectedIds,
        status,
        reviewNote: note,
        idempotencyKey: `${status}:${selectedIds.join(",")}`,
      });
      setItems(next);
      setSelectedIds([]);
      toast.success(`Bulk action applied: ${status}`);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Bulk moderation failed."));
    } finally {
      setLoading(false);
    }
  };

  const filterBy = (s: string) => items.filter((i) => i.status === s);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <p className="text-sm text-muted-foreground">
          Approve, reject, or soft-reject submissions from authors.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({filterBy("pending").length})</TabsTrigger>
          <TabsTrigger value="soft_rejected">
            Soft Rejected ({filterBy("soft_rejected").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({filterBy("rejected").length})</TabsTrigger>
        </TabsList>

        {["pending", "soft_rejected", "rejected"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
              {/* List */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Bulk moderation enabled</span>
                  <span>{selectedIds.length} selected</span>
                </div>
                {filterBy(tab).map((it) => (
                  <Card
                    key={it.id}
                    onClick={() => setSelected(it)}
                    className={`cursor-pointer transition-all ${selected.id === it.id ? "border-primary ring-1 ring-primary" : ""}`}
                  >
                    <CardContent className="p-3 flex gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(it.id)}
                        onChange={(e) =>
                          setSelectedIds((prev) =>
                            e.target.checked
                              ? [...prev, it.id]
                              : prev.filter((entry) => entry !== it.id),
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="h-12 w-16 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: coverFor(it.id) }}
                      >
                        {it.title.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{it.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.author} · {it.category}
                        </div>
                        <div className="mt-1">
                          <StatusBadge status={it.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filterBy(tab).length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      No items in this state
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Detail */}
              {selected && (
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {selected.category} / {selected.subcategory}
                        </div>
                        <h2 className="text-xl font-bold">{selected.title}</h2>
                        <div className="text-sm text-info">by {selected.author}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${selected.price}</div>
                        <div className="text-xs text-muted-foreground">v{selected.version}</div>
                      </div>
                    </div>

                    <div
                      className="aspect-[16/9] rounded mt-4 flex items-center justify-center text-white"
                      style={{ background: coverFor(selected.id) }}
                    >
                      <span className="text-4xl font-black">{selected.title.slice(0, 2)}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">Submitted</div>
                        <div>{selected.created}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last update</div>
                        <div>{selected.lastUpdate}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {selected.tags.map((t) => (
                            <span key={t} className="bg-muted px-2 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" /> Live preview
                      </Button>
                      <Button variant="outline" size="sm">
                        Download .zip
                      </Button>
                      <Button variant="outline" size="sm" disabled={isRunningQualityScan} onClick={() => void runQualityScan()}>
                        {isRunningQualityScan ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Search className="mr-1 h-3 w-3" />
                        )}
                        {isRunningQualityScan ? "Scanning..." : "Run quality scan"}
                      </Button>
                    </div>

                    <div className="mt-5 pt-4 border-t">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" /> Reviewer notes
                      </div>
                      <Textarea
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add review feedback for the author..."
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" disabled={isBulkApproving} onClick={() => void bulkDecide("live")}>
                          {isBulkApproving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          {isBulkApproving ? "Approving..." : "Bulk approve"}
                        </Button>
                        <Button variant="outline" disabled={isBulkSoftRejecting} onClick={() => void bulkDecide("soft_rejected")}>
                          {isBulkSoftRejecting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="mr-2 h-4 w-4" />
                          )}
                          {isBulkSoftRejecting ? "Rejecting..." : "Bulk soft reject"}
                        </Button>
                        <Button variant="outline" disabled={isBulkRejecting} onClick={() => void bulkDecide("rejected")}>
                          {isBulkRejecting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          {isBulkRejecting ? "Rejecting..." : "Bulk reject"}
                        </Button>
                        <Button
                          disabled={isApproving}
                          onClick={() => decide("live")}
                          className="bg-success hover:bg-success/90 text-white"
                        >
                          {isApproving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          {isApproving ? "Approving..." : "Approve & publish"}
                        </Button>
                        <Button disabled={isSoftRejecting} onClick={() => decide("soft_rejected")} variant="outline">
                          {isSoftRejecting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="mr-2 h-4 w-4" />
                          )}
                          {isSoftRejecting ? "Rejecting..." : "Soft reject"}
                        </Button>
                        <Button
                          disabled={isRejecting}
                          onClick={() => decide("rejected")}
                          variant="outline"
                          className="text-destructive border-destructive/50 hover:bg-destructive hover:text-white"
                        >
                          {isRejecting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {isRejecting ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default ReviewQueue;
