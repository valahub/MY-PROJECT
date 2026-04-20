
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({ component: Levels });

const LEVELS = [
  { level: 1, name: "Author L1", min: 0, commission: 37.5, badge: "L1" },
  { level: 2, name: "Author L2", min: 1000, commission: 40, badge: "L2" },
  { level: 3, name: "Author L3", min: 5000, commission: 45, badge: "L3" },
  { level: 4, name: "Author L4", min: 10000, commission: 50, badge: "L4" },
  { level: 5, name: "Author L5", min: 25000, commission: 60, badge: "L5" },
  { level: 6, name: "Elite Author", min: 50000, commission: 65, badge: "ELITE" },
  { level: 7, name: "Power Elite", min: 250000, commission: 70, badge: "POWER" },
];

function Levels() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Level configuration saved");
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Author Levels</h1>
        <p className="text-sm text-muted-foreground">
          Configure level thresholds and commission rates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Level configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left p-2">Level</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Min Earnings (USD)</th>
                  <th className="text-left p-2">Commission %</th>
                  <th className="text-left p-2">Badge</th>
                  <th className="text-left p-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((l) => (
                  <tr key={l.level} className="border-b">
                    <td className="p-2 font-bold">L{l.level}</td>
                    <td className="p-2">
                      <Input defaultValue={l.name} className="h-8" />
                    </td>
                    <td className="p-2">
                      <Input type="number" defaultValue={l.min} className="h-8 w-32" />
                    </td>
                    <td className="p-2">
                      <Input type="number" defaultValue={l.commission} className="h-8 w-20" />
                    </td>
                    <td className="p-2">
                      <Input defaultValue={l.badge} className="h-8 w-24" />
                    </td>
                    <td className="p-2">
                      <Switch defaultChecked />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exclusive author bonuses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Exclusive author</div>
              <div className="text-xs text-muted-foreground">+5% commission for exclusivity</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Item of the day bonus</div>
              <div className="text-xs text-muted-foreground">$200 paid for featured spot</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Annual quality bonus</div>
              <div className="text-xs text-muted-foreground">
                $1000 for zero-soft-rejects in a year
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
