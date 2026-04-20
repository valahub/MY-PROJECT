
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

({ component: ForumsPage });

const FORUMS = [
  { name: "Item Discussion", topics: 12450, posts: 84320, last: "2h ago" },
  { name: "Authors Lounge", topics: 8420, posts: 52100, last: "15m ago" },
  { name: "Buyers Help", topics: 23110, posts: 142000, last: "5m ago" },
  { name: "WordPress", topics: 18920, posts: 98400, last: "1h ago" },
  { name: "HTML / CSS / JS", topics: 9450, posts: 41200, last: "3h ago" },
  { name: "Mobile Apps", topics: 4120, posts: 18900, last: "6h ago" },
];

function ForumsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Forums</h1>
      <div className="space-y-2">
        {FORUMS.map((f) => (
          <Card key={f.name} className="hover:border-primary cursor-pointer transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-muted-foreground">
                  {f.topics.toLocaleString()} topics · {f.posts.toLocaleString()} posts
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Last: {f.last}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
