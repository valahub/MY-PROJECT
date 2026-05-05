// Author Reviews Page — UI-only list of reviews across items with reply
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";
import type { ItemEntity, UserReviewEntity } from "@/lib/marketplace/author-items-schema";

type ReviewWithItem = UserReviewEntity & { itemTitle: string };

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex" aria-label={`${rating} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export default function AuthorReviews() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemEntity[]>([]);
  const [reviews, setReviews] = useState<ReviewWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await authorItemsApiService.getMyItems(user.id);
      const list = r.success && r.data ? r.data : [];
      setItems(list);
      const all: ReviewWithItem[] = [];
      for (const it of list) {
        const rr = await authorItemsApiService.getItemUserReviews(it.id);
        if (rr.success && rr.data) {
          rr.data.forEach((rev) => all.push({ ...rev, itemTitle: it.title }));
        }
      }
      all.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      setReviews(all);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (review: ReviewWithItem) => {
    const text = (replyDraft[review.id] || "").trim();
    if (!text) {
      toast.error("Enter a reply");
      return;
    }
    setSubmitting(review.id);
    try {
      const r = await authorItemsApiService.replyToReview(review.id, user?.id || "", text);
      if (r.success) {
        toast.success("Reply posted");
        setReplyDraft((d) => ({ ...d, [review.id]: "" }));
        await load();
      } else {
        toast.error(r.error || "Failed to reply");
      }
    } finally {
      setSubmitting(null);
    }
  };

  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/author">Author</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Reviews</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground">Customer feedback on your items</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{avg.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">{reviews.length} review{reviews.length === 1 ? "" : "s"}</div>
          </div>
          <StarRow rating={Math.round(avg)} />
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">
              Reviews from customers who purchased {items.length === 0 ? "your items" : "any of your items"} will show here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate" title={r.itemTitle}>{r.itemTitle}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRow rating={r.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">{r.rating}/5</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{r.comment}</p>
                {r.authorReply ? (
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Your reply</div>
                    <p className="text-sm">{r.authorReply}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write a reply…"
                      value={replyDraft[r.id] || ""}
                      onChange={(e) => setReplyDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleReply(r)}
                        disabled={submitting === r.id}
                      >
                        {submitting === r.id ? "Posting…" : "Reply"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
