
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Shield, Gavel, FileWarning, Mail } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  acquireMarketplaceEditLock,
  getUiErrorMessage,
  recordMarketplaceManagerAction,
  releaseMarketplaceEditLock,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: Takedowns });

const REQUESTS = [
  {
    id: "tk_001",
    item: "Old Bootstrap Theme Clone",
    reporter: "Acme Inc.",
    type: "DMCA",
    filed: "2024-12-14",
    deadline: "2024-12-28",
    status: "investigating",
  },
  {
    id: "tk_002",
    item: "Cloned WP Plugin v2",
    reporter: "Plugin Co.",
    type: "Trademark",
    filed: "2024-12-12",
    deadline: "2024-12-26",
    status: "pending",
  },
  {
    id: "tk_003",
    item: "Stolen Mobile UI Kit",
    reporter: "DesignHub",
    type: "DMCA",
    filed: "2024-12-10",
    deadline: "2024-12-24",
    status: "removed",
  },
  {
    id: "tk_004",
    item: "Disputed Stock Photo Pack",
    reporter: "PhotoVault",
    type: "Counter-claim",
    filed: "2024-12-05",
    deadline: "2024-12-19",
    status: "rejected",
  },
];

function Takedowns() {
  const [cases, setCases] = useState(REQUESTS);

  const caseAction = useSelfHealingAction(
    async (
      payload: { id: string; action: "removed" | "rejected" | "investigating"; item: string },
      signal,
    ) => {
      if (signal.aborted) throw new Error("Case action aborted");
      await acquireMarketplaceEditLock("takedown", payload.id, "admin.marketplace");
      try {
        await recordMarketplaceManagerAction({
          action: `takedown.${payload.action}`,
          entity: "takedown",
          entityId: payload.id,
          details: `${payload.item} -> ${payload.action}`,
          idempotencyKey: `takedown-${payload.action}-${payload.id}-${Date.now()}`,
        });
      } finally {
        await releaseMarketplaceEditLock("takedown", payload.id, "admin.marketplace");
      }
      return payload;
    },
    {
      id: "admin-marketplace-takedown-action",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: (payload) => {
        setCases((prev) =>
          prev.map((entry) =>
            entry.id === payload.id ? { ...entry, status: payload.action } : entry,
          ),
        );
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Case action failed.")),
    },
  );

  const cols = [
    { key: "id", header: "Case" },
    { key: "item", header: "Item" },
    { key: "reporter", header: "Reporter" },
    {
      key: "type",
      header: "Type",
      render: (t: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${t.type === "DMCA" ? "bg-destructive/15 text-destructive" : t.type === "Trademark" ? "bg-accent/15 text-accent" : "bg-info/15 text-info"}`}
        >
          {t.type}
        </span>
      ),
    },
    { key: "filed", header: "Filed" },
    { key: "deadline", header: "Deadline" },
    {
      key: "status",
      header: "Status",
      render: (t: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${t.status === "removed" ? "bg-destructive/15 text-destructive" : t.status === "rejected" ? "bg-muted text-muted-foreground" : "bg-accent/15 text-accent"}`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (t: any) =>
        t.status === "pending" || t.status === "investigating" ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-white h-7"
              disabled={caseAction.isLoading}
              onClick={() =>
                void caseAction.trigger({ id: t.id, action: "removed", item: t.item }).then(() => {
                  toast.success(`Item removed for case ${t.id}`);
                })
              }
            >
              <Gavel className="h-3 w-3 mr-1" /> Take down
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              disabled={caseAction.isLoading}
              onClick={() =>
                void caseAction
                  .trigger({ id: t.id, action: "investigating", item: t.item })
                  .then(() => toast.info(`Notice sent to author`))
              }
            >
              <Mail className="h-3 w-3 mr-1" /> Notify author
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              disabled={caseAction.isLoading}
              onClick={() =>
                void caseAction.trigger({ id: t.id, action: "rejected", item: t.item }).then(() => {
                  toast.info("Counter-claim period opened");
                })
              }
            >
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6 text-destructive" /> DMCA & Takedowns
      </h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          title="Active Cases"
          value="11"
          change="3 due this week"
          changeType="negative"
          icon={FileWarning}
        />
        <StatCard title="DMCA Filed (30d)" value="28" icon={Shield} />
        <StatCard title="Items Removed" value="14" icon={Gavel} />
        <StatCard title="Counter-claims" value="2" icon={Mail} />
      </div>
      <DataTable columns={cols} data={cases} searchKey="item" />
    </div>
  );
}

export default Takedowns;