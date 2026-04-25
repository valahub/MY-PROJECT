import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Globe,
  FolderTree,
  Database,
  Mail,
  AppWindow,
  Shield,
  Wrench,
  Puzzle,
  Users,
  Bell,
  Search,
  UserCircle2,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Plus,
  Folder,
  FileText,
  ChevronRight,
  Server,
  Lock,
  ArrowDownToLine,
  ArrowUpToLine,
  RefreshCw,
  Play,
  Square,
  X,
  Menu,
  ChevronLeft,
  AlertTriangle,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { serverApiService } from "@/lib/server/server-api";
import type { ServiceEntity } from "@/lib/server/server-schema";
import { useAuth } from "@/contexts/AuthContext";

type SectionKey =
  | "dashboard"
  | "domains"
  | "files"
  | "databases"
  | "mail"
  | "applications"
  | "security"
  | "tools"
  | "extensions"
  | "users"
  | "logs";

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "domains", label: "Domains", icon: Globe },
  { key: "files", label: "Files", icon: FolderTree },
  { key: "databases", label: "Databases", icon: Database },
  { key: "mail", label: "Mail", icon: Mail },
  { key: "applications", label: "Applications", icon: AppWindow },
  { key: "security", label: "Security", icon: Shield },
  { key: "tools", label: "Tools & Settings", icon: Wrench },
  { key: "extensions", label: "Extensions", icon: Puzzle },
  { key: "users", label: "Users", icon: Users },
  { key: "logs", label: "Logs", icon: Activity },
];

const VALID_KEYS: SectionKey[] = SECTIONS.map((s) => s.key);

