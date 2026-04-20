
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: SupportSettingsPage,
  head: () => ({ meta: [{ title: "Settings — Support — ERP Vala" }] }),
});

function SupportSettingsPage() {
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleEditResponse = async (response: string) => {
    setEditingResponse(response);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`"${response}" updated successfully`);
    } catch (error) {
      toast.error("Failed to update response");
    } finally {
      setEditingResponse(null);
    }
  };

  const handleAddResponse = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Canned response added successfully");
    } catch (error) {
      toast.error("Failed to add response");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Auto-Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable round-robin ticket assignment</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label>Auto-escalate after 4 hours</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label>Auto-close resolved tickets after 48h</Label>
            <Switch />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Canned Responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "License activation help",
            "Refund policy",
            "Billing cycle explanation",
            "Subscription cancellation",
          ].map((r) => (
            <div key={r} className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">{r}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditResponse(r)}
                disabled={editingResponse === r}
              >
                {editingResponse === r ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                {editingResponse === r ? "Saving..." : "Edit"}
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={handleAddResponse} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Canned Response"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupportSettingsPage;
