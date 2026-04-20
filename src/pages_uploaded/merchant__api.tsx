
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Key, Code, BookOpen, Loader2, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

({ component: MerchantAPI });

function MerchantAPI() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleCopyKey = async (keyName: string, keyValue: string) => {
    setCopiedKey(keyName);
    try {
      await navigator.clipboard.writeText(keyValue);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error("Failed to copy API key");
      setCopiedKey(null);
    }
  };

  const handleRegenerateKeys = async () => {
    if (!confirm("Are you sure you want to regenerate your API keys? This will invalidate all existing keys.")) {
      return;
    }
    setIsRegenerating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("API keys regenerated successfully");
    } catch (error) {
      toast.error("Failed to regenerate API keys");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleViewDocumentation = () => {
    if (typeof window !== "undefined") {
      window.open("https://docs.erpvala.com", "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Live API Key</label>
              <div className="flex gap-2">
                <Input value="live_sk_erp_vala_••••••••••••" readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyKey("live", "live_sk_erp_vala_1234567890")}
                >
                  {copiedKey === "live" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sandbox API Key</label>
              <div className="flex gap-2">
                <Input value="test_sk_erp_vala_••••••••••••" readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyKey("sandbox", "test_sk_erp_vala_1234567890")}
                >
                  {copiedKey === "sandbox" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={handleRegenerateKeys} disabled={isRegenerating}>
              {isRegenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isRegenerating ? "Regenerating..." : "Regenerate Keys"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the ERP Vala API to manage products, subscriptions, and payments programmatically.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Base URL</p>
              <code className="block rounded-md bg-muted p-2 text-xs">
                https://api.erpvala.com/v1
              </code>
            </div>
            <Button variant="outline" onClick={handleViewDocumentation}>
              View Full Documentation
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="prices">Prices</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="licenses">Licenses</TabsTrigger>
            </TabsList>
            {["products", "prices", "subscriptions", "transactions", "licenses"].map((ep) => (
              <TabsContent key={ep} value={ep} className="mt-4 space-y-3">
                {[
                  { method: "GET", path: `/${ep}`, desc: `List all ${ep}` },
                  { method: "GET", path: `/${ep}/:id`, desc: `Get a ${ep.slice(0, -1)}` },
                  { method: "POST", path: `/${ep}`, desc: `Create a ${ep.slice(0, -1)}` },
                  { method: "PATCH", path: `/${ep}/:id`, desc: `Update a ${ep.slice(0, -1)}` },
                ].map((api) => (
                  <div
                    key={api.path + api.method}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${api.method === "GET" ? "bg-blue-100 text-blue-700" : api.method === "POST" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {api.method}
                    </span>
                    <code className="text-sm">{api.path}</code>
                    <span className="ml-auto text-xs text-muted-foreground">{api.desc}</span>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
