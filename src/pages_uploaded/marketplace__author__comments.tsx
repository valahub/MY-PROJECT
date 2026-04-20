
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

({ component: CommentsPage });

const COMMENTS = [
  {
    id: "c1",
    item: "NovaPress Theme",
    user: "buyer123",
    message: "How do I install this on a multisite WordPress?",
    time: "2h ago",
    unanswered: true,
  },
  {
    id: "c2",
    item: "Mega Addons",
    user: "designer_x",
    message: "Will this conflict with Elementor Pro?",
    time: "5h ago",
    unanswered: true,
  },
  {
    id: "c3",
    item: "WP Booking Engine",
    user: "spaowner",
    message: "Can I sync with Google Calendar?",
    time: "1d ago",
    unanswered: false,
  },
  {
    id: "c4",
    item: "WC Multi-Vendor",
    user: "shopadmin",
    message: "Excellent plugin! 5 stars.",
    time: "3d ago",
    unanswered: false,
  },
];

function CommentsPage() {
  const [reply, setReply] = useState<Record<string, string>>({});
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comments & Questions</h1>
      <div className="space-y-3">
        {COMMENTS.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-info text-white flex items-center justify-center text-xs font-bold">
                  {c.user.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground">{c.user}</span>
                    <span className="text-muted-foreground">on</span>
                    <span className="text-info">{c.item}</span>
                    <span className="text-muted-foreground">· {c.time}</span>
                    {c.unanswered && (
                      <span className="ml-auto text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
                        UNANSWERED
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{c.message}</p>
                  {c.unanswered && (
                    <div className="mt-2 flex gap-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={reply[c.id] || ""}
                        onChange={(e) => setReply({ ...reply, [c.id]: e.target.value })}
                        rows={2}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success("Reply posted");
                          setReply({ ...reply, [c.id]: "" });
                        }}
                      >
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default CommentsPage;
