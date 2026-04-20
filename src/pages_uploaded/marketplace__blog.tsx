
import { Card, CardContent } from "@/components/ui/card";
import { coverFor } from "@/lib/marketplace-data";

({ component: BlogPage });

const POSTS = [
  {
    id: "p1",
    title: "Top 10 WordPress themes for 2025",
    author: "Editorial",
    date: "Dec 12, 2024",
    category: "WordPress",
    excerpt: "A curated roundup of the highest-rated WordPress themes this year.",
  },
  {
    id: "p2",
    title: "How to launch your first SaaS in 30 days",
    author: "Editorial",
    date: "Dec 08, 2024",
    category: "Business",
    excerpt: "From idea to first paying customer — practical playbook.",
  },
  {
    id: "p3",
    title: "Author spotlight: ThemeNest",
    author: "Editorial",
    date: "Dec 02, 2024",
    category: "Authors",
    excerpt: "Inside the workshop of one of our top-earning authors.",
  },
  {
    id: "p4",
    title: "React vs Vue: which template should I buy?",
    author: "Editorial",
    date: "Nov 28, 2024",
    category: "Tech",
    excerpt: "Comparing the two front-end giants for buyers in 2024.",
  },
];

function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Marketplace Blog</h1>
      <p className="text-sm text-muted-foreground mb-6">
        News, tutorials, and stories from the ERP Vala community.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {POSTS.map((p) => (
          <Card
            key={p.id}
            className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="h-40" style={{ background: coverFor(p.id) }} />
            <CardContent className="p-5">
              <div className="text-xs text-info font-medium uppercase">{p.category}</div>
              <h3 className="font-semibold text-lg mt-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{p.excerpt}</p>
              <div className="text-xs text-muted-foreground mt-3">
                {p.author} · {p.date}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default BlogPage;
