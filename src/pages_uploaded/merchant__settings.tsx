
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: MerchantSettings });

function MerchantSettings() {
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isSavingCheckout, setIsSavingCheckout] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleSaveBusiness = async () => {
    setIsSavingBusiness(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Business details saved successfully");
    } catch (error) {
      toast.error("Failed to save business details");
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleSaveCheckout = async () => {
    setIsSavingCheckout(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Checkout settings saved successfully");
    } catch (error) {
      toast.error("Failed to save checkout settings");
    } finally {
      setIsSavingCheckout(false);
    }
  };

  const handleInviteTeamMember = async () => {
    setIsInviting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Invitation sent successfully");
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="business" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name</label>
                  <Input defaultValue="Acme Software" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Legal Name</label>
                  <Input defaultValue="Acme Software Inc." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax ID / VAT</label>
                  <Input defaultValue="US123456789" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Input defaultValue="United States" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Support Email</label>
                  <Input defaultValue="support@acme.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input defaultValue="https://acme.com" />
                </div>
              </div>
              <Button onClick={handleSaveBusiness} disabled={isSavingBusiness}>
                {isSavingBusiness ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSavingBusiness ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="checkout" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checkout Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Color</label>
                <Input type="color" defaultValue="#1a1a2e" className="h-10 w-20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo URL</label>
                <Input defaultValue="https://acme.com/logo.png" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Success Redirect URL</label>
                <Input defaultValue="https://acme.com/thank-you" />
              </div>
              <Button onClick={handleSaveCheckout} disabled={isSavingCheckout}>
                {isSavingCheckout ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSavingCheckout ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Payment received",
                "Subscription created",
                "Subscription canceled",
                "Payment failed",
                "Refund issued",
                "License activated",
              ].map((n) => (
                <div key={n} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm">{n}</span>
                  <span className="text-xs font-medium text-green-600">Enabled</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Admin User", email: "admin@acme.com", role: "Owner" },
                { name: "Sarah Dev", email: "sarah@acme.com", role: "Developer" },
                { name: "Mike Support", email: "mike@acme.com", role: "Support" },
              ].map((m) => (
                <div
                  key={m.email}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className="text-xs font-medium">{m.role}</span>
                </div>
              ))}
              <Button variant="outline" onClick={handleInviteTeamMember} disabled={isInviting}>
                {isInviting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {isInviting ? "Inviting..." : "Invite Team Member"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MerchantSettings;
