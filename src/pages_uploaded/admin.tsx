
import { DashboardLayout } from "@/components/DashboardLayout";
import { authService, enforceAuth } from "@/lib/security";
import {
  Activity,
  BarChart2,
  Brain,
  Copy,
  Cpu,
  LayoutDashboard,
  Link2,
  MemoryStick,
  Network,
  Users,
  Package,
  CreditCard,
  Receipt,
  Settings,
  Shield,
  Bell,
  Globe,
  AlertTriangle,
  Webhook,
  Code,
  FileText,
  Database,
  DollarSign,
  Key,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Gauge,
  Download,
  UserCog,
  Store,
  ClipboardCheck,
  FolderTree,
  RotateCcw,
  Scale,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Star,
  TrendingUp,
  Wallet,
  Flag,
  HeartPulse,
  ShieldOff,
  ScrollText,
  GitCompareArrows,
  Building2,
  Search,
  Radio,
  GitBranch,
  Clock,
  Eye,
  Plug,
  GitMerge,
  TrendingDown,
} from "lucide-react";

// Route guard placeholder (TanStack-style; not used by react-router-dom).
void enforceAuth;
void authService;

const navItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Merchants", href: "/admin/merchants", icon: Users },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { title: "Licenses", href: "/admin/licenses", icon: Key },
  { title: "Transactions", href: "/admin/transactions", icon: Receipt },
  { title: "Billing", href: "/admin/billing", icon: DollarSign },
  { title: "Dunning", href: "/admin/dunning", icon: RefreshCw },
  { title: "Proration", href: "/admin/proration", icon: ArrowUpDown },
  { title: "Entitlements", href: "/admin/entitlements", icon: Layers },
  { title: "Multi-Currency", href: "/admin/currency", icon: Globe },
  { title: "Customers", href: "/admin/customers", icon: Users },
  {
    title: "Marketplace",
    href: "/admin/marketplace",
    icon: Store,
    children: [
      { title: "Overview", href: "/admin/marketplace" },
      { title: "Review Queue", href: "/admin/marketplace/queue" },
      { title: "Items", href: "/admin/marketplace/items" },
      { title: "Authors", href: "/admin/marketplace/authors" },
      { title: "Author Levels", href: "/admin/marketplace/levels" },
      { title: "Categories", href: "/admin/marketplace/categories" },
      { title: "Collections", href: "/admin/marketplace/collections" },
      { title: "Featured", href: "/admin/marketplace/featured" },
      { title: "Payouts", href: "/admin/marketplace/payouts" },
      { title: "Refunds", href: "/admin/marketplace/refunds" },
      { title: "DMCA & Takedowns", href: "/admin/marketplace/takedowns" },
      { title: "Reports", href: "/admin/marketplace/reports" },
      { title: "Sales Reports", href: "/admin/marketplace/sales-reports" },
      { title: "Reports & Flags", href: "/admin/marketplace/flags" },
      { title: "Tax & Commission", href: "/admin/marketplace/tax-rules" },
      { title: "Settings", href: "/admin/marketplace/settings" },
    ],
  },
  { title: "Tax & Compliance", href: "/admin/tax", icon: Globe },
  { title: "Compliance / GDPR", href: "/admin/compliance", icon: Download },
  { title: "Fraud & Risk", href: "/admin/fraud", icon: AlertTriangle },
  { title: "Fraud ML Scoring", href: "/admin/fraud-ml", icon: Brain },
  { title: "SLA Monitoring", href: "/admin/sla", icon: Activity },
  { title: "BI Sync", href: "/admin/bi-sync", icon: BarChart2 },
  { title: "Payment Gateways", href: "/admin/gateways", icon: Network },
  { title: "Payments God Mode", href: "/admin/payments-god-mode", icon: Wallet },
  { title: "Rate Limits", href: "/admin/rate-limits", icon: Gauge },
  { title: "Roles", href: "/admin/roles", icon: UserCog },
  { title: "Webhooks", href: "/admin/webhooks", icon: Webhook },
  { title: "API Logs", href: "/admin/api-logs", icon: Code },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { title: "Security", href: "/admin/security", icon: Shield },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Backup", href: "/admin/backup", icon: Database },
  { title: "System Health", href: "/admin/system-health", icon: HeartPulse },
  { title: "Circuit Breakers", href: "/admin/circuit-breakers", icon: ShieldOff },
  { title: "Recovery Log", href: "/admin/recovery-log", icon: ScrollText },
  { title: "Data Consistency", href: "/admin/consistency", icon: GitCompareArrows },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  {
    title: "Autonomous Ops",
    href: "/admin/digital-twin",
    icon: Cpu,
    children: [
      { title: "Digital Twin", href: "/admin/digital-twin" },
      { title: "Auto Rollback", href: "/admin/auto-rollback" },
      { title: "Data Guardian", href: "/admin/data-guardian" },
      { title: "Load Prediction", href: "/admin/load-prediction" },
      { title: "Region Sync", href: "/admin/region-sync" },
      { title: "Policy Engine", href: "/admin/policy-engine" },
      { title: "Trust Scores", href: "/admin/trust-scores" },
      { title: "Cost Governor", href: "/admin/cost-governor" },
      { title: "Memory Recovery", href: "/admin/memory-recovery" },
      { title: "Config Sync", href: "/admin/config-sync" },
      { title: "API Self-Test", href: "/admin/api-self-test" },
      { title: "Dependency Watcher", href: "/admin/dependency-watcher" },
      { title: "Business Logic God Mode", href: "/admin/business-logic" },
    ],
  },
  // ── Enterprise Add-Ons ────────────────────────────────────────────────
  { title: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
  { title: "Tenants", href: "/admin/tenants", icon: Building2 },
  { title: "Search Engine", href: "/admin/search-engine", icon: Search },
  { title: "CDN & Edge", href: "/admin/cdn-edge", icon: Globe },
  { title: "Event Bus", href: "/admin/event-bus", icon: Radio },
  { title: "Versioning", href: "/admin/versioning", icon: GitBranch },
  { title: "Scheduler", href: "/admin/scheduler", icon: Clock },
  { title: "Admin Tools", href: "/admin/impersonation", icon: Eye },
  { title: "Documents", href: "/admin/documents", icon: FileText },
  { title: "Integrations", href: "/admin/integrations", icon: Plug },
  { title: "Secrets", href: "/admin/secrets", icon: Key },
  { title: "Deployments", href: "/admin/deployments", icon: GitMerge },
  { title: "Observability", href: "/admin/observability", icon: Activity },
  { title: "Cost Optimization", href: "/admin/cost-optimization", icon: TrendingDown },
  { title: "AI Assist", href: "/admin/ai-assist", icon: Brain },
  { title: "Server Panel", href: "/admin/server", icon: Cpu },
  { title: "Development", href: "/admin/development", icon: GitBranch },
];

// silence unused warnings for icons declared for documentation
void ClipboardCheck;
void FolderTree;
void Star;
void Flag;
void Copy;
void RotateCcw;
void ShieldCheck;
void TrendingUp;
void Link2;
void Scale;
void ShieldAlert;
void MemoryStick;
void Settings2;
void Shuffle;
void Wallet;

function AdminLayout() {
  return (
    <DashboardLayout navItems={navItems} panelName="Admin Panel" userEmail="admin@erpvala.com" />
  );
}

export default AdminLayout;