export default function AdminServerPage({ initialSection = "dashboard" }: { initialSection?: SectionKey } = {}) {
  const [section, setSection] = useState<SectionKey>(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hash.replace("#", "") as SectionKey;
      if (h && VALID_KEYS.includes(h)) return h;
    }
    return initialSection;
  });

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("server-sidebar-collapsed") === "true";
    }
    return false;
  });

  // Server selector state
  const [selectedServer, setSelectedServer] = useState("srv-prod-01.erpvala.io");
  const [alerts, setAlerts] = useState<any[]>([]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("server-sidebar-collapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Keyboard shortcut for sidebar toggle (Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSection((prev) => {
      const h = window.location.hash.replace("#", "") as SectionKey;
      if (h && VALID_KEYS.includes(h)) return h;
      return initialSection ?? prev;
    });
  }, [initialSection]);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "") as SectionKey;
      if (h && VALID_KEYS.includes(h)) setSection(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const selectSection = (k: SectionKey) => {
    setSection(k);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `${window.location.pathname}#${k}`);
    }
  };

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Inner Sidebar */}
      <aside
        className={cn(
          "shrink-0 border-r border-border bg-card flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        <div className="h-12 flex items-center gap-2 px-4 border-b border-border">
          <Server className="h-4 w-4 text-primary flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-semibold text-sm">Hosting Panel</span>}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => selectSection(s.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
                title={sidebarCollapsed ? s.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && s.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border text-[11px] text-muted-foreground">
          {!sidebarCollapsed && "v1.0 · Demo UI"}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 border-b border-border flex items-center gap-3 px-4 bg-card">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          
          {/* Server Selector */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <Server className="h-4 w-4 text-primary" />
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="bg-transparent border-none font-medium focus:outline-none cursor-pointer"
            >
              <option value="srv-prod-01.erpvala.io">srv-prod-01.erpvala.io</option>
              <option value="srv-staging-01.erpvala.io">srv-staging-01.erpvala.io</option>
              <option value="srv-backup-01.erpvala.io">srv-backup-01.erpvala.io</option>
            </select>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search domains, files, databases…" className="h-8 pl-8 text-sm" />
            </div>
          </div>

          {/* Alerts Badge */}
          {alerts.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <UserCircle2 className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {section === "dashboard" && <DashboardSection />}
          {section === "domains" && <DomainsSection />}
          {section === "files" && <FilesSection />}
          {section === "databases" && <DatabasesSection />}
          {section === "mail" && <MailSection />}
          {section === "applications" && <ApplicationsSection />}
          {section === "security" && <SecuritySection />}
          {section === "tools" && <ToolsSection />}
          {section === "extensions" && <ExtensionsSection />}
          {section === "users" && <UsersSection />}
          {section === "logs" && <LogsSection />}
        </main>
      </div>
    </div>
  );
}

/* ───────────── Sections ───────────── */

function ResourceCard({
  title,
  value,
  pct,
  icon: Icon,
  detail,
}: {
  title: string;
  value: string;
  pct: number;
  icon: React.ComponentType<{ className?: string }>;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">{pct}%</Badge>
        </div>
        <div className="text-2xl font-bold mb-2">{value}</div>
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{detail}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSection() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({ cpu: 34, ram: 39, disk: 36, networkIn: 28, networkOut: 14 });
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const serverId = "server-demo-001";
      
      const [metricsRes, servicesRes] = await Promise.all([
        serverApiService.getServerMetrics(serverId),
        serverApiService.getServices(serverId),
      ]);

      if (metricsRes.success && metricsRes.data) {
        const newMetrics = {
          cpu: metricsRes.data.cpu,
          ram: metricsRes.data.ram,
          disk: metricsRes.data.disk,
          networkIn: metricsRes.data.networkIn,
          networkOut: metricsRes.data.networkOut,
        };
        setMetrics(newMetrics);
        setCpuHistory(prev => [...prev.slice(-19), newMetrics.cpu]);
        
        const newAlerts: any[] = [];
        if (newMetrics.cpu > 90) {
          newAlerts.push({ type: "critical", message: "CPU usage above 90%", icon: AlertTriangle });
        }
        if (newMetrics.disk > 95) {
          newAlerts.push({ type: "critical", message: "Disk nearly full", icon: AlertTriangle });
        }
        
        if (servicesRes.success && servicesRes.data) {
          const stoppedServices = servicesRes.data.filter(s => s.status === "stopped");
          stoppedServices.forEach(s => {
            newAlerts.push({ type: "warning", message: `Service ${s.name} is down`, icon: AlertTriangle });
          });
        }
        
        setAlerts(newAlerts);
        newAlerts.filter(a => a.type === "critical").forEach(alert => {
          toast.error(alert.message);
        });
      }

      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartService = async (serviceId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.restartService(serviceId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDashboardData();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to restart service");
    }
  };

  const handleStopService = async (serviceId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.stopService(serviceId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDashboardData();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to stop service");
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Real-time server metrics and service status</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {alerts.map((alert, idx) => (
            <div key={idx} className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
              alert.type === "critical" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
            )}>
              <AlertTriangle className="h-4 w-4" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard
          title="CPU"
          value={`${metrics.cpu}%`}
          pct={metrics.cpu}
          icon={Cpu}
          detail={metrics.cpu > 90 ? "High usage" : "Normal"}
        />
        <ResourceCard
          title="RAM"
          value={`${metrics.ram}%`}
          pct={metrics.ram}
          icon={MemoryStick}
          detail={`${(metrics.ram * 0.16).toFixed(1)} GB of 16 GB`}
        />
        <ResourceCard
          title="Disk"
          value={`${metrics.disk}%`}
          pct={metrics.disk}
          icon={HardDrive}
          detail={metrics.disk > 95 ? "Nearly full" : "Available"}
        />
        <ResourceCard
          title="Network"
          value={`${metrics.networkIn}↓ / ${metrics.networkOut}↑`}
          pct={(metrics.networkIn + metrics.networkOut) / 2}
          icon={Activity}
          detail="MB/s"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CPU Usage Trend (Last 100s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-end gap-1">
            {cpuHistory.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-primary/60 rounded-t transition-all"
                style={{ height: `${val}%` }}
                title={`${val}%`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Services</CardTitle>
          <CardDescription>Status of installed system services</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading services...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-mono text-xs">{service.serviceName}</TableCell>
                    <TableCell>
                      <Badge variant={service.status === "running" ? "default" : service.status === "restarting" ? "secondary" : "destructive"}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatUptime(service.uptime)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {service.status === "running" ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleRestartService(service.id)}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleStopService(service.id)}>
                            <Square className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleRestartService(service.id)}>
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "Add Domain", icon: Globe, section: "domains" },
            { label: "Create Database", icon: Database, section: "databases" },
            { label: "Issue SSL", icon: Lock, section: "security" },
            { label: "Run Backup", icon: ArrowUpToLine, section: "tools" },
            { label: "Restore Backup", icon: ArrowDownToLine, section: "tools" },
          ].map(({ label, icon: I, section }) => (
            <Button key={label} variant="outline" className="w-full justify-start" onClick={() => {
              if (typeof window !== "undefined") {
                window.location.hash = section;
              }
            }}>
              <I className="h-4 w-4 mr-2" /> {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function DomainsSection() {
  const { user } = useAuth();
  const [domains, setDomains] = useState<any[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDNSModal, setShowDNSModal] = useState(false);
  const [selectedDomainForDNS, setSelectedDomainForDNS] = useState<any>(null);
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState({ name: "", rootPath: "/var/www", ip: "203.0.113.10", enableSSL: false });
  const [newDNSRecord, setNewDNSRecord] = useState({ type: "A", name: "", value: "", ttl: 3600, priority: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sslFilter, setSslFilter] = useState("all");
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    filterDomains();
  }, [domains, searchQuery, statusFilter, sslFilter]);

  const filterDomains = () => {
    let filtered = [...domains];
    
    if (searchQuery) {
      filtered = filtered.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    if (sslFilter !== "all") {
      filtered = filtered.filter(d => d.sslStatus === sslFilter);
    }
    
    setFilteredDomains(filtered);
    
    // Check for alerts
    const newAlerts: any[] = [];
    filtered.forEach(d => {
      if (d.sslStatus === "expiring") {
        newAlerts.push({ type: "warning", message: `SSL expiring for ${d.name}`, domainId: d.id });
      }
      if (d.status === "offline" || d.status === "suspended") {
        newAlerts.push({ type: "critical", message: `Domain ${d.name} is ${d.status}`, domainId: d.id });
      }
    });
    setAlerts(newAlerts);
  };

  const loadDomains = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getDomains(serverId);
      if (res.success && res.data) {
        setDomains(res.data);
      } else {
        setDomains([
          { id: "1", name: "erpvala.com", ip: "203.0.113.10", sslStatus: "active", status: "online" },
          { id: "2", name: "shop.erpvala.com", ip: "203.0.113.10", sslStatus: "active", status: "online" },
          { id: "3", name: "api.erpvala.io", ip: "203.0.113.11", sslStatus: "active", status: "online" },
          { id: "4", name: "staging.erpvala.dev", ip: "203.0.113.12", sslStatus: "expiring", status: "online" },
          { id: "5", name: "old-portal.com", ip: "203.0.113.10", sslStatus: "none", status: "suspended" },
        ]);
      }
    } catch (error) {
      console.error("Failed to load domains");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!user || !newDomain.name) return;
    try {
      const res = await serverApiService.createDomain(
        { serverId: "server-demo-001", name: newDomain.name, rootPath: newDomain.rootPath, ip: newDomain.ip },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setShowAddModal(false);
        setNewDomain({ name: "", rootPath: "/var/www", ip: "203.0.113.10", enableSSL: false });
        loadDomains();
        
        // Auto-create A record
        if (res.data) {
          await serverApiService.addDNSRecord(
            { domainId: res.data.id, type: "A", name: "@", value: newDomain.ip, ttl: 3600 },
            user.id
          );
        }
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to add domain");
    }
  };

  const handleEnableSSL = async (domainId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.enableSSL(domainId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDomains();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to enable SSL");
    }
  };

  const handleRenewSSL = async (domainId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.renewSSL(domainId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDomains();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to renew SSL");
    }
  };

  const handleRemoveSSL = async (domainId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to remove SSL?")) return;
    try {
      const res = await serverApiService.removeSSL(domainId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDomains();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to remove SSL");
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this domain?")) return;
    try {
      const res = await serverApiService.deleteDomain(domainId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDomains();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete domain");
    }
  };

  const handleOpenDomain = (domain: any) => {
    if (domain.status !== "online") {
      toast.warning(`Domain is ${domain.status}. Cannot open.`);
      return;
    }
    window.open(`https://${domain.name}`, "_blank");
  };

  const handleOpenDNS = async (domain: any) => {
    setSelectedDomainForDNS(domain);
    setShowDNSModal(true);
    const res = await serverApiService.getDNSRecords(domain.id);
    if (res.success && res.data) {
      setDnsRecords(res.data);
    } else {
      setDnsRecords([]);
    }
  };

  const handleAddDNSRecord = async () => {
    if (!user || !selectedDomainForDNS || !newDNSRecord.name || !newDNSRecord.value) return;
    try {
      const res = await serverApiService.addDNSRecord(
        { domainId: selectedDomainForDNS.id, ...newDNSRecord },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setNewDNSRecord({ type: "A", name: "", value: "", ttl: 3600, priority: 10 });
        const dnsRes = await serverApiService.getDNSRecords(selectedDomainForDNS.id);
        if (dnsRes.success && dnsRes.data) {
          setDnsRecords(dnsRes.data);
        }
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to add DNS record");
    }
  };

  const handleDeleteDNSRecord = async (recordId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.deleteDNSRecord(recordId, user.id);
      if (res.success) {
        toast.success(res.message);
        if (selectedDomainForDNS) {
          const dnsRes = await serverApiService.getDNSRecords(selectedDomainForDNS.id);
          if (dnsRes.success && dnsRes.data) {
            setDnsRecords(dnsRes.data);
          }
        }
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete DNS record");
    }
  };

  const handleBulkEnableSSL = async () => {
    if (!user || selectedDomains.size === 0) return;
    try {
      for (const domainId of selectedDomains) {
        await serverApiService.enableSSL(domainId, user.id);
      }
      toast.success(`SSL enabled for ${selectedDomains.size} domains`);
      setSelectedDomains(new Set());
      loadDomains();
    } catch (error) {
      toast.error("Failed to enable SSL for some domains");
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedDomains.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedDomains.size} domains?`)) return;
    try {
      for (const domainId of selectedDomains) {
        await serverApiService.deleteDomain(domainId, user.id);
      }
      toast.success(`${selectedDomains.size} domains deleted`);
      setSelectedDomains(new Set());
      loadDomains();
    } catch (error) {
      toast.error("Failed to delete some domains");
    }
  };

  const handleBulkSuspend = async () => {
    if (!user || selectedDomains.size === 0) return;
    try {
      for (const domainId of selectedDomains) {
        await serverApiService.updateDomain(domainId, { status: "suspended" }, user.id);
      }
      toast.success(`${selectedDomains.size} domains suspended`);
      setSelectedDomains(new Set());
      loadDomains();
    } catch (error) {
      toast.error("Failed to suspend some domains");
    }
  };

  const toggleDomainSelection = (domainId: string) => {
    const newSelected = new Set(selectedDomains);
    if (newSelected.has(domainId)) {
      newSelected.delete(domainId);
    } else {
      newSelected.add(domainId);
    }
    setSelectedDomains(newSelected);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domains</h2>
          <p className="text-sm text-muted-foreground">Manage hosted domains and DNS</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Domain</Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {alerts.map((alert, idx) => (
            <div key={idx} className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
              alert.type === "critical" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
            )}>
              <AlertTriangle className="h-4 w-4" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search domains..." 
              className="h-8 pl-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-3 text-sm border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="suspended">Suspended</option>
          <option value="offline">Offline</option>
          <option value="expiring">Expiring</option>
        </select>
        <select
          value={sslFilter}
          onChange={(e) => setSslFilter(e.target.value)}
          className="h-8 px-3 text-sm border rounded-md bg-background"
        >
          <option value="all">All SSL</option>
          <option value="active">Active</option>
          <option value="none">None</option>
          <option value="expiring">Expiring</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedDomains.size > 0 && (
        <div className="flex gap-2 items-center p-3 bg-accent rounded-md">
          <span className="text-sm font-medium">{selectedDomains.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkEnableSSL}>Enable SSL</Button>
          <Button size="sm" variant="outline" onClick={handleBulkSuspend}>Suspend</Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedDomains(new Set())}>Clear</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading domains...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedDomains.size === filteredDomains.length && filteredDomains.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDomains(new Set(filteredDomains.map(d => d.id)));
                        } else {
                          setSelectedDomains(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomains.map((d) => (
                  <TableRow key={d.id || d.name}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedDomains.has(d.id)}
                        onChange={() => toggleDomainSelection(d.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="font-mono text-xs">{d.ip}</TableCell>
                    <TableCell>
                      <Badge variant={d.sslStatus === "active" ? "default" : d.sslStatus === "expiring" ? "secondary" : "outline"}>
                        {d.sslStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.status === "online" ? "default" : d.status === "suspended" ? "secondary" : "destructive"}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenDNS(d)}>DNS</Button>
                      {d.sslStatus === "active" ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleRenewSSL(d.id)}>Renew</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveSSL(d.id)}>Remove</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEnableSSL(d.id)}>SSL</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleOpenDomain(d)}>Open</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteDomain(d.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Domain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Domain Name</Label>
                <Input value={newDomain.name} onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })} placeholder="example.com" />
              </div>
              <div>
                <Label>Root Path</Label>
                <Input value={newDomain.rootPath} onChange={(e) => setNewDomain({ ...newDomain, rootPath: e.target.value })} placeholder="/var/www" />
              </div>
              <div>
                <Label>IP Address</Label>
                <Input value={newDomain.ip} onChange={(e) => setNewDomain({ ...newDomain, ip: e.target.value })} placeholder="203.0.113.10" />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableSSL"
                  checked={newDomain.enableSSL}
                  onChange={(e) => setNewDomain({ ...newDomain, enableSSL: e.target.checked })}
                />
                <Label htmlFor="enableSSL">Enable SSL (Let's Encrypt)</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddDomain} className="flex-1">Add Domain</Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDNSModal && selectedDomainForDNS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>DNS Records - {selectedDomainForDNS.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <Label>Type</Label>
                  <select
                    value={newDNSRecord.type}
                    onChange={(e) => setNewDNSRecord({ ...newDNSRecord, type: e.target.value as any })}
                    className="h-8 px-2 text-sm border rounded-md bg-background w-full"
                  >
                    <option value="A">A</option>
                    <option value="CNAME">CNAME</option>
                    <option value="TXT">TXT</option>
                    <option value="MX">MX</option>
                    <option value="AAAA">AAAA</option>
                    <option value="NS">NS</option>
                  </select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={newDNSRecord.name} onChange={(e) => setNewDNSRecord({ ...newDNSRecord, name: e.target.value })} placeholder="@" className="h-8" />
                </div>
                <div>
                  <Label>Value</Label>
                  <Input value={newDNSRecord.value} onChange={(e) => setNewDNSRecord({ ...newDNSRecord, value: e.target.value })} placeholder="192.0.2.1" className="h-8" />
                </div>
                <div>
                  <Label>TTL</Label>
                  <Input value={newDNSRecord.ttl} onChange={(e) => setNewDNSRecord({ ...newDNSRecord, ttl: parseInt(e.target.value) })} placeholder="3600" className="h-8" />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input value={newDNSRecord.priority} onChange={(e) => setNewDNSRecord({ ...newDNSRecord, priority: parseInt(e.target.value) })} placeholder="10" className="h-8" />
                </div>
              </div>
              <Button onClick={handleAddDNSRecord} className="w-full">Add DNS Record</Button>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Existing Records</h3>
                {dnsRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No DNS records found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>TTL</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dnsRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-xs">{record.type}</TableCell>
                          <TableCell className="font-mono text-xs">{record.name}</TableCell>
                          <TableCell className="font-mono text-xs">{record.value}</TableCell>
                          <TableCell className="text-xs">{record.ttl}</TableCell>
                          <TableCell className="text-xs">{record.priority || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteDNSRecord(record.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDNSModal(false)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function FilesSection() {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [fileContent, setFileContent] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [uploadFile, setUploadFile] = useState({ name: "", content: "" });
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [filePermissions, setFilePermissions] = useState({ read: true, write: true, execute: false });
  const [fileVersions, setFileVersions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPath, setCurrentPath] = useState("/var/www/erpvala.com/public");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: any } | null>(null);

  const tree = [
    { name: "var", children: ["www", "log", "lib"] },
    { name: "etc", children: ["nginx", "postgresql", "ssl"] },
    { name: "home", children: ["admin", "deploy"] },
    { name: "tmp", children: [] as string[] },
  ];

  const SAMPLES: Record<string, string> = {
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ERPVala</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="/app.js"></script>
  </body>
</html>`,
    js: `// app.js — entry bundle (minified in prod)
import { mount } from "./runtime";

mount("#root", {
  apiBase: "/api",
  features: { checkout: true, licenses: true },
});`,
    css: `:root {
  --brand: #EB0045;
  --ink:   #00205C;
}

body { font-family: Inter, system-ui; color: var(--ink); }
.btn-primary { background: var(--brand); color: #fff; }`,
    env: `NODE_ENV=production
APP_URL=https://erpvala.com
DATABASE_URL=postgres://prod:***@db:5432/erpvala_prod
REDIS_URL=redis://cache:6379`,
    txt: `User-agent: *
Allow: /
Sitemap: https://erpvala.com/sitemap.xml`,
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery, typeFilter]);

  const filterFiles = () => {
    let filtered = [...files];
    
    if (searchQuery) {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(f => f.lang === typeFilter);
    }
    
    setFilteredFiles(filtered);
  };

  const loadFiles = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.listFiles(serverId, currentPath);
      if (res.success && res.data) {
        setFiles(res.data);
        if (res.data.length > 0) setSelected(res.data[0]);
      } else {
        const demoFiles = [
          { name: "index.html", size: 4200, modified: "2026-04-19 14:22", lang: "html", type: "file" },
          { name: "app.js", size: 186000, modified: "2026-04-19 14:22", lang: "js", type: "file" },
          { name: "styles.css", size: 22000, modified: "2026-04-18 10:01", lang: "css", type: "file" },
          { name: ".env.production", size: 1100, modified: "2026-04-15 09:14", lang: "env", type: "file" },
          { name: "robots.txt", size: 210, modified: "2026-04-10 12:00", lang: "txt", type: "file" },
          { name: "assets", size: 0, modified: "2026-04-10 12:00", lang: "", type: "directory" },
        ];
        setFiles(demoFiles);
        setSelected(demoFiles[0]);
      }
    } catch (error) {
      console.error("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (file: any) => {
    setSelected(file);
    setMode("list");
    if (file.type === "file") {
      try {
        const res = await serverApiService.readFile("server-demo-001", `${currentPath}/${file.name}`, user?.id || "");
        if (res.success && res.data) {
          setFileContent(res.data.content);
        } else {
          setFileContent(SAMPLES[file.lang] || "");
        }
      } catch (error) {
        setFileContent(SAMPLES[file.lang] || "");
      }
    }
  };

  const handleSaveFile = async () => {
    if (!user || !selected) return;
    try {
      const res = await serverApiService.writeFile("server-demo-001", `${currentPath}/${selected.name}`, fileContent, user.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to save file");
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    try {
      const res = await serverApiService.deleteFile("server-demo-001", `${currentPath}/${file.name}`, user.id);
      if (res.success) {
        toast.success(res.message);
        loadFiles();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const handleUploadFile = async () => {
    if (!user || !uploadFile.name || !uploadFile.content) return;
    try {
      const res = await serverApiService.uploadFile("server-demo-001", currentPath, uploadFile.name, uploadFile.content, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowUploadModal(false);
        setUploadFile({ name: "", content: "" });
        loadFiles();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to upload file");
    }
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName) return;
    try {
      const res = await serverApiService.createFolder("server-demo-001", currentPath, newFolderName, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowNewFolderModal(false);
        setNewFolderName("");
        loadFiles();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleRenameFile = async () => {
    if (!user || !selected || !renameTo) return;
    try {
      const res = await serverApiService.renameFile("server-demo-001", `${currentPath}/${selected.name}`, `${currentPath}/${renameTo}`, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowRenameModal(false);
        setRenameTo("");
        loadFiles();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to rename file");
    }
  };

  const handleUpdatePermissions = async () => {
    if (!user || !selected) return;
    try {
      const res = await serverApiService.setFilePermissions("server-demo-001", `${currentPath}/${selected.name}`, filePermissions, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowPermissionsModal(false);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to update permissions");
    }
  };

  const handleLoadVersions = async () => {
    if (!selected) return;
    try {
      const res = await serverApiService.getFileVersions("server-demo-001", `${currentPath}/${selected.name}`);
      if (res.success && res.data) {
        setFileVersions(res.data);
        setShowVersionsModal(true);
      } else {
        toast.error("Failed to load versions");
      }
    } catch (error) {
      toast.error("Failed to load versions");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.restoreFileVersion("server-demo-001", versionId, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowVersionsModal(false);
        loadFiles();
        if (selected) handleFileClick(selected);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to restore version");
    }
  };

  const handlePreviewInBrowser = () => {
    if (!selected) return;
    window.open(`https://erpvala.com/${selected.name}`, "_blank");
  };

  const handleDownloadFile = () => {
    if (!selected) return;
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selected.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCompressToZip = async () => {
    if (!user || !selected) return;
    try {
      const res = await serverApiService.compressToZip("server-demo-001", `${currentPath}/${selected.name}`, `${selected.name}.zip`, user.id);
      if (res.success) {
        toast.success(res.message);
        loadFiles();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to compress to ZIP");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!user) return;
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const content = await file.text();
      const res = await serverApiService.uploadFile("server-demo-001", currentPath, file.name, content, user.id);
      if (res.success) {
        toast.success(`Uploaded ${file.name}`);
      }
    }
    loadFiles();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Manager</h2>
          <p className="text-sm text-muted-foreground">{currentPath}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}><ArrowUpToLine className="h-4 w-4 mr-1" /> Upload</Button>
          <Button variant="outline" onClick={() => setShowNewFolderModal(true)}><FolderPlus className="h-4 w-4 mr-1" /> New Folder</Button>
          <Button><Plus className="h-4 w-4 mr-1" /> New File</Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search files..." 
              className="h-8 pl-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 px-3 text-sm border rounded-md bg-background"
        >
          <option value="all">All Types</option>
          <option value="html">HTML</option>
          <option value="js">JavaScript</option>
          <option value="css">CSS</option>
          <option value="env">ENV</option>
          <option value="txt">Text</option>
        </select>
      </div>

      <Card onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 min-h-[520px]">
            {/* Tree */}
            <div className="col-span-3 border-r border-border p-3 text-sm space-y-1">
              {tree.map((dir) => (
                <div key={dir.name}>
                  <div className="flex items-center gap-1 font-medium">
                    <ChevronRight className="h-3 w-3" />
                    <Folder className="h-4 w-4 text-secondary" /> {dir.name}
                  </div>
                  <div className="ml-5 space-y-0.5 mt-0.5">
                    {dir.children.map((c) => (
                      <div key={c} className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
                        <Folder className="h-3.5 w-3.5" /> {c}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Middle: file list */}
            <div className="col-span-4 border-r border-border">
              <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground font-mono flex items-center justify-between">
                <span>{currentPath}</span>
                <span>{filteredFiles.length} items</span>
              </div>
              <div>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Loading files...</div>
                ) : (
                  filteredFiles.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => handleFileClick(f)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, file: f });
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 hover:bg-muted/50 text-sm flex items-center gap-2 border-b border-border last:border-0",
                        selected?.name === f.name && "bg-muted"
                      )}
                    >
                      {f.type === "directory" ? (
                        <Folder className="h-4 w-4 text-secondary" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            {/* Right: preview/editor */}
            <div className="col-span-5">
              {mode === "list" && selected && (
                <div className="h-full">
                  <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground">
                    {selected.name}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size</span>
                      <span>{formatSize(selected.size)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modified</span>
                      <span>{selected.modified}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span>{selected.lang || "file"}</span>
                    </div>
                    <div className="pt-4 grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setMode("edit")}>Edit</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={handlePreviewInBrowser}>Preview</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleDownloadFile}>Download</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleCompressToZip}>ZIP</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setRenameTo(selected.name); setShowRenameModal(true); }}>Rename</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setShowPermissionsModal(true); }}>Permissions</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleLoadVersions}>Versions</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteFile(selected)}>Delete</Button>
                    </div>
                  </div>
                </div>
              )}
              {mode === "edit" && selected && (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground flex items-center justify-between">
                    <span>{selected.name}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setMode("list")}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveFile}>Save</Button>
                    </div>
                  </div>
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="flex-1 p-4 text-xs font-mono bg-muted/30 resize-none focus:outline-none"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border border-border rounded-md shadow-lg py-1 z-50 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onClick={() => { setSelected(contextMenu.file); setMode("edit"); setContextMenu(null); }}>Edit</button>
          <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onClick={() => { setRenameTo(contextMenu.file.name); setShowRenameModal(true); setContextMenu(null); }}>Rename</button>
          <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onClick={() => { handleDownloadFile(); setContextMenu(null); }}>Download</button>
          <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-destructive" onClick={() => { handleDeleteFile(contextMenu.file); setContextMenu(null); }}>Delete</button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>File Name</Label>
                <Input value={uploadFile.name} onChange={(e) => setUploadFile({ ...uploadFile, name: e.target.value })} placeholder="filename.html" />
              </div>
              <div>
                <Label>Content</Label>
                <textarea
                  value={uploadFile.content}
                  onChange={(e) => setUploadFile({ ...uploadFile, content: e.target.value })}
                  className="w-full h-32 px-3 py-2 border border-input rounded-md bg-background text-sm font-mono"
                  placeholder="File content..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUploadFile} className="flex-1">Upload</Button>
                <Button variant="outline" onClick={() => setShowUploadModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>New Folder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Folder Name</Label>
                <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="folder-name" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateFolder} className="flex-1">Create</Button>
                <Button variant="outline" onClick={() => setShowNewFolderModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rename</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Name</Label>
                <Input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} placeholder="new-name" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRenameFile} className="flex-1">Rename</Button>
                <Button variant="outline" onClick={() => setShowRenameModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>File Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="perm-read"
                  checked={filePermissions.read}
                  onChange={(e) => setFilePermissions({ ...filePermissions, read: e.target.checked })}
                />
                <Label htmlFor="perm-read">Read (r)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="perm-write"
                  checked={filePermissions.write}
                  onChange={(e) => setFilePermissions({ ...filePermissions, write: e.target.checked })}
                />
                <Label htmlFor="perm-write">Write (w)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="perm-execute"
                  checked={filePermissions.execute}
                  onChange={(e) => setFilePermissions({ ...filePermissions, execute: e.target.checked })}
                />
                <Label htmlFor="perm-execute">Execute (x)</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdatePermissions} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => setShowPermissionsModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Versions Modal */}
      {showVersionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>File Versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fileVersions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions found</p>
              ) : (
                fileVersions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">Version {v.version}</div>
                      <div className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Checksum: {v.checksum?.slice(0, 8)}...</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRestoreVersion(v.id)}>Restore</Button>
                  </div>
                ))
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowVersionsModal(false)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function DatabasesSection() {
  const { user } = useAuth();
  const [databases, setDatabases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState<any>(null);
  const [newDb, setNewDb] = useState({ name: "", type: "postgresql", user: "", password: "", storageLimitGB: 10 });
  const [renameTo, setRenameTo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newStorageLimit, setNewStorageLimit] = useState(10);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbBackups, setDbBackups] = useState<any[]>([]);
  const [newDbUser, setNewDbUser] = useState({ username: "", permissions: "read" as "read" | "write" | "admin" });

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getDatabases(serverId);
      if (res.success && res.data) {
        setDatabases(res.data);
      } else {
        setDatabases([
          { id: "1", name: "erpvala_prod", type: "postgresql", sizeGB: 4.2, user: "erpvala", status: "running", storageLimitGB: 10 },
          { id: "2", name: "erpvala_cache", type: "redis", sizeGB: 0.32, user: "redis", status: "running", storageLimitGB: 5 },
          { id: "3", name: "analytics", type: "postgresql", sizeGB: 1.8, user: "analytics", status: "running", storageLimitGB: 10 },
          { id: "4", name: "wp_blog", type: "mysql", sizeGB: 0.24, user: "wp", status: "stopped", storageLimitGB: 5 },
        ]);
      }
    } catch (error) {
      console.error("Failed to load databases");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!user || !newDb.name || !newDb.user || !newDb.password) return;
    try {
      const res = await serverApiService.createDatabase(
        { serverId: "server-demo-001", name: newDb.name, type: newDb.type as any, user: newDb.user, password: newDb.password },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setShowAddModal(false);
        setNewDb({ name: "", type: "postgresql", user: "", password: "", storageLimitGB: 10 });
        loadDatabases();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to create database");
    }
  };

  const handleBackupDatabase = async (dbId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.backupDatabase(dbId, user.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to backup database");
    }
  };

  const handleDeleteDatabase = async (dbId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this database? This action cannot be undone.")) return;
    try {
      const res = await serverApiService.deleteDatabase(dbId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDatabases();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete database");
    }
  };

  const handleRenameDatabase = async () => {
    if (!user || !selectedDb || !renameTo) return;
    try {
      const res = await serverApiService.renameDatabase(selectedDb.id, renameTo, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowRenameModal(false);
        setRenameTo("");
        loadDatabases();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to rename database");
    }
  };

  const handleResetPassword = async () => {
    if (!user || !selectedDb || !newPassword) return;
    try {
      const res = await serverApiService.resetDatabasePassword(selectedDb.id, newPassword, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowPasswordModal(false);
        setNewPassword("");
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleScaleStorage = async () => {
    if (!user || !selectedDb) return;
    try {
      const res = await serverApiService.scaleDatabaseStorage(selectedDb.id, newStorageLimit, user.id);
      if (res.success) {
        toast.success(res.message);
        setShowScaleModal(false);
        loadDatabases();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to scale storage");
    }
  };

  const handleOpenViewer = async (db: any) => {
    setSelectedDb(db);
    setShowViewerModal(true);
    setQuery("");
    setQueryResult(null);
  };

  const handleExecuteQuery = async () => {
    if (!user || !selectedDb || !query) return;
    try {
      const res = await serverApiService.executeQuery(selectedDb.id, query, user.id);
      if (res.success && res.data) {
        setQueryResult(res.data);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to execute query");
    }
  };

  const handleOpenUsers = async (db: any) => {
    setSelectedDb(db);
    setShowUsersModal(true);
    const res = await serverApiService.getDatabaseUsers(db.id);
    if (res.success && res.data) {
      setDbUsers(res.data);
    }
  };

  const handleAddDbUser = async () => {
    if (!user || !selectedDb || !newDbUser.username) return;
    try {
      const res = await serverApiService.addDatabaseUser(selectedDb.id, newDbUser.username, newDbUser.permissions, user.id);
      if (res.success) {
        toast.success(res.message);
        setNewDbUser({ username: "", permissions: "read" });
        const usersRes = await serverApiService.getDatabaseUsers(selectedDb.id);
        if (usersRes.success && usersRes.data) {
          setDbUsers(usersRes.data);
        }
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to add user");
    }
  };

  const handleRemoveDbUser = async (userId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.removeDatabaseUser(selectedDb.id, userId, user.id);
      if (res.success) {
        toast.success(res.message);
        const usersRes = await serverApiService.getDatabaseUsers(selectedDb.id);
        if (usersRes.success && usersRes.data) {
          setDbUsers(usersRes.data);
        }
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  const handleOpenBackups = async (db: any) => {
    setSelectedDb(db);
    setShowBackupsModal(true);
    const res = await serverApiService.getDatabaseBackups(db.id);
    if (res.success && res.data) {
      setDbBackups(res.data);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to restore this backup? Current data will be replaced.")) return;
    try {
      const res = await serverApiService.restoreDatabaseBackup(backupId, user.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to restore backup");
    }
  };

  const handleRestartDatabase = async (dbId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.restartDatabase(dbId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDatabases();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to restart database");
    }
  };

  const handleOptimizeDatabase = async (dbId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.optimizeDatabase(dbId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadDatabases();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to optimize database");
    }
  };

  const formatSize = (gb: number) => {
    if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
    return `${gb.toFixed(1)} GB`;
  };

  const formatBackupSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Databases</h2>
          <p className="text-sm text-muted-foreground">Managed database instances</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Create Database</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading databases...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((d) => (
                  <TableRow key={d.id || d.name}>
                    <TableCell className="font-mono text-sm">{d.name}</TableCell>
                    <TableCell><Badge variant="secondary">{d.type}</Badge></TableCell>
                    <TableCell>{formatSize(d.sizeGB)}</TableCell>
                    <TableCell>
                      <Badge variant={d.status === "running" ? "default" : "destructive"}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{d.user}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenViewer(d)}>Open</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenUsers(d)}>Users</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenBackups(d)}>Backups</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedDb(d); setRenameTo(d.name); setShowRenameModal(true); }}>Rename</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedDb(d); setShowPasswordModal(true); }}>Password</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedDb(d); setNewStorageLimit(d.storageLimitGB || 10); setShowScaleModal(true); }}>Scale</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRestartDatabase(d.id)}>Restart</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOptimizeDatabase(d.id)}>Optimize</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleBackupDatabase(d.id)}>Backup</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteDatabase(d.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Database Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Database Name</Label>
                <Input value={newDb.name} onChange={(e) => setNewDb({ ...newDb, name: e.target.value })} placeholder="my_database" />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={newDb.type}
                  onChange={(e) => setNewDb({ ...newDb, type: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="redis">Redis</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>
              <div>
                <Label>Username</Label>
                <Input value={newDb.user} onChange={(e) => setNewDb({ ...newDb, user: e.target.value })} placeholder="db_user" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={newDb.password} onChange={(e) => setNewDb({ ...newDb, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div>
                <Label>Storage Limit (GB)</Label>
                <Input type="number" value={newDb.storageLimitGB} onChange={(e) => setNewDb({ ...newDb, storageLimitGB: Number(e.target.value) })} placeholder="10" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateDatabase} className="flex-1">Create Database</Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Viewer Modal */}
      {showViewerModal && selectedDb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>Database Viewer - {selectedDb.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SQL Query</Label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-input rounded-md bg-background text-sm font-mono"
                  placeholder="SELECT * FROM table_name LIMIT 10;"
                />
              </div>
              <Button onClick={handleExecuteQuery}>Execute Query</Button>
              {queryResult && (
                <div className="mt-4">
                  <Label>Results</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {queryResult.columns.map((col) => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryResult.rows.map((row, idx) => (
                        <TableRow key={idx}>
                          {queryResult.columns.map((col) => (
                            <TableCell key={col}>{String(row[col])}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowViewerModal(false)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && selectedDb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Database Users - {selectedDb.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add New User</Label>
                <div className="flex gap-2">
                  <Input value={newDbUser.username} onChange={(e) => setNewDbUser({ ...newDbUser, username: e.target.value })} placeholder="username" />
                  <select
                    value={newDbUser.permissions}
                    onChange={(e) => setNewDbUser({ ...newDbUser, permissions: e.target.value as "read" | "write" | "admin" })}
                    className="h-10 px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button onClick={handleAddDbUser}>Add</Button>
                </div>
              </div>
              <div>
                <Label>Existing Users</Label>
                {dbUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {dbUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <div className="font-medium">{u.username}</div>
                          <div className="text-xs text-muted-foreground">{u.permissions}</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveDbUser(u.id)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowUsersModal(false)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backups Modal */}
      {showBackupsModal && selectedDb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Database Backups - {selectedDb.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => handleBackupDatabase(selectedDb.id)}>Create New Backup</Button>
              <div>
                <Label>Existing Backups</Label>
                {dbBackups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No backups found</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {dbBackups.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <div className="font-medium">{new Date(b.createdAt).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{formatBackupSize(b.size)} - {b.status}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleRestoreBackup(b.id)}>Restore</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBackupsModal(false)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && selectedDb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rename Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Name</Label>
                <Input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} placeholder="new_database_name" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRenameDatabase} className="flex-1">Rename</Button>
                <Button variant="outline" onClick={() => setShowRenameModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedDb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleResetPassword} className="flex-1">Reset</Button>
                <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scale Storage Modal */}
      {showScaleModal && selectedDb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Scale Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Storage Limit (GB)</Label>
                <Input type="number" value={newStorageLimit} onChange={(e) => setNewStorageLimit(Number(e.target.value))} placeholder="10" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleScaleStorage} className="flex-1">Scale</Button>
                <Button variant="outline" onClick={() => setShowScaleModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function MailSection() {
  const { user } = useAuth();
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMail, setNewMail] = useState({ address: "", password: "", quotaGB: 10, forwardTo: "" });

  useEffect(() => {
    loadMailboxes();
  }, []);

  const loadMailboxes = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getMail(serverId);
      if (res.success && res.data) {
        setMailboxes(res.data);
      } else {
        // Fallback to demo data
        setMailboxes([
          { id: "1", address: "admin@erpvala.com", quotaGB: 10, usedGB: 2.4, forwardTo: "" },
          { id: "2", address: "support@erpvala.com", quotaGB: 10, usedGB: 1.1, forwardTo: "support-team@external.com" },
          { id: "3", address: "billing@erpvala.com", quotaGB: 5, usedGB: 0.32, forwardTo: "" },
        ]);
      }
    } catch (error) {
      console.error("Failed to load mailboxes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMailbox = async () => {
    if (!user || !newMail.address || !newMail.password) return;
    try {
      const res = await serverApiService.createMail(
        { serverId: "server-demo-001", address: newMail.address, password: newMail.password, quotaGB: newMail.quotaGB, forwardTo: newMail.forwardTo || undefined },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setShowAddModal(false);
        setNewMail({ address: "", password: "", quotaGB: 10, forwardTo: "" });
        loadMailboxes();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to create mailbox");
    }
  };

  const handleDeleteMailbox = async (mailId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this mailbox?")) return;
    try {
      const res = await serverApiService.deleteMail(mailId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadMailboxes();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete mailbox");
    }
  };

  const formatQuota = (used: number, total: number) => {
    if (used < 1) return `${(used * 1024).toFixed(0)} MB / ${total} GB`;
    return `${used.toFixed(1)} / ${total} GB`;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mail</h2>
          <p className="text-sm text-muted-foreground">Email accounts, forwarders, and DNS</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-1" /> New Mailbox</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading mailboxes...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Forward</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mailboxes.map((m) => (
                    <TableRow key={m.id || m.address}>
                      <TableCell>{m.address}</TableCell>
                      <TableCell className="text-sm">{formatQuota(m.usedGB, m.quotaGB)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.forwardTo || "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost">Webmail</Button>
                        <Button size="sm" variant="ghost">Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteMailbox(m.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">DNS Records</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            <div>MX  10 mail.erpvala.com</div>
            <Separator />
            <div>SPF  v=spf1 mx ~all</div>
            <Separator />
            <div>DKIM  selector1._domainkey</div>
            <Separator />
            <div>DMARC  p=quarantine</div>
          </CardContent>
        </Card>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>New Mailbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input value={newMail.address} onChange={(e) => setNewMail({ ...newMail, address: e.target.value })} placeholder="user@example.com" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={newMail.password} onChange={(e) => setNewMail({ ...newMail, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div>
                <Label>Quota (GB)</Label>
                <Input type="number" value={newMail.quotaGB} onChange={(e) => setNewMail({ ...newMail, quotaGB: parseFloat(e.target.value) })} placeholder="10" />
              </div>
              <div>
                <Label>Forward To (optional)</Label>
                <Input value={newMail.forwardTo} onChange={(e) => setNewMail({ ...newMail, forwardTo: e.target.value })} placeholder="forward@example.com" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateMailbox} className="flex-1">Create Mailbox</Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function ApplicationsSection() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newApp, setNewApp] = useState({ name: "", type: "node", domainId: "", gitRepo: "", gitBranch: "main" });

  const apps = [
    { name: "WordPress", v: "6.6", cat: "CMS", type: "php" },
    { name: "Ghost", v: "5.78", cat: "CMS", type: "node" },
    { name: "Node.js App", v: "20 LTS", cat: "Runtime", type: "node" },
    { name: "Laravel", v: "11.x", cat: "Framework", type: "php" },
    { name: "Static Site", v: "—", cat: "Static", type: "static" },
    { name: "NextCloud", v: "29.0", cat: "Productivity", type: "php" },
    { name: "Mautic", v: "5.1", cat: "Marketing", type: "php" },
    { name: "Matomo", v: "5.0", cat: "Analytics", type: "php" },
  ];

  useEffect(() => {
    loadApplications();
    loadQueue();
    const interval = setInterval(() => {
      loadQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadApplications = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getApplications(serverId);
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch (error) {
      console.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  const loadQueue = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getInstallQueue(serverId);
      if (res.success && res.data) {
        setQueue(res.data);
      } else {
        // Fallback to demo data
        setQueue([
          { id: "JOB-2041", app: "WordPress", domain: "blog.erpvala.com", status: "queued", progress: 0, eta: "in 2m" },
          { id: "JOB-2040", app: "NextCloud", domain: "files.erpvala.io", status: "queued", progress: 0, eta: "in 5m" },
          { id: "JOB-2039", app: "Node.js App", domain: "api-staging.erpvala.dev", status: "installing", progress: 62, eta: "1m left" },
          { id: "JOB-2038", app: "Laravel", domain: "crm.erpvala.com", status: "installing", progress: 24, eta: "3m left" },
          { id: "JOB-2037", app: "Matomo", domain: "stats.erpvala.com", status: "completed", progress: 100, eta: "12m ago" },
        ]);
      }
    } catch (error) {
      console.error("Failed to load queue");
    }
  };

  const handleDeployApp = async (appTemplate: typeof apps[0]) => {
    if (!user) return;
    setNewApp({ name: appTemplate.name, type: appTemplate.type, domainId: "demo-domain", gitRepo: "", gitBranch: "main" });
    setShowDeployModal(true);
  };

  const handleDeploy = async () => {
    if (!user || !newApp.name) return;
    try {
      const res = await serverApiService.createApplication(
        { serverId: "server-demo-001", domainId: newApp.domainId, name: newApp.name, type: newApp.type as any, version: "1.0.0", gitRepo: newApp.gitRepo, gitBranch: newApp.gitBranch },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setShowDeployModal(false);
        loadQueue();
        loadApplications();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to deploy application");
    }
  };

  const handleRestartApp = async (appId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.restartApplication(appId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadApplications();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to restart application");
    }
  };

  const handleStopApp = async (appId: string) => {
    if (!user) return;
    try {
      const res = await serverApiService.stopApplication(appId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadApplications();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to stop application");
    }
  };

  const cols: { key: string; label: string }[] = [
    { key: "queued", label: "Queued" },
    { key: "installing", label: "Installing" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Applications</h2>
        <p className="text-sm text-muted-foreground">One-click installable web applications</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {apps.map((a) => (
          <Card key={a.name}>
            <CardContent className="p-3 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-md bg-muted flex items-center justify-center">
                <AppWindow className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium text-sm truncate">{a.name}</div>
                <div className="text-[10px] text-muted-foreground">v{a.v} · {a.cat}</div>
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={() => handleDeployApp(a)}>Install</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Install Queue</h3>
            <p className="text-xs text-muted-foreground">Track in-flight application installations</p>
          </div>
          <Button variant="outline" size="sm">Clear completed</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cols.map((c) => {
            const items = queue.filter((j) => j.status === c.key);
            return (
              <div key={c.key} className="bg-muted/40 rounded-lg p-3 space-y-3 min-h-[260px]">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">{c.label}</span>
                  <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                </div>
                {items.map((j) => (
                  <Card key={j.id} className="cursor-grab active:cursor-grabbing">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AppWindow className="h-4 w-4 text-secondary" />
                          <span className="text-sm font-medium">{j.app}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{j.id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">{j.domain}</p>
                      {j.status !== "queued" && <Progress value={j.progress} className="h-1.5" />}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{j.status === "installing" ? `${j.progress}%` : j.status === "completed" ? "Done" : "Pending"}</span>
                        <span>{j.eta}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {applications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Deployed Applications</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell><Badge variant="secondary">{app.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={app.status === "running" ? "default" : app.status === "stopped" ? "destructive" : "secondary"}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleRestartApp(app.id)}>
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleStopApp(app.id)}>
                          <Square className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {showDeployModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Deploy Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Application Name</Label>
                <Input value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={newApp.type}
                  onChange={(e) => setNewApp({ ...newApp, type: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="node">Node.js</option>
                  <option value="php">PHP</option>
                  <option value="static">Static</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                </select>
              </div>
              <div>
                <Label>Git Repository (optional)</Label>
                <Input value={newApp.gitRepo} onChange={(e) => setNewApp({ ...newApp, gitRepo: e.target.value })} placeholder="https://github.com/user/repo" />
              </div>
              <div>
                <Label>Branch</Label>
                <Input value={newApp.gitBranch} onChange={(e) => setNewApp({ ...newApp, gitBranch: e.target.value })} placeholder="main" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDeploy} className="flex-1">Deploy</Button>
                <Button variant="outline" onClick={() => setShowDeployModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function SecuritySection() {
  const { user } = useAuth();
  const [security, setSecurity] = useState<any>(null);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [newIP, setNewIP] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadSecurity();
  }, []);

  const loadSecurity = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getSecurity(serverId);
      if (res.success && res.data) {
        setSecurity(res.data);
        setBlockedIPs(res.data.blockedIPs || []);
      } else {
        // Fallback to demo data
        setSecurity({
          firewallEnabled: true,
          blockedIPs: ["192.168.1.100", "10.0.0.50"],
          sslEnabled: true,
          malwareScanEnabled: false,
        });
        setBlockedIPs(["192.168.1.100", "10.0.0.50"]);
      }
    } catch (error) {
      console.error("Failed to load security config");
    }
  };

  const handleToggleFirewall = async () => {
    if (!user || !security) return;
    try {
      const res = await serverApiService.updateSecurity(
        "server-demo-001",
        { firewallEnabled: !security.firewallEnabled },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        loadSecurity();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to toggle firewall");
    }
  };

  const handleBlockIP = async () => {
    if (!user || !newIP) return;
    try {
      const res = await serverApiService.blockIP("server-demo-001", newIP, user.id);
      if (res.success) {
        toast.success(res.message);
        setNewIP("");
        loadSecurity();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to block IP");
    }
  };

  const handleUnblockIP = async (ip: string) => {
    if (!user || !security) return;
    try {
      const updatedIPs = blockedIPs.filter(i => i !== ip);
      const res = await serverApiService.updateSecurity(
        "server-demo-001",
        { blockedIPs: updatedIPs },
        user.id
      );
      if (res.success) {
        toast.success("IP unblocked successfully");
        loadSecurity();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to unblock IP");
    }
  };

  const handleMalwareScan = async () => {
    if (!user) return;
    setIsScanning(true);
    try {
      const res = await serverApiService.runMalwareScan("server-demo-001", user.id);
      if (res.success) {
        toast.success(res.message);
        loadSecurity();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to run malware scan");
    } finally {
      setIsScanning(false);
    }
  };

  const certs = [
    { domain: "erpvala.com", issuer: "Let's Encrypt", expires: "2026-07-12" },
    { domain: "api.erpvala.io", issuer: "Let's Encrypt", expires: "2026-08-04" },
    { domain: "staging.erpvala.dev", issuer: "Let's Encrypt", expires: "2026-05-02" },
  ];

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">SSL & Security</h2>
        <p className="text-sm text-muted-foreground">Certificates, firewall, and hardening</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">SSL Certificates</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certs.map((c) => (
                  <TableRow key={c.domain}>
                    <TableCell>{c.domain}</TableCell>
                    <TableCell className="text-sm">{c.issuer}</TableCell>
                    <TableCell className="text-sm">{c.expires}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Firewall Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Firewall Status</span>
              <Button
                variant={security?.firewallEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleFirewall}
              >
                {security?.firewallEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <Badge variant="default">Allow</Badge>
                <span className="font-mono">TCP 22</span>
                <span className="text-muted-foreground">Admin IPs</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <Badge variant="default">Allow</Badge>
                <span className="font-mono">TCP 80,443</span>
                <span className="text-muted-foreground">Any</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <Badge variant="default">Allow</Badge>
                <span className="font-mono">TCP 5432</span>
                <span className="text-muted-foreground">10.0.0.0/24</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="destructive">Deny</Badge>
                <span className="font-mono">ALL</span>
                <span className="text-muted-foreground">Any</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Blocked IPs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address to block"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleBlockIP}>Block</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {blockedIPs.map((ip) => (
              <div key={ip} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm">
                <span className="font-mono">{ip}</span>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => handleUnblockIP(ip)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {blockedIPs.length === 0 && (
              <span className="text-sm text-muted-foreground">No blocked IPs</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Malware Protection</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Malware Scanner</div>
              <div className="text-xs text-muted-foreground">
                Last scan: {security?.lastScanAt ? new Date(security.lastScanAt).toLocaleString() : "Never"}
              </div>
            </div>
            <Button onClick={handleMalwareScan} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Run Scan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ToolsSection() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<any[]>([]);
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCronModal, setShowCronModal] = useState(false);
  const [backupType, setBackupType] = useState<"manual" | "daily" | "weekly">("manual");
  const [newCron, setNewCron] = useState({ name: "", schedule: "0 * * * *", command: "" });

  useEffect(() => {
    loadBackups();
    loadCronJobs();
  }, []);

  const loadBackups = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getBackups(serverId);
      if (res.success && res.data) {
        setBackups(res.data);
      } else {
        setBackups([
          { id: "1", type: "daily", status: "completed", sizeGB: 12.4, path: "/backups/daily-2024-01-15.tar.gz", createdAt: "2024-01-15T02:00:00Z", completedAt: "2024-01-15T02:45:00Z" },
          { id: "2", type: "manual", status: "completed", sizeGB: 15.2, path: "/backups/manual-pre-deploy.tar.gz", createdAt: "2024-01-14T14:30:00Z", completedAt: "2024-01-14T15:15:00Z" },
          { id: "3", type: "weekly", status: "completed", sizeGB: 18.7, path: "/backups/weekly-2024-W02.tar.gz", createdAt: "2024-01-13T02:00:00Z", completedAt: "2024-01-13T03:30:00Z" },
        ]);
      }
    } catch (error) {
      console.error("Failed to load backups");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCronJobs = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getCronJobs(serverId);
      if (res.success && res.data) {
        setCronJobs(res.data);
      } else {
        setCronJobs([
          { id: "1", name: "Daily Backup", schedule: "0 2 * * *", command: "/usr/local/bin/backup.sh", enabled: true },
          { id: "2", name: "Log Cleanup", schedule: "0 3 * * 0", command: "/usr/local/bin/cleanup-logs.sh", enabled: true },
          { id: "3", name: "Cache Clear", schedule: "*/30 * * * *", command: "/usr/local/bin/clear-cache.sh", enabled: false },
        ]);
      }
    } catch (error) {
      console.error("Failed to load cron jobs");
    }
  };

  const handleCreateBackup = async () => {
    if (!user) return;
    try {
      const res = await serverApiService.createBackup(
        { serverId: "server-demo-001", type: backupType },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setShowBackupModal(false);
        loadBackups();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to create backup");
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) return;
    try {
      const res = await serverApiService.restoreBackup(backupId, user.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to restore backup");
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this backup?")) return;
    try {
      setBackups(backups.filter(b => b.id !== backupId));
      toast.success("Backup deleted successfully");
    } catch (error) {
      toast.error("Failed to delete backup");
    }
  };

  const handleCreateCronJob = async () => {
    if (!user || !newCron.name || !newCron.schedule || !newCron.command) return;
    try {
      const res = await serverApiService.createCronJob(
        { serverId: "server-demo-001", name: newCron.name, schedule: newCron.schedule, command: newCron.command, enabled: true },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setShowCronModal(false);
        setNewCron({ name: "", schedule: "0 * * * *", command: "" });
        loadCronJobs();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to create cron job");
    }
  };

  const handleToggleCronJob = async (cronId: string, enabled: boolean) => {
    if (!user) return;
    try {
      const res = await serverApiService.updateCronJob(cronId, { enabled: !enabled }, user.id);
      if (res.success) {
        toast.success(res.message);
        loadCronJobs();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to toggle cron job");
    }
  };

  const handleDeleteCronJob = async (cronId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this cron job?")) return;
    try {
      const res = await serverApiService.deleteCronJob(cronId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadCronJobs();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete cron job");
    }
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Tools & Settings</h2>
        <p className="text-sm text-muted-foreground">Server-wide configuration, backups, and cron jobs</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {["PHP Settings", "Web Server Settings", "Environment Variables", "Server Restart"].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{i}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Backups</CardTitle>
              <Button onClick={() => setShowBackupModal(true)}><Plus className="h-4 w-4 mr-1" /> Create Backup</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading backups...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell><Badge variant="secondary">{b.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={b.status === "completed" ? "default" : "secondary"}>{b.status}</Badge>
                      </TableCell>
                      <TableCell>{b.sizeGB.toFixed(1)} GB</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleRestoreBackup(b.id)}>Restore</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteBackup(b.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cron Jobs</CardTitle>
              <Button onClick={() => setShowCronModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Job</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronJobs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.schedule}</TableCell>
                    <TableCell>
                      <Badge variant={c.enabled ? "default" : "secondary"}>{c.enabled ? "Enabled" : "Disabled"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleToggleCronJob(c.id, c.enabled)}>
                        {c.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCronJob(c.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Backup Type</Label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="manual">Manual</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateBackup} className="flex-1">Create Backup</Button>
                <Button variant="outline" onClick={() => setShowBackupModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCronModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Cron Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Job Name</Label>
                <Input value={newCron.name} onChange={(e) => setNewCron({ ...newCron, name: e.target.value })} placeholder="Daily Backup" />
              </div>
              <div>
                <Label>Schedule (Cron Expression)</Label>
                <Input value={newCron.schedule} onChange={(e) => setNewCron({ ...newCron, schedule: e.target.value })} placeholder="0 * * * *" />
                <p className="text-xs text-muted-foreground mt-1">Format: minute hour day month weekday</p>
              </div>
              <div>
                <Label>Command</Label>
                <Input value={newCron.command} onChange={(e) => setNewCron({ ...newCron, command: e.target.value })} placeholder="/usr/local/bin/script.sh" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateCronJob} className="flex-1">Add Job</Button>
                <Button variant="outline" onClick={() => setShowCronModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function ExtensionsSection() {
  const exts = [
    { name: "Backup Manager", v: "2.4.1", installed: true },
    { name: "Git Deploy", v: "1.8.0", installed: true },
    { name: "ImunifyAV", v: "6.2.0", installed: false },
    { name: "Docker Manager", v: "0.9.3", installed: false },
    { name: "Node.js Toolkit", v: "3.1.0", installed: true },
    { name: "Let's Encrypt", v: "5.0.2", installed: true },
  ];
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Extensions</h2>
        <p className="text-sm text-muted-foreground">Marketplace of installable modules</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exts.map((e) => (
          <Card key={e.name}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Puzzle className="h-4 w-4 text-secondary" />
                  <span className="font-medium">{e.name}</span>
                </div>
                <Badge variant="secondary">v{e.v}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Adds {e.name.toLowerCase()} capabilities to your hosting panel.
              </p>
              <Button size="sm" variant={e.installed ? "outline" : "default"} className="w-full">
                {e.installed ? "Manage" : "Install"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function UsersSection() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", role: "user", permissions: [] });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const serverId = "server-demo-001";
      const res = await serverApiService.getServerUsers(serverId);
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        // Fallback to demo data
        setUsers([
          { id: "1", username: "admin", email: "admin@erpvala.com", role: "admin", permissions: ["*"] },
          { id: "2", username: "deploy", email: "deploy@erpvala.com", role: "manager", permissions: ["deploy", "restart"] },
          { id: "3", username: "ops-jane", email: "jane@erpvala.com", role: "user", permissions: ["logs", "metrics"] },
          { id: "4", username: "dev-rahul", email: "rahul@erpvala.com", role: "user", permissions: ["logs"] },
        ]);
      }
    } catch (error) {
      console.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!user || !newUser.username || !newUser.email) return;
    try {
      const res = await serverApiService.createServerUser(
        { serverId: "server-demo-001", username: newUser.username, email: newUser.email, role: newUser.role as any, permissions: newUser.permissions },
        user.id
      );
      if (res.success) {
        toast.success(res.message);
        setShowAddModal(false);
        setNewUser({ username: "", email: "", role: "user", permissions: [] });
        loadUsers();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await serverApiService.deleteServerUser(userId, user.id);
      if (res.success) {
        toast.success(res.message);
        loadUsers();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users & Accounts</h2>
          <p className="text-sm text-muted-foreground">System users with panel access</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Add User</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono">{u.username}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.permissions.join(", ")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost">Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="username" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateUser} className="flex-1">Add User</Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function LogsSection() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [filter]);

  const loadLogs = async () => {
    try {
      const serverId = "server-demo-001";
      const type = filter === "all" ? undefined : filter as any;
      const res = await serverApiService.getLogs(serverId, type, 50);
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        // Fallback to demo data
        setLogs([
          { id: "1", ts: "14:22:11", level: "info", type: "access", source: "nginx", message: "200 GET /api/items 12ms" },
          { id: "2", ts: "14:22:09", level: "warning", type: "system", source: "postgres", message: "slow query 1.4s on items_select" },
          { id: "3", ts: "14:22:04", level: "info", type: "system", source: "auth", message: "user admin@test.com signed in" },
          { id: "4", ts: "14:21:55", level: "error", type: "mail", source: "postfix", message: "delivery deferred to mx2.gmail.com" },
          { id: "5", ts: "14:21:30", level: "info", type: "system", source: "cron", message: "backup job completed in 42s" },
        ]);
      }
    } catch (error) {
      console.error("Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Logs & Monitoring</h2>
          <p className="text-sm text-muted-foreground">Live tail of system events</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 px-3 py-1 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Logs</option>
            <option value="access">Access</option>
            <option value="error">Error</option>
            <option value="system">System</option>
            <option value="mail">Mail</option>
            <option value="security">Security</option>
          </select>
          <Button variant="outline" onClick={loadLogs}>Refresh</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : (
            <div className="bg-muted/40 font-mono text-xs">
              {logs.map((l) => (
                <div key={l.id} className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border last:border-0">
                  <span className="col-span-2 text-muted-foreground">{l.ts}</span>
                  <span className="col-span-1">
                    <Badge
                      variant={l.level === "error" ? "destructive" : l.level === "warning" ? "secondary" : "default"}
                      className="text-[10px]"
                    >
                      {l.level.toUpperCase()}
                    </Badge>
                  </span>
                  <span className="col-span-2 text-secondary">{l.source}</span>
                  <span className="col-span-7">{l.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
