
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

({ component: AuthorSettings });

function AuthorSettings() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Author Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Username</Label>
              <Input defaultValue="PixelStack" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" defaultValue="hello@pixelstack.io" />
            </div>
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea rows={3} defaultValue="Building premium themes and plugins since 2018." />
          </div>
          <div>
            <Label>Country</Label>
            <Input defaultValue="United Kingdom" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Method</Label>
              <Input defaultValue="PayPal" />
            </div>
            <div>
              <Label>Account</Label>
              <Input defaultValue="hello@pixelstack.io" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Min payout threshold (USD)</Label>
              <Input type="number" defaultValue="100" />
            </div>
            <div>
              <Label>Tax form</Label>
              <Input defaultValue="W-8BEN submitted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "New sale",
            "New comment / question",
            "Item review status",
            "Weekly earnings summary",
            "Marketing tips",
          ].map((n) => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-sm">{n}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => toast.success("Settings saved")}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
