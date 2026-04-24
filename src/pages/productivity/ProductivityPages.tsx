import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";

export const ProductivityDashboard = () => (
  <PlaceholderDashboard
    title="Productivity (User)"
    description="Tasks, calendar, and personal workspace."
    comingSoon={["Today's tasks", "Calendar view", "Notes & docs"]}
  />
);

export const ProductivityManager = () => (
  <PlaceholderDashboard
    title="Productivity Manager"
    description="Team workspaces, projects, and reporting."
    comingSoon={["Team boards", "Project timelines", "Capacity report"]}
  />
);

export const ProductivityAdmin = () => (
  <PlaceholderDashboard
    title="Productivity Admin"
    description="Module administration: integrations, retention, billing."
    comingSoon={["Integrations catalog", "Retention policies", "Seat billing"]}
  />
);
