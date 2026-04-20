
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DataTable } from "@/components/DataTable";
import { Wallet, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useState } from "react";
import { toast } from "sonner";

({ component: Withdraw });

const HISTORY = [
  { id: "wd_005", date: "2024-12-15", method: "PayPal", amount: 8240.5, status: "pending" },
  { id: "wd_004", date: "2024-11-15", method: "PayPal", amount: 7820.0, status: "paid" },
  { id: "wd_003", date: "2024-10-15", method: "PayPal", amount: 6940.0, status: "paid" },
  { id: "wd_002", date: "2024-09-15", method: "Wire", amount: 5420.0, status: "paid" },
  { id: "wd_001", date: "2024-08-15", method: "Wire", amount: 4810.0, status: "paid" },
];

function Withdraw() {
  const [method, setMethod] = useState("paypal");
  const [amount, setAmount] = useState("8240.50");
  const balance = 8240.5;

  const cols = [
    { key: "date", header: "Date" },
    { key: "method", header: "Method" },
    { key: "amount", header: "Amount", render: (w: any) => `$${w.amount.toLocaleString()}` },
    {
      key: "status",
      header: "Status",
      render: (w: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${w.status === "paid" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"}`}
        >
          {w.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Withdraw Earnings</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Available Balance" value={`$${balance.toLocaleString()}`} icon={Wallet} />
        <StatCard
          title="Pending Clearance"
          value="$1,240"
          change="Clears in 14 days"
          changeType="neutral"
          icon={Clock}
        />
        <StatCard title="Paid YTD" value="$98,420" icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Amount (USD)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Min $100 · Max ${balance.toLocaleString()} (your available balance)
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Payout method</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="space-y-2">
                {[
                  { v: "paypal", label: "PayPal", fee: "Free", time: "1–2 days" },
                  { v: "wire", label: "Bank Wire (SWIFT)", fee: "$25 fee", time: "3–5 days" },
                  { v: "payoneer", label: "Payoneer", fee: "1% fee", time: "1 day" },
                  { v: "crypto", label: "Crypto (USDC)", fee: "$2 network fee", time: "Instant" },
                ].map((m) => (
                  <label
                    key={m.v}
                    className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:border-primary"
                  >
                    <RadioGroupItem value={m.v} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{m.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.fee} · {m.time}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => toast.success(`Withdrawal of $${amount} via ${method} requested`)}
            >
              Request withdrawal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Important info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>• Withdrawals are processed every Monday and Thursday.</p>
            <p>• A 30-day clearance period applies to new sales (refund window).</p>
            <p>• Tax forms (W-8BEN / W-9) must be on file before first payout.</p>
            <p>• Minimum payout threshold is $100.</p>
            <p>• Fees vary by method — see above.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdrawal history</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={cols} data={HISTORY} searchKey="method" />
        </CardContent>
      </Card>
    </div>
  );
}

export default HISTORY;