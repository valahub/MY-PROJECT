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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  FolderKanban,
  Filter,
  LayoutDashboard,
  ListChecks,
  Columns3,
  ListOrdered,
  BarChart3,
  Search,
  Plus,
  Bell,
  UserCircle2,
  MessageSquare,
  Paperclip,
  Calendar,
  Flag,
  ChevronRight,
  GanttChart,
  Layers,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SectionKey =
  | "your-work"
  | "projects"
  | "filters"
  | "dashboards"
  | "issues"
  | "boards"
  | "backlog"
  | "reports"
  | "timeline";

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "your-work", label: "Your work", icon: Briefcase },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "filters", label: "Filters", icon: Filter },
  { key: "dashboards", label: "Dashboards", icon: LayoutDashboard },
  { key: "issues", label: "Issues", icon: ListChecks },
  { key: "boards", label: "Boards", icon: Columns3 },
  { key: "backlog", label: "Backlog", icon: ListOrdered },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

type Issue = {
  id: string;
  title: string;
  status: "todo" | "inprogress" | "done";
  type: "Story" | "Task" | "Bug";
  priority: "Low" | "Medium" | "High";
  assignee: string;
  points: number;
};

const SEED_ISSUES: Issue[] = [
  { id: "ERP-101", title: "Wire checkout to payment gateway", status: "todo", type: "Story", priority: "High", assignee: "RA", points: 5 },
  { id: "ERP-102", title: "Author upload form validation", status: "todo", type: "Task", priority: "Medium", assignee: "JS", points: 3 },
  { id: "ERP-103", title: "Admin approval queue filters", status: "inprogress", type: "Story", priority: "High", assignee: "MK", points: 8 },
  { id: "ERP-104", title: "Fix cart total rounding", status: "inprogress", type: "Bug", priority: "High", assignee: "RA", points: 2 },
  { id: "ERP-105", title: "Add SSL renewal cron", status: "done", type: "Task", priority: "Low", assignee: "DV", points: 1 },
  { id: "ERP-106", title: "License key generation flow", status: "done", type: "Story", priority: "High", assignee: "JS", points: 8 },
  { id: "ERP-107", title: "Sentry integration", status: "todo", type: "Task", priority: "Low", assignee: "MK", points: 2 },
  { id: "ERP-108", title: "Webhook retry exponential backoff", status: "inprogress", type: "Bug", priority: "Medium", assignee: "DV", points: 5 },
];

