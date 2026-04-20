
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: SupportSearchPage,
  head: () => ({ meta: [{ title: "Search — Support — ERP Vala" }] }),
});

function SupportSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Search completed");
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    toast.info(`Filter: ${filter}`);
  };

  const handleQuickAction = async (action: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Action: ${action}`);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer email, ticket ID, license key, subscription ID..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleFilterClick("Tickets")}>
              Tickets
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFilterClick("Customers")}>
              Customers
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFilterClick("Subscriptions")}>
              Subscriptions
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFilterClick("Licenses")}>
              Licenses
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFilterClick("Payments")}>
              Payments
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Look up customer by email",
              "Find subscription by ID",
              "Validate license key",
              "Check payment status",
              "View merchant products",
              "Review refund request",
            ].map((action) => (
              <Button
                key={action}
                variant="outline"
                className="justify-start h-auto py-3 text-left"
                onClick={() => handleQuickAction(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupportSearchPage;
