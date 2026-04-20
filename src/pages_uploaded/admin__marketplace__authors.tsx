
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  getMarketplaceAuthorOpsView,
  getUiErrorMessage,
  suspendMarketplaceAuthor,
  toggleMarketplaceAuthorFeatured,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: AdminAuthors });

type AuthorOpsRow = Awaited<ReturnType<typeof getMarketplaceAuthorOpsView>>[number];

function AdminAuthors() {
  const [authors, setAuthors] = useState<AuthorOpsRow[]>([]);

  useEffect(() => {
    void getMarketplaceAuthorOpsView()
      .then(setAuthors)
      .catch((error) => toast.error(getUiErrorMessage(error, "Failed to load authors.")));
  }, []);

  const featureAction = useSelfHealingAction(
    async (payload: { id: string }, signal) => {
      if (signal.aborted) throw new Error("Feature toggle aborted");
      await toggleMarketplaceAuthorFeatured(payload.id);
      return getMarketplaceAuthorOpsView();
    },
    {
      id: "admin-marketplace-author-feature",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: setAuthors,
      onError: (error) =>
        toast.error(getUiErrorMessage(error, "Could not update featured status.")),
    },
  );

  const suspendAction = useSelfHealingAction(
    async (payload: { id: string }, signal) => {
      if (signal.aborted) throw new Error("Suspend action aborted");
      await suspendMarketplaceAuthor(payload.id);
      return getMarketplaceAuthorOpsView();
    },
    {
      id: "admin-marketplace-author-suspend",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: setAuthors,
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not suspend author.")),
    },
  );

  const columns = [
    { key: "username", header: "Author" },
    { key: "country", header: "Country" },
    {
      key: "tier",
      header: "Tier",
      render: (a: any) => <span className="uppercase text-xs">{a.tier}</span>,
    },
    { key: "level", header: "Level" },
    { key: "items", header: "Items" },
    { key: "sales", header: "Sales", render: (a: any) => a.sales.toLocaleString() },
    { key: "earnings", header: "Earnings", render: (a: any) => `$${a.earnings.toLocaleString()}` },
    {
      key: "risk",
      header: "Risk",
      render: (a: any) => (
        <span className={a.risk >= 70 ? "text-destructive font-semibold" : "text-muted-foreground"}>
          {a.risk}
        </span>
      ),
    },
    {
      key: "reputationScore",
      header: "Reputation",
      render: (a: any) => a.reputationScore,
    },
    {
      key: "featured",
      header: "Featured",
      render: (a: any) => (
        <Button
          size="sm"
          variant={a.featured ? "default" : "outline"}
          className={a.featured ? "bg-primary" : ""}
          disabled={featureAction.isLoading}
          onClick={() =>
            void featureAction
              .trigger({ id: a.id })
              .then(() => toast.success(`${a.username} ${a.featured ? "unfeatured" : "featured"}`))
          }
        >
          {a.featured ? "Featured" : "Feature"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Authors</h1>
      <DataTable
        columns={columns}
        data={authors}
        searchKey="username"
        onEdit={(a) => {
          toast.info(`Manage ${a.username}`);
        }}
        onDelete={(a) => {
          void suspendAction
            .trigger({ id: a.id })
            .then(() => toast.warning(`Suspended ${a.username}`));
        }}
        getItemLabel={(a) => a.username}
      />
    </div>
  );
}

export default AdminAuthors;
