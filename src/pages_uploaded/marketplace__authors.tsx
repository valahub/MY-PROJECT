import { Link } from "react-router-dom";
import { AUTHORS } from "@/lib/marketplace-data";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

({ component: AuthorsPage });

function AuthorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Top Authors</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Discover the world's leading digital creators.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AUTHORS.map((a) => (
          <Link key={a.id} to="/marketplace/author/$username"}>
            <Card className="hover:shadow-lg hover:border-primary transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-lg">
                    {a.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      {a.username}
                      {a.featured && (
                        <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded">
                          FEATURED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.country} · Joined {a.joined.slice(0, 7)}
                    </div>
                    <div className="text-xs text-info mt-0.5">{a.level}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-bold text-base">{a.items}</div>
                    <div className="text-muted-foreground">Items</div>
                  </div>
                  <div>
                    <div className="font-bold text-base">{(a.sales / 1000).toFixed(1)}k</div>
                    <div className="text-muted-foreground">Sales</div>
                  </div>
                  <div>
                    <div className="font-bold text-base flex items-center justify-center gap-0.5">
                      {a.rating}
                      <Star className="h-3 w-3 fill-accent text-accent" />
                    </div>
                    <div className="text-muted-foreground">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
