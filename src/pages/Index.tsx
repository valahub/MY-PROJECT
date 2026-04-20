import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth, ROLE_HOME } from "@/contexts/AuthContext";

const Index = () => {
  const { user, primaryRole } = useAuth();
  const home = primaryRole ? ROLE_HOME[primaryRole] : "/customer";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Logo size={32} />
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link to={home}>Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/auth/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container py-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6 max-w-xl">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              Phase 1 · Auth & roles online
            </span>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              SaaS billing meets a code marketplace.
            </h1>
            <p className="text-lg text-muted-foreground">
              ERP Vala bundles subscriptions, licenses, author payouts, and admin
              controls — built on Lovable Cloud.
            </p>
            <div className="flex gap-3">
              {user ? (
                <Button asChild size="lg">
                  <Link to={home}>Go to dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to="/auth/register">Create account</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/auth/login">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Roadmap
            </h3>
            <ol className="space-y-3 text-sm">
              {[
                ["Phase 1", "Auth & roles", true],
                ["Phase 2", "Marketplace browse + item pages", false],
                ["Phase 3", "Author uploads + admin approval", false],
                ["Phase 4", "Checkout + license keys (Stripe)", false],
              ].map(([phase, label, done]) => (
                <li key={phase as string} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center text-[10px] ${
                      done
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {phase as string}
                    </div>
                    <div className="text-foreground">{label as string}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="container py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ERP Vala
        </div>
      </footer>
    </div>
  );
};

export default Index;
