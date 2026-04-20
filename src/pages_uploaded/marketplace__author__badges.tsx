
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Star, ShoppingBag, Calendar, Users, TrendingUp, Lock } from "lucide-react";

({ component: Badges });

const LEVELS = [
  { level: 1, label: "Author L1", min: 0, color: "bg-muted" },
  { level: 2, label: "Author L2", min: 1000, color: "bg-info/30" },
  { level: 3, label: "Author L3", min: 5000, color: "bg-info/60" },
  { level: 4, label: "Author L4", min: 10000, color: "bg-accent/60" },
  { level: 5, label: "Author L5", min: 25000, color: "bg-accent" },
  { level: 6, label: "Elite Author", min: 50000, color: "bg-primary" },
  {
    level: 7,
    label: "Power Elite",
    min: 250000,
    color: "bg-gradient-to-r from-primary to-accent text-white",
  },
];

const BADGES = [
  { icon: ShoppingBag, name: "Best Seller", desc: "Sold 10,000+ items", earned: true },
  { icon: Star, name: "Top Rated", desc: "Maintain 4.8+ avg rating", earned: true },
  { icon: Calendar, name: "Veteran", desc: "Active for 5+ years", earned: true },
  { icon: TrendingUp, name: "Trending Author", desc: "Featured in trending 3 times", earned: true },
  { icon: Users, name: "Community Builder", desc: "1,000+ followers", earned: true },
  { icon: Award, name: "Quality Hero", desc: "Zero soft-rejects in 12 months", earned: false },
];

function Badges() {
  const earnings = 184500;
  const currentLevel = [...LEVELS].reverse().find((l) => earnings >= l.min)!;
  const next = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = next
    ? ((earnings - currentLevel.min) / (next.min - currentLevel.min)) * 100
    : 100;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Author Levels & Badges</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center font-bold ${currentLevel.color} ${currentLevel.color.includes("text-white") ? "" : "text-foreground"}`}
            >
              L{currentLevel.level}
            </div>
            <div>
              <div className="text-lg font-bold">{currentLevel.label}</div>
              <div className="text-xs text-muted-foreground">
                Lifetime earnings: ${earnings.toLocaleString()}
              </div>
            </div>
          </div>
          {next && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Progress to {next.label}</span>
                <span>
                  ${earnings.toLocaleString()} / ${next.min.toLocaleString()}
                </span>
              </div>
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground mt-1">
                ${(next.min - earnings).toLocaleString()} earnings to next level
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LEVELS.map((l) => (
              <div
                key={l.level}
                className={`flex items-center gap-3 p-2 rounded ${earnings >= l.min ? "bg-success/5" : ""}`}
              >
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${l.color} ${l.color.includes("text-white") ? "" : "text-foreground"}`}
                >
                  L{l.level}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{l.label}</div>
                  <div className="text-xs text-muted-foreground">
                    ${l.min.toLocaleString()}+ lifetime earnings
                  </div>
                </div>
                {earnings >= l.min ? (
                  <span className="text-xs text-success font-medium">Achieved</span>
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievement Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((b) => (
              <div
                key={b.name}
                className={`p-3 rounded border flex items-center gap-3 ${b.earned ? "" : "opacity-50"}`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${b.earned ? "bg-primary text-white" : "bg-muted"}`}
                >
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.desc}</div>
                </div>
                {b.earned && <span className="text-xs text-success">✓</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LEVELS;