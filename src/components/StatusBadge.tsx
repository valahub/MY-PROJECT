import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  completed: "bg-success/15 text-success border-success/30",
  success: "bg-success/15 text-success border-success/30",
  recovered: "bg-success/15 text-success border-success/30",
  paid: "bg-success/15 text-success border-success/30",
  enabled: "bg-success/15 text-success border-success/30",
  cleared: "bg-success/15 text-success border-success/30",
  low: "bg-success/15 text-success border-success/30",
  trialing: "bg-info/15 text-info border-info/30",
  pending: "bg-accent/15 text-accent border-accent/30",
  medium: "bg-accent/15 text-accent border-accent/30",
  past_due: "bg-primary/15 text-primary border-primary/30",
  high: "bg-primary/15 text-primary border-primary/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  blocked: "bg-destructive/15 text-destructive border-destructive/30",
  paused: "bg-muted text-muted-foreground border-border",
  canceled: "bg-destructive/15 text-destructive border-destructive/30",
  inactive: "bg-destructive/15 text-destructive border-destructive/30",
  refunded: "bg-destructive/15 text-destructive border-destructive/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  disabled: "bg-destructive/15 text-destructive border-destructive/30",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  const colors =
    statusColors[status.toLowerCase()] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("capitalize text-xs font-medium", colors)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
