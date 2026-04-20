
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Flag, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  acquireMarketplaceEditLock,
  getUiErrorMessage,
  recordMarketplaceManagerAction,
  releaseMarketplaceEditLock,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: FlagsManager });

const REPORTS = [
  {
    id: "r1",
    item: "BizPro Admin Dashboard",
    reporter: "user_4231",
    reason: "Copyright violation",
    severity: "high",
    time: "2h ago",
    details: "Contains assets from Material UI without proper licensing.",
  },
  {
    id: "r2",
    item: "FoodGo Flutter App",
    reporter: "competitor_x",
    reason: "Misleading description",
    severity: "medium",
    time: "5h ago",
    details: "Claims iOS support but only ships Android.",
  },
  {
    id: "r3",
    item: "WP Booking Engine",
    reporter: "buyer_2840",
    reason: "Broken / non-functional",
    severity: "low",
    time: "1d ago",
    details: "Plugin breaks on PHP 8.2.",
  },
  {
    id: "r4",
    item: "Vue POS System",
    reporter: "researcher_007",
    reason: "Security vulnerability",
    severity: "critical",
    time: "30m ago",
    details: "SQL injection in /api/pos/sale endpoint.",
  },
];

function FlagsManager() {
  const [list, setList] = useState(REPORTS);
  const [reply, setReply] = useState<Record<string, string>>({});

  const resolveAction = useSelfHealingAction(
    async (
      payload: { id: string; action: "takedown" | "warn" | "dismiss"; note: string },
      signal,
    ) => {
      if (signal.aborted) throw new Error("Resolve action aborted");
      await acquireMarketplaceEditLock("flag", payload.id, "admin.marketplace");
      try {
        await recordMarketplaceManagerAction({
          action: `flag.${payload.action}`,
          entity: "flag",
          entityId: payload.id,
          details: payload.note || "No reviewer note",
          idempotencyKey: `flag-${payload.action}-${payload.id}-${Date.now()}`,
        });
      } finally {
        await releaseMarketplaceEditLock("flag", payload.id, "admin.marketplace");
      }
      return payload;
    },
    {
      id: "admin-marketplace-flag-resolve",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: (payload) => {
        setList((l) => l.filter((r) => r.id !== payload.id));
        toast.success(
          payload.action === "takedown"
            ? "Item taken down"
            : payload.action === "warn"
              ? "Warning sent to author"
              : "Report dismissed",
        );
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not resolve report.")),
    },
  );

  const sevColor = (s: string) =>
    s === "critical"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : s === "high"
        ? "bg-primary/15 text-primary border-primary/30"
        : s === "medium"
          ? "bg-accent/15 text-accent border-accent/30"
          : "bg-info/15 text-info border-info/30";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="h-6 w-6 text-primary" /> Reports & Takedowns
        </h1>
        <p className="text-sm text-muted-foreground">
          Review user reports, copyright complaints, and security issues.
        </p>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              All reports resolved 🎉
            </CardContent>
          </Card>
        ) : (
          list.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.item}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${sevColor(r.severity)}`}
                      >
                        {r.severity}
                      </span>
                      <span className="text-xs text-muted-foreground">· {r.time}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      <span className="font-medium">{r.reason}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Reported by {r.reporter}
                    </div>
                    <p className="text-sm mt-2 p-2 bg-muted/40 rounded">{r.details}</p>

                    <div className="mt-3">
                      <Textarea
                        rows={2}
                        placeholder="Internal notes / message to author..."
                        value={reply[r.id] || ""}
                        onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/50 hover:bg-destructive hover:text-white"
                        disabled={resolveAction.isLoading}
                        onClick={() =>
                          void resolveAction.trigger({
                            id: r.id,
                            action: "takedown",
                            note: reply[r.id] || "Takedown action",
                          })
                        }
                      >
                        <Shield className="h-3 w-3 mr-1" /> Take down item
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resolveAction.isLoading}
                        onClick={() =>
                          void resolveAction.trigger({
                            id: r.id,
                            action: "warn",
                            note: reply[r.id] || "Author warning issued",
                          })
                        }
                      >
                        Warn author
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={resolveAction.isLoading}
                        onClick={() =>
                          void resolveAction.trigger({
                            id: r.id,
                            action: "dismiss",
                            note: reply[r.id] || "Report dismissed",
                          })
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default REPORTS;