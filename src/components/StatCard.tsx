import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {change && (
          <p
            className={cn(
              "mt-1 text-xs",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-primary",
              changeType === "neutral" && "text-muted-foreground",
            )}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
