
import { AUTHORS, ITEMS } from "@/lib/marketplace-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Calendar, Trophy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AuthorProfile });

function AuthorProfile() {
  const { username } = Route.useParams();
  const author = AUTHORS.find((a) => a.username === username) || AUTHORS[0];
  const items = ITEMS.filter((i) => i.author === author.username);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isContacting, setIsContacting] = useState(false);

  const handleFollow = async () => {
    setIsFollowingLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? "Unfollowed author" : "Following author");
    } catch (error) {
      toast.error("Failed to update follow status");
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleContact = async () => {
    setIsContacting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("Message sent to author");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <div>
      {/* Cover */}
      <div className="bg-gradient-to-r from-secondary to-accent text-white">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-3xl border-4 border-white/30">
            {author.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold">{author.username}</h1>
              {author.featured && (
                <span className="text-xs bg-primary px-2 py-0.5 rounded">FEATURED</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" /> {author.level}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {author.country}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined {author.joined.slice(0, 7)}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-white" /> {author.rating}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={isFollowingLoading}
              onClick={handleFollow}
            >
              {isFollowingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isFollowing ? "Unfollowing..." : "Following..."}
                </>
              ) : (
                isFollowing ? "Unfollow" : "Follow"
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
              disabled={isContacting}
              onClick={handleContact}
            >
              {isContacting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Contact"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-muted-foreground">Total Items</div>
              <div className="text-2xl font-bold mt-1">{author.items}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-muted-foreground">Total Sales</div>
              <div className="text-2xl font-bold mt-1">{author.sales.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-muted-foreground">Followers</div>
              <div className="text-2xl font-bold mt-1">{(author.sales / 8).toFixed(0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-muted-foreground">Avg Rating</div>
              <div className="text-2xl font-bold mt-1 flex items-center justify-center gap-1">
                {author.rating}
                <Star className="h-4 w-4 fill-accent text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="portfolio">
          <TabsList>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="portfolio" className="mt-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((i) => (
                  <ItemCard key={i.id} item={i} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="about" className="mt-4">
            <Card>
              <CardContent className="p-5 text-sm space-y-2">
                <p>
                  Hi, I'm {author.username} — a digital creator from {author.country}, building
                  premium themes, plugins, and templates since {author.joined.slice(0, 4)}.
                </p>
                <p>
                  My work is focused on clean code, modern design, and outstanding customer support.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Aggregate reviews across all items: {author.rating} ★ from{" "}
                {(author.sales / 4).toFixed(0)} ratings.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
