import { Link } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Headphones,
  Store,
  LogIn,
  UserPlus,
} from "lucide-react";

({
  component: Index,
  head: () => ({
    meta: [
      { title: "ERP Vala — Complete Business Platform" },
      {
        name: "description",
        content: "ERP Vala billing, subscriptions, and license management platform.",
      },
    ],
  }),
});

const panels = [
  {
    title: "Admin Panel",
    desc: "Manage merchants, settings & platform",
    href: "/admin/dashboard",
    icon: Shield,
    color: "bg-secondary/10 text-secondary",
  },
  {
    title: "Merchant Dashboard",
    desc: "Products, pricing, subscriptions & analytics",
    href: "/merchant/dashboard",
    icon: LayoutDashboard,
    color: "bg-info/10 text-info",
  },
  {
    title: "Customer Portal",
    desc: "Subscriptions, invoices & licenses",
    href: "/customer/dashboard",
    icon: Users,
    color: "bg-success/10 text-success",
  },
  {
    title: "Checkout",
    desc: "Complete purchase flow",
    href: "/checkout",
    icon: ShoppingCart,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Login",
    desc: "Secure login with JWT + refresh + 2FA",
    href: "/auth/login",
    icon: LogIn,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Register",
    desc: "Create account and verify email",
    href: "/auth/register",
    icon: UserPlus,
    color: "bg-success/10 text-success",
  },
  {
    title: "Support Panel",
    desc: "Tickets, escalations & customer support",
    href: "/support/dashboard",
    icon: Headphones,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Marketplace",
    desc: "Browse code, themes, plugins & apps (CodeCanyon-style)",
    href: "/marketplace",
    icon: Store,
    color: "bg-primary/10 text-primary",
  },
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <h1 className="text-3xl font-bold text-foreground">ERP Vala</h1>
      <p className="mt-2 text-sm text-muted-foreground">Select a panel to get started</p>
      <div className="mt-8 grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {panels.map((p) => (
          <Link
            key={p.href}
            to={p.href}
            className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className={`inline-flex rounded-lg p-2 ${p.color}`}>
              <p.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-semibold text-foreground">{p.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
