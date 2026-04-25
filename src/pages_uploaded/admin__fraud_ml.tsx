
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Brain, Target, Activity, AlertTriangle, Check, X, Clock, TrendingUp, Zap, BarChart3, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type MLModel, type ConfusionMatrix, type ModelPrediction, type FraudReviewQueueItem, type FeatureImportance, type ModelDriftAlert } from "@/lib/api/admin-services";

({ component: AdminFraudML, head: () => ({ meta: [{ title: "Fraud ML — Admin — ERP Vala" }] }) });

function AdminFraudML() {
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<MLModel | null>(null);
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrix | null>(null);
  const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
  const [reviewQueue, setReviewQueue] = useState<FraudReviewQueueItem[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance | null>(null);
  const [driftAlerts, setDriftAlerts] = useState<ModelDriftAlert[]>([]);
  const [selectedReview, setSelectedReview] = useState<FraudReviewQueueItem | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(70);

  const loadData = async () => {
    setLoading(true);
    try {
      setModel(marketplaceService.getActiveModel());
      setConfusionMatrix((await marketplaceService.calculateConfusionMatrix("24h")));
      setPredictions(marketplaceService.getRecentPredictions(50));
      marketplaceService.updateReviewSLAStatuses();
      setReviewQueue(marketplaceService.getFraudReviewQueue());
      setFeatureImportance(await marketplaceService.calculateFeatureImportance());
      setDriftAlerts(marketplaceService.getDriftAlerts());
    } catch (error) {
      toast.error("Failed to load ML data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetrain = async () => {
    if (!model) return;
    setIsRetraining(true);
    try {
      await marketplaceService.retrainModel(model.id, "admin");
      toast.success("Model retraining initiated");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to retrain model");
    } finally {
      setIsRetraining(false);
    }
  };

  const handleAdjustThreshold = async () => {
    if (!model) return;
    try {
      await marketplaceService.adjustThreshold(model.id, thresholdInput, "admin");
      toast.success("Threshold adjusted");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to adjust threshold");
    }
  };

  const handleCompleteReview = async (itemId: string, decision: "approve" | "block" | "escalate", notes?: string) => {
    try {
      await marketplaceService.completeReview(itemId, decision, notes, "admin");
      toast.success("Review completed");
      setSelectedReview(null);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete review");
    }
  };

  const handleAssignReview = async (itemId: string) => {
    try {
      await marketplaceService.assignReviewItem(itemId, "admin");
      toast.success("Review assigned");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign review");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-green-600";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
      case "approved":
        return "bg-green-100 text-green-800";
      case "training":
      case "pending":
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
      case "escalated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Advanced Fraud ML Scoring</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {model && (
            <Button onClick={handleRetrain} disabled={isRetraining || model.status === "training"}>
              {isRetraining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              {isRetraining ? "Retraining..." : "Retrain Model"}
            </Button>
          )}
        </div>
      </div>

      {model && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Model Version" value={model.version} icon={Brain} />
          <StatCard title="Precision" value={`${model.precision.toFixed(1)}%`} icon={Target} />
          <StatCard title="Recall" value={`${model.recall.toFixed(1)}%`} icon={Activity} />
          <StatCard title="F1 Score" value={`${model.f1Score.toFixed(1)}%`} icon={BarChart3} />
        </div>
      )}

      {model && model.driftDetected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Model Drift Detected</p>
            </div>
            <p className="text-sm text-red-700 mt-1">Performance degradation detected. Consider retraining the model.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Model Core</CardTitle>
        </CardHeader>
        <CardContent>
          {model ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className={`text-sm font-medium ${getStatusColor(model.status)}`}>{model.status.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Threshold</label>
                  <p className="text-sm font-medium">{model.threshold}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deployed At</label>
                  <p className="text-sm">{formatDate(model.deployedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Trained At</label>
                  <p className="text-sm">{formatDate(model.trainedAt)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Features</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {model.features.map((feature, index) => (
                    <span key={index} className="text-xs px-2 py-0.5 rounded bg-gray-100">{feature}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Adjust Threshold:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(parseInt(e.target.value) || 0)}
                  className="w-20 p-1 border rounded"
                />
                <Button size="sm" onClick={handleAdjustThreshold}>
                  Apply
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active model</p>
          )}
        </CardContent>
      </Card>

      {confusionMatrix && (
        <Card>
          <CardHeader>
            <CardTitle>Confusion Matrix (24H)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded bg-green-50">
                <p className="text-sm font-medium text-green-800">True Positive</p>
                <p className="text-2xl font-bold text-green-900">{confusionMatrix.truePositive}</p>
                <p className="text-xs text-green-700">Fraud correctly blocked</p>
              </div>
              <div className="p-4 border rounded bg-green-50">
                <p className="text-sm font-medium text-green-800">True Negative</p>
                <p className="text-2xl font-bold text-green-900">{confusionMatrix.trueNegative}</p>
                <p className="text-xs text-green-700">Legit approved</p>
              </div>
              <div className="p-4 border rounded bg-yellow-50">
                <p className="text-sm font-medium text-yellow-800">False Positive</p>
                <p className="text-2xl font-bold text-yellow-900">{confusionMatrix.falsePositive}</p>
                <p className="text-xs text-yellow-700">Legit blocked</p>
              </div>
              <div className="p-4 border rounded bg-red-50">
                <p className="text-sm font-medium text-red-800">False Negative</p>
                <p className="text-2xl font-bold text-red-900">{confusionMatrix.falseNegative}</p>
                <p className="text-xs text-red-700">Fraud missed</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Precision</label>
                <p className="text-lg font-bold">{confusionMatrix.precision.toFixed(1)}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Recall</label>
                <p className="text-lg font-bold">{confusionMatrix.recall.toFixed(1)}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">F1 Score</label>
                <p className="text-lg font-bold">{confusionMatrix.f1Score.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent ML-Scored Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : predictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No predictions yet</p>
          ) : (
            <div className="space-y-2">
              {predictions.slice(0, 20).map((prediction) => (
                <div key={prediction.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{prediction.transactionId}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{prediction.modelVersion}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(prediction.modelDecision)}`}>
                        {prediction.modelDecision.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Risk Score: <span className={`font-medium ${getRiskColor(prediction.riskScore)}`}>{prediction.riskScore}</span></span>
                      <span>Latency: {prediction.latency}ms</span>
                      <span>{formatDate(prediction.timestamp)}</span>
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-medium">Signals:</span> {prediction.signals.map((s) => s.feature).join(", ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items in review queue</p>
          ) : (
            <div className="space-y-2">
              {reviewQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.transactionId}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{item.customerEmail}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Amount: ${item.amount.toFixed(2)}</span>
                      <span>Risk Score: <span className={`font-medium ${getRiskColor(item.riskScore)}`}>{item.riskScore}</span></span>
                      <span>Reason: {item.reason}</span>
                      <span>SLA Due: {formatDate(item.slaDueAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {item.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handleAssignReview(item.id)}>
                        <Users className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedReview(item)}>
                      <Activity className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {featureImportance && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Importance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {featureImportance.features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{feature.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      feature.trend === "up" ? "bg-green-100 text-green-800" :
                      feature.trend === "down" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {feature.trend.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Transaction</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                <p className="text-sm">{selectedReview.transactionId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer</label>
                <p className="text-sm">{selectedReview.customerEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="text-sm">${selectedReview.amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Risk Score</label>
                <p className={`text-sm font-bold ${getRiskColor(selectedReview.riskScore)}`}>{selectedReview.riskScore}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="text-sm">{selectedReview.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Signals</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedReview.signals.map((signal, index) => (
                    <span key={index} className="text-xs px-2 py-0.5 rounded bg-gray-100">{signal}</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <input
                  className="w-full mt-1 p-2 border rounded"
                  placeholder="Enter review notes"
                  id="reviewNotes"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const notes = (document.getElementById("reviewNotes") as HTMLInputElement)?.value;
                    handleCompleteReview(selectedReview.id, "approve", notes);
                  }}
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    const notes = (document.getElementById("reviewNotes") as HTMLInputElement)?.value;
                    handleCompleteReview(selectedReview.id, "block", notes);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Block
                </Button>
                <Button
                  onClick={() => {
                    const notes = (document.getElementById("reviewNotes") as HTMLInputElement)?.value;
                    handleCompleteReview(selectedReview.id, "escalate", notes);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Escalate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminFraudML;
