
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, ShieldAlert, Sparkles, Loader2, RotateCcw, FileText, Zap } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminAiAssistPage,
  head: () => ({ meta: [{ title: "AI Assist — Admin — ERP Vala" }] }),
});

const insights = [
  {
    id: "INS-001",
    type: "Churn Risk",
    title: "High churn probability for 12 Pro accounts",
    detail:
      "These accounts have < 2 logins in 30 days and no API activity. Recommend proactive outreach.",
    confidence: "91%",
    impact: "high",
    status: "active",
    detectedAt: "2024-01-18 08:00",
  },
  {
    id: "INS-002",
    type: "Upsell Opportunity",
    title: "34 Starter accounts near storage limit",
    detail: "Accounts within 10% of Starter storage cap. Ideal candidates for Pro upgrade prompt.",
    confidence: "87%",
    impact: "medium",
    status: "active",
    detectedAt: "2024-01-18 06:00",
  },
  {
    id: "INS-003",
    type: "Anomaly",
    title: "Unusual API call spike from tenant Gamma LLC",
    detail: "4× normal API volume starting 14:10. Could indicate runaway integration or scraping.",
    confidence: "78%",
    impact: "medium",
    status: "active",
    detectedAt: "2024-01-18 14:15",
  },
  {
    id: "INS-004",
    type: "Revenue",
    title: "MRR forecast: $76,400 for Feb 2024",
    detail: "Based on current growth rate, renewal success rate, and trial conversion trends.",
    confidence: "84%",
    impact: "low",
    status: "completed",
    detectedAt: "2024-01-18 00:00",
  },
];

const fraudPredictions = [
  {
    id: "FP-001",
    entity: "cust_4821@temp.com",
    entityType: "Customer",
    riskScore: 94,
    signals: "Disposable email, VPN, 3 payment attempts",
    action: "Block",
    status: "blocked",
    timestamp: "2024-01-18 14:22",
  },
  {
    id: "FP-002",
    entity: "merchant@newco.io",
    entityType: "Merchant",
    riskScore: 72,
    signals: "New account, high-value product, no purchase history",
    action: "Review",
    status: "pending",
    timestamp: "2024-01-18 13:10",
  },
  {
    id: "FP-003",
    entity: "buyer@corp.com",
    entityType: "Customer",
    riskScore: 38,
    signals: "Normal pattern, known device",
    action: "Allow",
    status: "cleared",
    timestamp: "2024-01-18 12:00",
  },
  {
    id: "FP-004",
    entity: "cust_8801@mail.ru",
    entityType: "Customer",
    riskScore: 88,
    signals: "Sanctioned region, card testing pattern, velocity trigger",
    action: "Block",
    status: "blocked",
    timestamp: "2024-01-18 11:30",
  },
];

const models = [
  {
    name: "Fraud Prediction v3",
    type: "Classification",
    accuracy: "96.2%",
    lastTrained: "2024-01-10",
    dataSets: "2.4M events",
    status: "active",
  },
  {
    name: "Churn Risk Scorer v2",
    type: "Regression",
    accuracy: "88.4%",
    lastTrained: "2024-01-01",
    dataSets: "180K accounts",
    status: "active",
  },
  {
    name: "Revenue Forecast v1",
    type: "Time Series",
    accuracy: "84.1%",
    lastTrained: "2024-01-01",
    dataSets: "24 months MRR",
    status: "active",
  },
  {
    name: "Anomaly Detector v2",
    type: "Unsupervised",
    accuracy: "—",
    lastTrained: "2024-01-15",
    dataSets: "API event stream",
    status: "active",
  },
];

function AdminAiAssistPage() {
  const [isRetraining, setIsRetraining] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [retrainingModel, setRetrainingModel] = useState<string | null>(null);

  const handleRetrainModels = async () => {
    setIsRetraining(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Models retrained with latest data");
    } catch (error) {
      toast.error("Failed to retrain models");
    } finally {
      setIsRetraining(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Insights report generated");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAct = async (id: string) => {
    setActingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Action taken");
    } catch (error) {
      toast.error("Failed to take action");
    } finally {
      setActingId(null);
    }
  };

  const handleRetrainModel = async (modelName: string) => {
    setRetrainingModel(modelName);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${modelName} retrain queued`);
    } catch (error) {
      toast.error("Failed to queue retrain");
    } finally {
      setRetrainingModel(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Assist Layer</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRetrainModels}
            disabled={isRetraining}
          >
            {isRetraining ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isRetraining ? "Retraining..." : "Retrain Models"}
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isGeneratingReport ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Insights (24h)"
          value="42"
          icon={Sparkles}
          change="4 high-impact"
          changeType="positive"
        />
        <StatCard
          title="Fraud Predictions"
          value="312"
          icon={ShieldAlert}
          change="98 blocked today"
          changeType="positive"
        />
        <StatCard
          title="Model Accuracy"
          value="96.2%"
          icon={TrendingUp}
          change="Fraud model (best)"
          changeType="positive"
        />
        <StatCard
          title="Active Models"
          value="4"
          icon={Brain}
          change="All healthy"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Smart Insights"
        columns={[
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.type}</code>
            ),
          },
          { header: "Title", accessorKey: "title" },
          { header: "Detail", accessorKey: "detail" },
          { header: "Confidence", accessorKey: "confidence" },
          {
            header: "Impact",
            accessorKey: "impact",
            cell: ({ row }) => <StatusBadge status={row.original.impact} />,
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAct(row.original.id)}
                disabled={actingId === row.original.id}
              >
                {actingId === row.original.id ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                {actingId === row.original.id ? "Acting..." : "Act"}
              </Button>
            ),
          },
        ]}
        data={insights}
      />

      <DataTable
        title="Fraud Predictions"
        columns={[
          { header: "Entity", accessorKey: "entity" },
          { header: "Type", accessorKey: "entityType" },
          {
            header: "Risk Score",
            accessorKey: "riskScore",
            cell: ({ row }) => {
              const s = row.original.riskScore;
              const color =
                s >= 80
                  ? "text-destructive font-bold"
                  : s >= 60
                    ? "text-accent font-bold"
                    : "text-success";
              return <span className={`font-mono ${color}`}>{s}</span>;
            },
          },
          { header: "Signals", accessorKey: "signals" },
          { header: "Recommended", accessorKey: "action" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={fraudPredictions}
      />

      <Card>
        <CardHeader>
          <CardTitle>AI Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.type} · Trained on {m.dataSets} · Last trained {m.lastTrained}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {m.accuracy !== "—" && (
                    <span className="text-sm font-bold text-success">{m.accuracy}</span>
                  )}
                  <StatusBadge status={m.status} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetrainModel(m.name)}
                    disabled={retrainingModel === m.name}
                  >
                    {retrainingModel === m.name ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-3 w-3" />
                    )}
                    {retrainingModel === m.name ? "Retraining..." : "Retrain"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
