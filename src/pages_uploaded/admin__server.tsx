import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function AdminServerPage({ initialSection = "dashboard" }: { initialSection?: SectionKey } = {}) {
  const [section, setSection] = useState<SectionKey>(initialSection);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Inner Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-12 flex items-center gap-2 px-4 border-b border-border">
          <Server className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Hosting Panel</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border text-[11px] text-muted-foreground">
          v1.0 · Demo UI
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 border-b border-border flex items-center gap-3 px-4 bg-card">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Server className="h-4 w-4 text-primary" />
            srv-prod-01.erpvala.io
          </div>
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search domains, files, databases…" className="h-8 pl-8 text-sm" />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
          </Button>
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
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Server Overview</h2>
        <p className="text-sm text-muted-foreground">Real-time resource usage and health.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard title="CPU" value="34%" pct={34} icon={Cpu} detail="8 cores · 2.4 GHz avg" />
        <ResourceCard title="Memory" value="12.4 / 32 GB" pct={39} icon={MemoryStick} detail="Cached: 4.1 GB" />
        <ResourceCard title="Disk" value="180 / 500 GB" pct={36} icon={HardDrive} detail="SSD · I/O 18 MB/s" />
        <ResourceCard title="Network" value="42 Mbps" pct={21} icon={Activity} detail="↓ 28 / ↑ 14 Mbps" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Services</CardTitle>
            <CardDescription>Status of installed system services</CardDescription>
          </CardHeader>
          <CardContent>
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
                {[
                  ["nginx", "Running", "42d 11h"],
                  ["postgresql", "Running", "42d 11h"],
                  ["redis", "Running", "12d 04h"],
                  ["postfix", "Stopped", "—"],
                  ["dovecot", "Running", "42d 11h"],
                ].map(([name, status, up]) => (
                  <TableRow key={name}>
                    <TableCell className="font-mono text-xs">{name}</TableCell>
                    <TableCell>
                      <Badge variant={status === "Running" ? "default" : "destructive"}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{up}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">Restart</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Add Domain", icon: Globe },
              { label: "Create Database", icon: Database },
              { label: "Issue SSL", icon: Lock },
              { label: "Run Backup", icon: ArrowUpToLine },
              { label: "Restore Backup", icon: ArrowDownToLine },
            ].map(({ label, icon: I }) => (
              <Button key={label} variant="outline" className="w-full justify-start">
                <I className="h-4 w-4 mr-2" /> {label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DomainsSection() {
  const domains = [
    { name: "erpvala.com", ip: "203.0.113.10", ssl: "Active", status: "Online" },
    { name: "shop.erpvala.com", ip: "203.0.113.10", ssl: "Active", status: "Online" },
    { name: "api.erpvala.io", ip: "203.0.113.11", ssl: "Active", status: "Online" },
    { name: "staging.erpvala.dev", ip: "203.0.113.12", ssl: "Expiring", status: "Online" },
    { name: "old-portal.com", ip: "203.0.113.10", ssl: "None", status: "Suspended" },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domains</h2>
          <p className="text-sm text-muted-foreground">Manage hosted domains and DNS</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Add Domain</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>SSL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((d) => (
                <TableRow key={d.name}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="font-mono text-xs">{d.ip}</TableCell>
                  <TableCell>
                    <Badge variant={d.ssl === "Active" ? "default" : d.ssl === "Expiring" ? "secondary" : "outline"}>
                      {d.ssl}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === "Online" ? "default" : "destructive"}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost">DNS</Button>
                    <Button size="sm" variant="ghost">SSL</Button>
                    <Button size="sm" variant="ghost">Open</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function FilesSection() {
  const tree = [
    { name: "var", children: ["www", "log", "lib"] },
    { name: "etc", children: ["nginx", "postgresql", "ssl"] },
    { name: "home", children: ["admin", "deploy"] },
    { name: "tmp", children: [] as string[] },
  ];
  const files = [
    { name: "index.html", size: "4.2 KB", modified: "2026-04-19 14:22", lang: "html" },
    { name: "app.js", size: "182 KB", modified: "2026-04-19 14:22", lang: "js" },
    { name: "styles.css", size: "22 KB", modified: "2026-04-18 10:01", lang: "css" },
    { name: ".env.production", size: "1.1 KB", modified: "2026-04-15 09:14", lang: "env" },
    { name: "robots.txt", size: "210 B", modified: "2026-04-10 12:00", lang: "txt" },
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

  const [selected, setSelected] = useState(files[0]);
  const [mode, setMode] = useState<"list" | "edit">("list");

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Manager</h2>
          <p className="text-sm text-muted-foreground">/var/www/erpvala.com/public</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><ArrowUpToLine className="h-4 w-4 mr-1" /> Upload</Button>
          <Button><Plus className="h-4 w-4 mr-1" /> New File</Button>
        </div>
      </div>
      <Card>
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
                <span>/var/www/erpvala.com/public</span>
                <span>{files.length} items</span>
              </div>
              <div>
                {files.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => { setSelected(f); setMode("list"); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-2 border-b border-border last:border-0 text-left text-sm hover:bg-muted/40",
                      selected.name === f.name && "bg-accent/40",
                    )}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.size}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Right: editor/preview pane */}
            <div className="col-span-5 flex flex-col">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{selected.name}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase">{selected.lang}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={mode === "list" ? "default" : "ghost"}
                    onClick={() => setMode("list")}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === "edit" ? "default" : "ghost"}
                    onClick={() => setMode("edit")}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">Save</Button>
                </div>
              </div>
              <div className="flex-1 bg-muted/30 font-mono text-xs overflow-auto">
                {mode === "list" ? (
                  <pre className="p-4 whitespace-pre leading-relaxed">{SAMPLES[selected.lang]}</pre>
                ) : (
                  <div className="flex">
                    <div className="select-none px-3 py-4 text-right text-muted-foreground border-r border-border">
                      {SAMPLES[selected.lang].split("\n").map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      defaultValue={SAMPLES[selected.lang]}
                      className="flex-1 bg-transparent outline-none p-4 resize-none leading-relaxed"
                      rows={SAMPLES[selected.lang].split("\n").length + 2}
                    />
                  </div>
                )}
              </div>
              <div className="px-4 py-1.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground bg-card">
                <span>UTF-8 · LF · {selected.size}</span>
                <span>Modified {selected.modified}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DatabasesSection() {
  const dbs = [
    { name: "erpvala_prod", type: "PostgreSQL", size: "4.2 GB", users: 3 },
    { name: "erpvala_cache", type: "Redis", size: "320 MB", users: 1 },
    { name: "analytics", type: "PostgreSQL", size: "1.8 GB", users: 2 },
    { name: "wp_blog", type: "MySQL", size: "240 MB", users: 1 },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Databases</h2>
          <p className="text-sm text-muted-foreground">Managed database instances</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Create Database</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Database</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbs.map((d) => (
                <TableRow key={d.name}>
                  <TableCell className="font-mono text-sm">{d.name}</TableCell>
                  <TableCell><Badge variant="secondary">{d.type}</Badge></TableCell>
                  <TableCell>{d.size}</TableCell>
                  <TableCell>{d.users}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost">Open</Button>
                    <Button size="sm" variant="ghost">Backup</Button>
                    <Button size="sm" variant="ghost">Users</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function MailSection() {
  const mailboxes = [
    { addr: "admin@erpvala.com", quota: "2.4 / 10 GB", forward: "—" },
    { addr: "support@erpvala.com", quota: "1.1 / 10 GB", forward: "support-team@…" },
    { addr: "billing@erpvala.com", quota: "320 MB / 5 GB", forward: "—" },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mail</h2>
          <p className="text-sm text-muted-foreground">Email accounts, forwarders, and DNS</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> New Mailbox</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
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
                  <TableRow key={m.addr}>
                    <TableCell>{m.addr}</TableCell>
                    <TableCell className="text-sm">{m.quota}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.forward}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost">Webmail</Button>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </>
  );
}

function ApplicationsSection() {
  const apps = [
    { name: "WordPress", v: "6.6", cat: "CMS" },
    { name: "Ghost", v: "5.78", cat: "CMS" },
    { name: "Node.js App", v: "20 LTS", cat: "Runtime" },
    { name: "Laravel", v: "11.x", cat: "Framework" },
    { name: "Static Site", v: "—", cat: "Static" },
    { name: "NextCloud", v: "29.0", cat: "Productivity" },
    { name: "Mautic", v: "5.1", cat: "Marketing" },
    { name: "Matomo", v: "5.0", cat: "Analytics" },
  ];

  type Status = "queued" | "installing" | "completed";
  const queue: { id: string; app: string; domain: string; status: Status; pct: number; eta: string }[] = [
    { id: "JOB-2041", app: "WordPress", domain: "blog.erpvala.com", status: "queued", pct: 0, eta: "in 2m" },
    { id: "JOB-2040", app: "NextCloud", domain: "files.erpvala.io", status: "queued", pct: 0, eta: "in 5m" },
    { id: "JOB-2039", app: "Node.js App", domain: "api-staging.erpvala.dev", status: "installing", pct: 62, eta: "1m left" },
    { id: "JOB-2038", app: "Laravel", domain: "crm.erpvala.com", status: "installing", pct: 24, eta: "3m left" },
    { id: "JOB-2037", app: "Matomo", domain: "stats.erpvala.com", status: "completed", pct: 100, eta: "12m ago" },
    { id: "JOB-2036", app: "Static Site", domain: "docs.erpvala.io", status: "completed", pct: 100, eta: "1h ago" },
    { id: "JOB-2035", app: "Ghost", domain: "press.erpvala.com", status: "completed", pct: 100, eta: "yesterday" },
  ];

  const cols: { key: Status; label: string }[] = [
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
              <Button size="sm" className="w-full h-7 text-xs">Install</Button>
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
                      {j.status !== "queued" && <Progress value={j.pct} className="h-1.5" />}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{j.status === "installing" ? `${j.pct}%` : j.status === "completed" ? "Done" : "Pending"}</span>
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
    </>
  );
}

function SecuritySection() {
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
          <CardContent className="space-y-2 text-sm">
            {[
              ["Allow", "TCP 22", "Admin IPs"],
              ["Allow", "TCP 80,443", "Any"],
              ["Allow", "TCP 5432", "10.0.0.0/24"],
              ["Deny", "ALL", "Any"],
            ].map(([a, p, src], i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <Badge variant={a === "Allow" ? "default" : "destructive"}>{a}</Badge>
                <span className="font-mono">{p}</span>
                <span className="text-muted-foreground">{src}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ToolsSection() {
  const items = [
    "PHP Settings", "Web Server Settings", "Cron Jobs", "Scheduled Tasks",
    "IP Banning", "Mail Settings", "DNS Template", "Server Restart",
  ];
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Tools & Settings</h2>
        <p className="text-sm text-muted-foreground">Server-wide configuration</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{i}</span>
            </CardContent>
          </Card>
        ))}
      </div>
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
  const users = [
    { user: "admin", role: "Owner", last: "now" },
    { user: "deploy", role: "Deployer", last: "2h ago" },
    { user: "ops-jane", role: "Operator", last: "yesterday" },
    { user: "dev-rahul", role: "Developer", last: "3d ago" },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users & Accounts</h2>
          <p className="text-sm text-muted-foreground">System users with panel access</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Add User</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user}>
                  <TableCell className="font-mono">{u.user}</TableCell>
                  <TableCell><Badge>{u.role}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.last}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost">Edit</Button>
                    <Button size="sm" variant="ghost">Suspend</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function LogsSection() {
  const logs = [
    { ts: "14:22:11", lvl: "INFO", src: "nginx", msg: "200 GET /api/items 12ms" },
    { ts: "14:22:09", lvl: "WARN", src: "postgres", msg: "slow query 1.4s on items_select" },
    { ts: "14:22:04", lvl: "INFO", src: "auth", msg: "user admin@test.com signed in" },
    { ts: "14:21:55", lvl: "ERROR", src: "postfix", msg: "delivery deferred to mx2.gmail.com" },
    { ts: "14:21:30", lvl: "INFO", src: "cron", msg: "backup job completed in 42s" },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Logs & Monitoring</h2>
          <p className="text-sm text-muted-foreground">Live tail of system events</p>
        </div>
        <Button variant="outline">Download</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="bg-muted/40 font-mono text-xs">
            {logs.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border last:border-0">
                <span className="col-span-2 text-muted-foreground">{l.ts}</span>
                <span className="col-span-1">
                  <Badge
                    variant={l.lvl === "ERROR" ? "destructive" : l.lvl === "WARN" ? "secondary" : "default"}
                    className="text-[10px]"
                  >
                    {l.lvl}
                  </Badge>
                </span>
                <span className="col-span-2 text-secondary">{l.src}</span>
                <span className="col-span-7">{l.msg}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
