
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Target, Eye, ThumbsUp, TrendingUp, AlertTriangle, Loader2, FileText, RotateCcw, Sliders } from "lucide-react";
import {
  LineChart,
  Line,
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
  component: AdminFraudMlPage,
  head: () => ({ meta: [{ title: "Fraud ML Scoring — Admin — ERP Vala" }] }),
});

const modelPerformanceTrend = [
  { week: "W1", precision: 92.1, recall: 87.3, f1: 89.6 },
  { week: "W2", precision: 93.0, recall: 88.1, f1: 90.5 },
  { week: "W3", precision: 92.8, recall: 88.7, f1: 90.7 },
  { week: "W4", precision: 93.5, recall: 89.2, f1: 91.3 },
  { week: "W5", precision: 94.0, recall: 89.5, f1: 91.7 },
  { week: "W6", precision: 94.2, recall: 89.7, f1: 91.9 },
];

const scoredTransactions = [
  {
    id: "TXN-88921",
    customer: "user@suspicious.com",
    amount: "$1,200.00",
    riskScore: 94,
    features: "Velocity + IP mismatch",
    modelDecision: "blocked",
    analystDecision: "confirmed",
    outcome: "true_positive",
    timestamp: "2024-01-18 14:23",
  },
  {
    id: "TXN-88905",
    customer: "john@example.com",
    amount: "$89.00",
    riskScore: 12,
    features: "Normal pattern",
    modelDecision: "approved",
    analystDecision: "—",
    outcome: "true_negative",
    timestamp: "2024-01-18 14:18",
  },
  {
    id: "TXN-88890",
    customer: "test@mail.com",
    amount: "$1.00",
    riskScore: 87,
    features: "Card testing pattern",
    modelDecision: "blocked",
    analystDecision: "confirmed",
    outcome: "true_positive",
    timestamp: "2024-01-18 13:50",
  },
  {
    id: "TXN-88872",
    customer: "buyer@corp.com",
    amount: "$450.00",
    riskScore: 68,
    features: "Chargeback history",
    modelDecision: "review",
    analystDecision: "cleared",
    outcome: "false_positive",
    timestamp: "2024-01-18 13:30",
  },
  {
    id: "TXN-88861",
    customer: "jane@startup.io",
    amount: "$299.00",
    riskScore: 41,
    features: "New device",
    modelDecision: "review",
    analystDecision: "cleared",
    outcome: "false_positive",
    timestamp: "2024-01-18 13:10",
  },
  {
    id: "TXN-88840",
    customer: "alice@web.com",
    amount: "$599.00",
    riskScore: 8,
    features: "Trusted account",
    modelDecision: "approved",
    analystDecision: "—",
    outcome: "true_negative",
    timestamp: "2024-01-18 12:55",
  },
];

const reviewQueue = [
  {
    id: "RVW-201",
    txn: "TXN-88915",
    customer: "new_user@anon.io",
    amount: "$780.00",
    riskScore: 72,
    reason: "New account + high value + suspicious device",
    assignedTo: "—",
    queuedAt: "2024-01-18 14:30",
    status: "pending",
  },
  {
    id: "RVW-200",
    txn: "TXN-88908",
    customer: "mike@dev.com",
    amount: "$1,050.00",
    riskScore: 65,
    reason: "Geo mismatch — usual US, now via VPN",
    assignedTo: "Analyst A",
    queuedAt: "2024-01-18 14:15",
    status: "active",
  },
  {
    id: "RVW-199",
    txn: "TXN-88899",
    customer: "bob@corp.com",
    amount: "$340.00",
    riskScore: 61,
    reason: "3 failed attempts before success",
    assignedTo: "Analyst B",
    queuedAt: "2024-01-18 14:00",
    status: "active",
  },
];

const featureImportance = [
  { feature: "Transaction velocity (1h)", importance: 28.4 },
  { feature: "IP reputation score", importance: 19.7 },
  { feature: "Device fingerprint match", importance: 17.2 },
  { feature: "Chargeback history", importance: 14.5 },
  { feature: "Account age (days)", importance: 10.3 },
  { feature: "Geo mismatch", importance: 6.1 },
  { feature: "Card BIN country match", importance: 3.8 },
];

const PRIMARY = "#EB0045";
const INFO = "#00A7E1";
const SUCCESS = "#2ED9C3";

function AdminFraudMlPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

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

  const handleReviewPending = async () => {
    setIsReviewing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Review queue loaded");
    } catch (error) {
      toast.error("Failed to load review queue");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleAdjustThresholds = async () => {
    setIsAdjusting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Risk threshold settings opened");
    } catch (error) {
      toast.error("Failed to open threshold settings");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Advanced Fraud ML Scoring</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
          <Button onClick={handleRetrainModel} disabled={isRetraining}>
            {isRetraining ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isRetraining ? "Retraining..." : "Retrain Model"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Model Version"
          value="v2.4.1"
          icon={ShieldAlert}
          change="Deployed 2024-01-10"
          changeType="neutral"
        />
        <StatCard
          title="Precision"
          value="94.2%"
          icon={Target}
          change="+0.2% vs v2.4.0"
          changeType="positive"
        />
        <StatCard
          title="Recall"
          value="89.7%"
          icon={TrendingUp}
          change="+0.5% vs v2.4.0"
          changeType="positive"
        />
        <StatCard
          title="F1 Score"
          value="91.9%"
          icon={ThumbsUp}
          change="+0.3% vs v2.4.0"
          changeType="positive"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Trend (6 weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={modelPerformanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} domain={[85, 97]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="precision"
                  name="Precision"
                  stroke={INFO}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="recall"
                  name="Recall"
                  stroke={SUCCESS}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="f1"
                  name="F1 Score"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Importance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featureImportance.map((f) => (
                <div key={f.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{f.feature}</span>
                    <span className="font-medium">{f.importance}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, (f.importance / 30) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confusion Matrix Summary (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900 dark:bg-emerald-950">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">847</p>
              <p className="text-xs text-muted-foreground">True Positives</p>
              <p className="text-xs font-medium text-emerald-600">Fraud correctly blocked</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-900 dark:bg-blue-950">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">98,421</p>
              <p className="text-xs text-muted-foreground">True Negatives</p>
              <p className="text-xs font-medium text-blue-600">Legit correctly approved</p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center dark:border-yellow-900 dark:bg-yellow-950">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">52</p>
              <p className="text-xs text-muted-foreground">False Positives</p>
              <p className="text-xs font-medium text-yellow-600">Legit blocked (friction)</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">98</p>
              <p className="text-xs text-muted-foreground">False Negatives</p>
              <p className="text-xs font-medium text-red-600">Fraud missed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Recent ML-Scored Transactions"
        columns={[
          { header: "Transaction", accessorKey: "id" },
          { header: "Customer", accessorKey: "customer" },
          { header: "Amount", accessorKey: "amount" },
          {
            header: "Risk Score",
            accessorKey: "riskScore",
            cell: ({ row }) => {
              const score = row.original.riskScore;
              const color =
                score >= 80 ? "text-destructive" : score >= 60 ? "text-accent" : "text-success";
              return <span className={`font-mono font-bold ${color}`}>{score}</span>;
            },
          },
          { header: "Signals", accessorKey: "features" },
          {
            header: "Model Decision",
            accessorKey: "modelDecision",
            cell: ({ row }) => <StatusBadge status={row.original.modelDecision} />,
          },
          { header: "Analyst", accessorKey: "analystDecision" },
          {
            header: "Outcome",
            accessorKey: "outcome",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.outcome}</code>
            ),
          },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={scoredTransactions}
      />

      <DataTable
        title="Manual Review Queue"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Transaction", accessorKey: "txn" },
          { header: "Customer", accessorKey: "customer" },
          { header: "Amount", accessorKey: "amount" },
          {
            header: "Risk Score",
            accessorKey: "riskScore",
            cell: ({ row }) => (
              <span className="font-mono font-bold text-accent">{row.original.riskScore}</span>
            ),
          },
          { header: "Reason", accessorKey: "reason" },
          { header: "Assigned To", accessorKey: "assignedTo" },
          { header: "Queued", accessorKey: "queuedAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={reviewQueue}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleReviewPending} disabled={isReviewing}>
          {isReviewing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isReviewing ? "Loading..." : "Review All Pending"}
        </Button>
        <Button variant="outline" onClick={handleAdjustThresholds} disabled={isAdjusting}>
          {isAdjusting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sliders className="mr-2 h-4 w-4" />
          )}
          {isAdjusting ? "Opening..." : "Adjust Risk Thresholds"}
        </Button>
      </div>
    </div>
  );
}

export default AdminFraudMlPage;