export default function AdminDevelopmentPage() {
  const [section, setSection] = useState<SectionKey>("boards");
  const [openIssue, setOpenIssue] = useState<Issue | null>(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Inner Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-12 flex items-center gap-2 px-4 border-b border-border">
          <FolderKanban className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Development</span>
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
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left transition-colors",
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
        <div className="p-3 border-t border-border">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Recent</p>
          <div className="space-y-1 text-sm">
            <div className="px-2 py-1 rounded hover:bg-muted cursor-pointer">ERPVala Core</div>
            <div className="px-2 py-1 rounded hover:bg-muted cursor-pointer">Marketplace</div>
            <div className="px-2 py-1 rounded hover:bg-muted cursor-pointer">Billing</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 border-b border-border flex items-center gap-3 px-4 bg-card">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search issues, projects…" className="h-8 pl-8 text-sm" />
            </div>
          </div>
          <Button size="sm" className="h-8"><Plus className="h-4 w-4 mr-1" /> Create</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Bell className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><UserCircle2 className="h-5 w-5" /></Button>
        </header>

        {/* Breadcrumb */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-1 text-sm text-muted-foreground">
          <span>Projects</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>ERPVala Core</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium capitalize">{section.replace("-", " ")}</span>
        </div>

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {section === "your-work" && <YourWorkSection onOpen={setOpenIssue} />}
          {section === "projects" && <ProjectsSection />}
          {section === "filters" && <FiltersSection />}
          {section === "dashboards" && <DashboardsSection />}
          {section === "issues" && <IssuesSection onOpen={setOpenIssue} />}
          {section === "boards" && <BoardSection onOpen={setOpenIssue} />}
          {section === "backlog" && <BacklogSection onOpen={setOpenIssue} />}
          {section === "reports" && <ReportsSection />}
        </main>
      </div>

      <IssueDialog issue={openIssue} onClose={() => setOpenIssue(null)} />
    </div>
  );
}

/* ───────────── Reusable bits ───────────── */

function PriorityIcon({ priority }: { priority: Issue["priority"] }) {
  const color =
    priority === "High" ? "text-primary" : priority === "Medium" ? "text-accent" : "text-muted-foreground";
  return <Flag className={cn("h-3.5 w-3.5", color)} />;
}

function TypeBadge({ type }: { type: Issue["type"] }) {
  const map = {
    Story: "bg-success/20 text-success-foreground",
    Task: "bg-secondary/20 text-secondary",
    Bug: "bg-primary/20 text-primary",
  };
  return <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", map[type])}>{type}</span>;
}

function IssueCard({ issue, onOpen }: { issue: Issue; onOpen: (i: Issue) => void }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpen(issue)}
    >
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium leading-snug">{issue.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeBadge type={issue.type} />
            <span className="text-[11px] text-muted-foreground font-mono">{issue.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <PriorityIcon priority={issue.priority} />
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{issue.points}</Badge>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">{issue.assignee}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────── Sections ───────────── */

function BoardSection({ onOpen }: { onOpen: (i: Issue) => void }) {
  const cols: { key: Issue["status"]; label: string }[] = [
    { key: "todo", label: "To Do" },
    { key: "inprogress", label: "In Progress" },
    { key: "done", label: "Done" },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprint Board · ERP Sprint 14</h2>
          <p className="text-sm text-muted-foreground">8 issues · 34 points · 6 days remaining</p>
        </div>
        <div className="flex items-center -space-x-2">
          {["RA", "JS", "MK", "DV"].map((u) => (
            <Avatar key={u} className="h-7 w-7 border-2 border-background">
              <AvatarFallback className="text-[10px]">{u}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cols.map((c) => {
          const items = SEED_ISSUES.filter((i) => i.status === c.key);
          return (
            <div key={c.key} className="bg-muted/40 rounded-lg p-3 space-y-3 min-h-[400px]">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider">{c.label}</span>
                <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
              </div>
              {items.map((i) => (
                <IssueCard key={i.id} issue={i} onOpen={onOpen} />
              ))}
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                <Plus className="h-3.5 w-3.5 mr-1" /> Create
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BacklogSection({ onOpen }: { onOpen: (i: Issue) => void }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backlog</h2>
          <p className="text-sm text-muted-foreground">Plan upcoming sprints</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Create Issue</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ERP Sprint 14 · Active</CardTitle>
          <CardDescription>6 days remaining · 34 points</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {SEED_ISSUES.slice(0, 4).map((i) => (
            <BacklogRow key={i.id} issue={i} onOpen={onOpen} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backlog · 12 issues</CardTitle>
          <CardDescription>Unassigned to a sprint</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {SEED_ISSUES.slice(4).concat(SEED_ISSUES.slice(0, 2)).map((i, idx) => (
            <BacklogRow key={`${i.id}-${idx}`} issue={i} onOpen={onOpen} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function BacklogRow({ issue, onOpen }: { issue: Issue; onOpen: (i: Issue) => void }) {
  return (
    <div
      onClick={() => onOpen(issue)}
      className="flex items-center gap-3 px-4 py-2 border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer text-sm"
    >
      <TypeBadge type={issue.type} />
      <span className="font-mono text-xs text-muted-foreground w-20">{issue.id}</span>
      <span className="flex-1 truncate">{issue.title}</span>
      <PriorityIcon priority={issue.priority} />
      <Badge variant="secondary" className="text-[10px]">{issue.points}</Badge>
      <Badge variant="outline" className="text-[10px] capitalize">{issue.status === "inprogress" ? "in progress" : issue.status}</Badge>
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-[10px]">{issue.assignee}</AvatarFallback>
      </Avatar>
    </div>
  );
}

function YourWorkSection({ onOpen }: { onOpen: (i: Issue) => void }) {
  const mine = SEED_ISSUES.filter((i) => ["RA", "JS"].includes(i.assignee));
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Your work</h2>
        <p className="text-sm text-muted-foreground">Issues assigned to you across projects</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Assigned</p><p className="text-2xl font-bold">{mine.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold">{mine.filter(i=>i.status==="inprogress").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Story Points</p><p className="text-2xl font-bold">{mine.reduce((s,i)=>s+i.points,0)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Worked on recently</CardTitle></CardHeader>
        <CardContent className="p-0">
          {mine.map((i) => <BacklogRow key={i.id} issue={i} onOpen={onOpen} />)}
        </CardContent>
      </Card>
    </>
  );
}

function ProjectsSection() {
  const projects = [
    { key: "ERP", name: "ERPVala Core", lead: "RA", issues: 142 },
    { key: "MKT", name: "Marketplace", lead: "JS", issues: 87 },
    { key: "BIL", name: "Billing", lead: "MK", issues: 54 },
    { key: "OPS", name: "DevOps", lead: "DV", issues: 31 },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-sm text-muted-foreground">All software projects</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Create Project</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((p) => (
          <Card key={p.key}>
            <CardContent className="p-4 space-y-2">
              <div className="h-10 w-10 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                {p.key}
              </div>
              <div className="font-medium">{p.name}</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.issues} issues</span>
                <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]">{p.lead}</AvatarFallback></Avatar>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function FiltersSection() {
  const filters = [
    "My open issues", "Reported by me", "All issues", "Done in last 7 days",
    "High priority bugs", "Unassigned", "Updated recently",
  ];
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Filters</h2>
        <p className="text-sm text-muted-foreground">Saved JQL-style filters</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {filters.map((f) => (
            <div key={f} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer">
              <span className="text-sm">{f}</span>
              <Button size="sm" variant="ghost">Open</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function DashboardsSection() {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Dashboards</h2>
        <p className="text-sm text-muted-foreground">Project gadgets and widgets</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Sprint Health", "Velocity", "Burndown", "Issue Statistics", "Created vs Resolved", "Workload"].map((g) => (
          <Card key={g}>
            <CardHeader><CardTitle className="text-base">{g}</CardTitle></CardHeader>
            <CardContent className="h-40 flex items-end gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-secondary/40 rounded-sm"
                  style={{ height: `${20 + ((i * 37) % 80)}%` }}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function IssuesSection({ onOpen }: { onOpen: (i: Issue) => void }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Issues</h2>
          <p className="text-sm text-muted-foreground">All issues across ERPVala Core</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Create</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {SEED_ISSUES.map((i) => <BacklogRow key={i.id} issue={i} onOpen={onOpen} />)}
        </CardContent>
      </Card>
    </>
  );
}

function ReportsSection() {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-sm text-muted-foreground">Sprint and team performance</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Burndown · Sprint 14</CardTitle></CardHeader>
          <CardContent className="h-56 flex items-end gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex-1 bg-primary/30 rounded-sm" style={{ height: `${100 - i * 6}%` }} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Velocity (last 5 sprints)</CardTitle></CardHeader>
          <CardContent className="h-56 flex items-end gap-3">
            {[28, 32, 30, 36, 34].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-secondary rounded-t-md" style={{ height: `${v * 4}px` }} />
                <span className="text-[10px] text-muted-foreground">S{10 + i}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Cumulative Flow</CardTitle></CardHeader>
          <CardContent className="h-48 flex items-end gap-0.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5">
                <div className="bg-success/60 rounded-sm" style={{ height: `${10 + i}px` }} />
                <div className="bg-accent/60 rounded-sm" style={{ height: `${30 - i / 2}px` }} />
                <div className="bg-primary/60 rounded-sm" style={{ height: `${20 + (i % 7) * 2}px` }} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ───────────── Issue dialog ───────────── */

function IssueDialog({ issue, onClose }: { issue: Issue | null; onClose: () => void }) {
  return (
    <Dialog open={!!issue} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {issue && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderKanban className="h-3.5 w-3.5" />
                ERPVala Core
                <ChevronRight className="h-3 w-3" />
                <span className="font-mono">{issue.id}</span>
              </div>
              <DialogTitle className="text-xl">{issue.title}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Implement the end-to-end flow with proper validation, error handling and observability.
                    Acceptance criteria are listed in the linked spec.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Activity</h3>
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">RA</AvatarFallback></Avatar>
                    <Textarea placeholder="Add a comment…" className="flex-1 min-h-[70px]" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { who: "JS", when: "2h ago", text: "Spec linked, ready for review." },
                      { who: "MK", when: "yesterday", text: "Blocked by ERP-103 — moving to in progress once unblocked." },
                    ].map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{c.who}</AvatarFallback></Avatar>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{c.who}</span> · {c.when}</div>
                          <p className="text-sm">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-sm space-y-3">
                  <Row k="Status"><Badge>{issue.status === "inprogress" ? "In Progress" : issue.status === "todo" ? "To Do" : "Done"}</Badge></Row>
                  <Separator />
                  <Row k="Assignee">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">{issue.assignee}</AvatarFallback></Avatar>
                      <span>{issue.assignee}</span>
                    </div>
                  </Row>
                  <Row k="Reporter">RA</Row>
                  <Row k="Priority"><div className="flex items-center gap-1"><PriorityIcon priority={issue.priority} /> {issue.priority}</div></Row>
                  <Row k="Type"><TypeBadge type={issue.type} /></Row>
                  <Row k="Story points"><Badge variant="secondary">{issue.points}</Badge></Row>
                  <Row k="Sprint">ERP Sprint 14</Row>
                  <Row k="Due"><div className="flex items-center gap-1 text-xs"><Calendar className="h-3.5 w-3.5" /> 2026-04-26</div></Row>
                  <Separator />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> 2</span>
                    <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> 1</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{k}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
