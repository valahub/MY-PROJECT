
import { DashboardLayout } from "@/components/DashboardLayout";
import { enforceAuth } from "@/lib/security";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  CreditCard,
  Receipt,
  Users,
  Key,
  BarChart3,
  Webhook,
  Code,
  Settings,
  ShoppingCart,
  Percent,
  Download,
  RefreshCw,
  Layers,
} from "lucide-react";

({
  beforeLoad: enforceAuth({ roles: ["merchant", "admin", "support"] }),
  component: MerchantLayout,
});

const navItems = [
  { title: "Dashboard", href: "/merchant/dashboard", icon: LayoutDashboard },
  { title: "Products", href: "/merchant/products", icon: Package },
  { title: "Pricing", href: "/merchant/pricing", icon: DollarSign },
  { title: "Entitlements", href: "/merchant/entitlements", icon: Layers },
  { title: "Checkout Links", href: "/merchant/checkout-links", icon: ShoppingCart },
  { title: "Transactions", href: "/merchant/transactions", icon: Receipt },
  { title: "Subscriptions", href: "/merchant/subscriptions", icon: CreditCard },
  { title: "Licenses", href: "/merchant/licenses", icon: Key },
  { title: "Customers", href: "/merchant/customers", icon: Users },
  { title: "Invoices", href: "/merchant/invoices", icon: Receipt },
  { title: "Dunning", href: "/merchant/dunning", icon: RefreshCw },
  { title: "Discounts", href: "/merchant/discounts", icon: Percent },
  { title: "Analytics", href: "/merchant/analytics", icon: BarChart3 },
  { title: "File Delivery", href: "/merchant/files", icon: Download },
  { title: "Webhooks", href: "/merchant/webhooks", icon: Webhook },
  { title: "API", href: "/merchant/api", icon: Code },
  { title: "Settings", href: "/merchant/settings", icon: Settings },
];

function MerchantLayout() {
  return (
    <DashboardLayout
      navItems={navItems}
      panelName="Merchant Dashboard"
      userEmail="merchant@acme.com"
    />
  );
}

export default MerchantLayout;
