
import { DashboardLayout } from "@/components/DashboardLayout";
import { enforceAuth } from "@/lib/security";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Key,
  Wallet,
  User,
  Download,
  Shield,
  Lock,
  ShoppingBag,
} from "lucide-react";

({
  beforeLoad: enforceAuth({ roles: ["customer", "admin", "support"] }),
  component: CustomerLayout,
});

const navItems = [
  { title: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { title: "Account", href: "/customer/account", icon: User },
  { title: "Subscriptions", href: "/customer/subscriptions", icon: CreditCard },
  { title: "Invoices", href: "/customer/invoices", icon: Receipt },
  { title: "Licenses", href: "/customer/licenses", icon: Key },
  { title: "Downloads", href: "/customer/downloads", icon: Download },
  { title: "Marketplace Purchases", href: "/customer/marketplace-downloads", icon: ShoppingBag },
  { title: "Payment Methods", href: "/customer/payment-methods", icon: Wallet },
  { title: "Security", href: "/customer/security", icon: Shield },
  { title: "Privacy & Data", href: "/customer/privacy", icon: Lock },
];

function CustomerLayout() {
  return (
    <DashboardLayout navItems={navItems} panelName="Customer Portal" userEmail="john@example.com" />
  );
}

export default CustomerLayout;
