
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { TrendingUp, Cpu, Zap, Clock, Loader2, RotateCcw, Settings } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminLoadPredictionPage,
  head: () => ({ meta: [{ title: "Smart Load Prediction — Admin — ERP Vala" }] }),
});

const forecastData = [
  { time: "00:00", actual: 1200, predicted: 1150, scaled: 1400 },
  { time: "02:00", actual: 800, predicted: 820, scaled: 1000 },
  { time: "04:00", actual: 600, predicted: 610, scaled: 800 },
  { time: "06:00", actual: 1100, predicted: 1080, scaled: 1300 },
  { time: "08:00", actual: 3800, predicted: 3900, scaled: 4500 },
  { time: "10:00", actual: 6200, predicted: 6100, scaled: 7000 },
  { time: "12:00", actual: 7800, predicted: 7900, scaled: 9000 },
  { time: "14:00", actual: 7200, predicted: 7300, scaled: 8500 },
  { time: "16:00", actual: 8100, predicted: 8200, scaled: 9500 },
  { time: "18:00", actual: 6400, predicted: 6500, scaled: 7500 },
  { time: "20:00", actual: 4200, predicted: 4300, scaled: 5000 },
  { time: "22:00", actual: 2100, predicted: 2050, scaled: 2500 },
];

const scalingEvents = [
  {
    id: "SC-001",
    trigger: "Predicted traffic spike (+140%)",
    service: "Billing API",
    scaleFrom: "3 replicas",
    scaleTo: "8 replicas",
    scheduledAt: "2024-01-18 07:45",
    executedAt: "2024-01-18 08:00",
    status: "completed",
  },
  {
    id: "SC-002",
    trigger: "End-of-month billing run",
    service: "Subscription Engine",
    scaleFrom: "2 replicas",
    scaleTo: "6 replicas",
    scheduledAt: "2024-01-31 23:50",
    executedAt: "2024-01-31 23:55",
    status: "scheduled",
  },
  {
    id: "SC-003",
    trigger: "Predicted DB load spike",
    service: "Read Replica Pool",
    scaleFrom: "2 replicas",
    scaleTo: "5 replicas",
    scheduledAt: "2024-01-18 11:45",
    executedAt: "2024-01-18 12:00",
    status: "completed",
  },
  {
    id: "SC-004",
    trigger: "Holiday traffic model",
    service: "API Gateway",
    scaleFrom: "4 replicas",
    scaleTo: "12 replicas",
    scheduledAt: "2024-12-24 18:00",
    executedAt: "—",
    status: "scheduled",
  },
];

const PRIMARY = "#EB0045";
const SECONDARY = "#0033A1";
const INFO = "#00A7E1";

function AdminLoadPredictionPage() {
  const [isRetraining, setIsRetraining] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleRetrainModel = async () => {
    if (!confirm("Are you sure you want to retrain the model? This may take several minutes.")) {
      return;
    }
    setIsRetraining(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Model retraining initiated successfully");
    } catch (error) {
      toast.error("Failed to initiate model retraining");
    } finally {
      setIsRetraining(false);
    }
  };

  const handleConfigureRules = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Scaling rules configured successfully");
    } catch (error) {
      toast.error("Failed to configure scaling rules");
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Smart Load Prediction</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRetrainModel} disabled={isRetraining}>
            {isRetraining ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isRetraining ? "Retraining..." : "Retrain Model"}
          </Button>
          <Button onClick={handleConfigureRules} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Scaling Rules"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Prediction Accuracy"
          value="97.3%"
          icon={TrendingUp}
          change="7-day rolling average"
          changeType="positive"
        />
        <StatCard
          title="Pre-scale Events (30d)"
          value="18"
          icon={Zap}
          change="All executed on time"
          changeType="positive"
        />
        <StatCard
          title="Avg Lead Time"
          value="15 min"
          icon={Clock}
          change="Before spike onset"
          changeType="positive"
        />
        <StatCard
          title="Cost Saved"
          value="$2,840"
          icon={Cpu}
          change="Avoided emergency over-provision"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Forecast vs Actual (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke={SECONDARY}
                fill={`${SECONDARY}20`}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke={PRIMARY}
                fill={`${PRIMARY}20`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="scaled"
                name="Scaled Capacity"
                stroke={INFO}
                fill={`${INFO}10`}
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Model Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { signal: "Historical traffic patterns", weight: "35%" },
              { signal: "Day-of-week & time-of-day", weight: "25%" },
              { signal: "Scheduled batch jobs", weight: "20%" },
              { signal: "Calendar events (billing cycles, holidays)", weight: "20%" },
            ].map((s) => (
              <div key={s.signal} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{s.signal}</p>
                <p className="mt-1 text-xl font-bold">{s.weight}</p>
                <p className="text-xs text-muted-foreground">model weight</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Pre-Scale Events"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Trigger", accessorKey: "trigger" },
          { header: "Service", accessorKey: "service" },
          { header: "From", accessorKey: "scaleFrom" },
          { header: "To", accessorKey: "scaleTo" },
          { header: "Scheduled", accessorKey: "scheduledAt" },
          { header: "Executed", accessorKey: "executedAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={scalingEvents}
      />
    </div>
  );
}

export default AdminLoadPredictionPage;
