
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { toast } from "sonner";

({ component: Followers });

const FOLLOWERS = Array.from({ length: 12 }, (_, i) => ({
  id: `u${i}`,
  name: `Buyer${1100 + i}`,
  since: `2024-${String((i % 12) + 1).padStart(2, "0")}-15`,
  purchases: Math.floor(Math.random() * 8) + 1,
  country: ["US", "UK", "DE", "IN", "BR", "CA"][i % 6],
}));

function Followers() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Followers & Audience</h1>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> 1,284 followers
        </div>
      </div>

      <Tabs defaultValue="followers">
        <TabsList>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="followers" className="mt-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FOLLOWERS.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-info to-accent text-white flex items-center justify-center font-bold text-sm">
                    {u.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.country} · {u.purchases} purchases · since {u.since.slice(0, 7)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.success(`Messaged ${u.name}`)}
                  >
                    Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="following" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              You aren't following any other authors yet.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No new messages.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
