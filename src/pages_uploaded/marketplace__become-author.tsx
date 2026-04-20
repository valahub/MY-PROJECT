import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, DollarSign, Globe, Award } from "lucide-react";

({ component: BecomeAuthor });

function BecomeAuthor() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Become an ERP Vala Author</h1>
        <p className="text-lg text-muted-foreground">
          Sell your digital work to a global audience of millions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        {[
          {
            icon: DollarSign,
            title: "Earn passive income",
            desc: "Up to 70% commission on every sale, paid monthly.",
          },
          {
            icon: Globe,
            title: "Global reach",
            desc: "Reach customers in 190+ countries from day one.",
          },
          {
            icon: Award,
            title: "Author levels & rewards",
            desc: "Climb levels and unlock higher commission rates.",
          },
          {
            icon: CheckCircle2,
            title: "Quality guaranteed",
            desc: "Our review team helps you ship better products.",
          },
        ].map((b) => (
          <Card key={b.title}>
            <CardContent className="p-5 flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <b.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{b.title}</div>
                <div className="text-sm text-muted-foreground">{b.desc}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-sidebar text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to start selling?</h2>
          <p className="text-white/70 mb-6">
            Sign up takes less than 2 minutes. Submit your first item the same day.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/marketplace/author/upload">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Upload your first item
              </Button>
            </Link>
            <Link to="/marketplace/author/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
