
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Flag } from "lucide-react";
import { toast } from "sonner";

({ component: AuthorReviews });

const REVIEWS = [
  {
    id: "r1",
    item: "NovaPress SaaS Theme",
    buyer: "Buyer4912",
    rating: 5,
    text: "Top quality theme. Excellent support and well-documented code.",
    date: "2024-12-14",
  },
  {
    id: "r2",
    item: "WP Booking Engine",
    buyer: "Buyer8821",
    rating: 4,
    text: "Works great, would love more payment integrations.",
    date: "2024-12-12",
  },
  {
    id: "r3",
    item: "WC Multi-Vendor",
    buyer: "Buyer1102",
    rating: 2,
    text: "Checkout is buggy, needs urgent fix.",
    date: "2024-12-10",
  },
  {
    id: "r4",
    item: "NovaPress SaaS Theme",
    buyer: "Buyer7723",
    rating: 5,
    text: "Beautiful design, easy to customize.",
    date: "2024-12-08",
  },
];

function AuthorReviews() {
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-accent text-accent" />
          <span className="text-xl font-bold">{avg}</span>
          <span className="text-sm text-muted-foreground">avg ({REVIEWS.length} reviews)</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rating distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = REVIEWS.filter((r) => r.rating === star).length;
              const pct = (count / REVIEWS.length) * 100;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-4">{star}★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {REVIEWS.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {r.buyer.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{r.buyer}</span>
                    <span className="text-xs text-muted-foreground">on</span>
                    <span className="text-xs text-info font-medium">{r.item}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <div className="flex mt-1">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                        />
                      ))}
                  </div>
                  <p className="text-sm mt-2">{r.text}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => toast.success("Reply posted")}
                    >
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive"
                      onClick={() => toast.info("Reported to moderation")}
                    >
                      <Flag className="h-3 w-3 mr-1" /> Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default REVIEWS;