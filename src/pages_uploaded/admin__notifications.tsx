
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Webhook, MessageSquare, Check, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminNotifications });

const notifications = [
  {
    id: 1,
    title: "New merchant signup: DataFlow",
    type: "merchant",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment dispute opened by Bob Wilson",
    type: "payment",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    title: "Subscription canceled: Charlie Davis",
    type: "subscription",
    time: "1 day ago",
    read: true,
  },
  {
    id: 4,
    title: "Webhook delivery failed: endpoint_xyz",
    type: "webhook",
    time: "1 day ago",
    read: true,
  },
  { id: 5, title: "Monthly report available", type: "report", time: "2 days ago", read: true },
  {
    id: 6,
    title: "New customer signup spike detected",
    type: "alert",
    time: "3 days ago",
    read: true,
  },
];

function AdminNotifications() {
  const [markingReadId, setMarkingReadId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleMarkAsRead = async (id: number) => {
    setMarkingReadId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    setDeletingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notification deleted successfully");
    } catch (error) {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Email Alerts</p>
              <p className="text-xs text-muted-foreground">Enabled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Webhook className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Webhook Alerts</p>
              <p className="text-xs text-muted-foreground">3 endpoints</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Slack Integration</p>
              <p className="text-xs text-muted-foreground">Connected</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="flex items-start gap-3 flex-1">
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!n.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(n.id)}
                      disabled={markingReadId === n.id}
                    >
                      {markingReadId === n.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(n.id)}
                    disabled={deletingId === n.id}
                  >
                    {deletingId === n.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
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

export default AdminNotifications;
