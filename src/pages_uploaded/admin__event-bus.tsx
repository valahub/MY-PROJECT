
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Radio, Inbox, AlertTriangle, Users, Loader2, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminEventBusPage,
  head: () => ({ meta: [{ title: "Event Bus — Admin — ERP Vala" }] }),
});

const topics = [
  {
    id: "TOP-001",
    name: "payment.events",
    broker: "Kafka",
    partitions: 12,
    messages: "4.2M",
    lag: "0",
    consumers: 4,
    retention: "7 days",
    status: "active",
  },
  {
    id: "TOP-002",
    name: "subscription.lifecycle",
    broker: "Kafka",
    partitions: 6,
    messages: "820K",
    lag: "0",
    consumers: 2,
    retention: "14 days",
    status: "active",
  },
  {
    id: "TOP-003",
    name: "fraud.signals",
    broker: "Kafka",
    partitions: 4,
    messages: "1.1M",
    lag: "3",
    consumers: 3,
    retention: "30 days",
    status: "active",
  },
  {
    id: "TOP-004",
    name: "email.notifications",
    broker: "RabbitMQ",
    partitions: 1,
    messages: "92K",
    lag: "0",
    consumers: 2,
    retention: "3 days",
    status: "active",
  },
  {
    id: "TOP-005",
    name: "audit.log.stream",
    broker: "Kafka",
    partitions: 8,
    messages: "12.4M",
    lag: "0",
    consumers: 1,
    retention: "90 days",
    status: "active",
  },
  {
    id: "TOP-006",
    name: "billing.dead-letter",
    broker: "RabbitMQ",
    partitions: 1,
    messages: "142",
    lag: "142",
    consumers: 0,
    retention: "7 days",
    status: "pending",
  },
];

const replayJobs = [
  {
    id: "RPL-001",
    topic: "payment.events",
    from: "2024-01-15 00:00",
    to: "2024-01-15 23:59",
    reason: "Downstream service outage",
    replayed: "28,410",
    status: "completed",
  },
  {
    id: "RPL-002",
    topic: "subscription.lifecycle",
    from: "2024-01-17 14:00",
    to: "2024-01-17 16:00",
    reason: "Consumer bug fix",
    replayed: "1,204",
    status: "completed",
  },
  {
    id: "RPL-003",
    topic: "fraud.signals",
    from: "2024-01-18 10:00",
    to: "2024-01-18 14:00",
    reason: "ML model retrain",
    replayed: "—",
    status: "pending",
  },
];

function AdminEventBusPage() {
  const [isReplaying, setIsReplaying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleReplayEvents = async () => {
    setIsReplaying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Replay wizard opened");
    } catch (error) {
      toast.error("Failed to open replay wizard");
    } finally {
      setIsReplaying(false);
    }
  };

  const handleNewTopic = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Topic created successfully");
    } catch (error) {
      toast.error("Failed to create topic");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Bus / Stream</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReplayEvents} disabled={isReplaying}>
            {isReplaying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isReplaying ? "Opening..." : "Replay Events"}
          </Button>
          <Button onClick={handleNewTopic} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "New Topic"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Events / sec"
          value="8,420"
          icon={Radio}
          change="+12% vs avg"
          changeType="positive"
        />
        <StatCard
          title="Active Topics"
          value="18"
          icon={Inbox}
          change="2 brokers"
          changeType="neutral"
        />
        <StatCard
          title="Dead Letter"
          value="142"
          icon={AlertTriangle}
          change="Needs processing"
          changeType="negative"
        />
        <StatCard
          title="Consumers"
          value="24"
          icon={Users}
          change="All connected"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Topics & Queues"
        columns={[
          {
            header: "Topic",
            accessorKey: "name",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.name}</code>
            ),
          },
          { header: "Broker", accessorKey: "broker" },
          { header: "Partitions", accessorKey: "partitions" },
          { header: "Messages", accessorKey: "messages" },
          {
            header: "Lag",
            accessorKey: "lag",
            cell: ({ row }) => {
              const lag = parseInt(row.original.lag);
              const color = lag > 0 ? "text-destructive font-bold" : "text-success";
              return <span className={`font-mono ${color}`}>{row.original.lag}</span>;
            },
          },
          { header: "Consumers", accessorKey: "consumers" },
          { header: "Retention", accessorKey: "retention" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={topics}
      />

      <DataTable
        title="Event Replay Jobs"
        columns={[
          {
            header: "Topic",
            accessorKey: "topic",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.topic}</code>
            ),
          },
          { header: "From", accessorKey: "from" },
          { header: "To", accessorKey: "to" },
          { header: "Reason", accessorKey: "reason" },
          { header: "Replayed", accessorKey: "replayed" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={replayJobs}
      />

      <Card>
        <CardHeader>
          <CardTitle>Durability Guarantees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "At-Least-Once Delivery",
                desc: "Messages are re-delivered on consumer failure. Consumers must implement idempotency.",
              },
              {
                title: "Message Ordering",
                desc: "Per-partition ordering guaranteed for Kafka. Single queue FIFO for RabbitMQ topics.",
              },
              {
                title: "Durable Storage",
                desc: "Messages persisted to disk with configurable retention (3–90 days per topic).",
              },
              {
                title: "Dead Letter Queue",
                desc: "Failed messages routed to DLQ after 3 retries. Alert fires when DLQ depth > 100.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border p-4 space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminEventBusPage;
