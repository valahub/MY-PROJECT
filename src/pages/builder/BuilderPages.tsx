import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";

export const BuilderDashboard = () => (
  <PlaceholderDashboard
    title="Builder Dashboard"
    description="Your projects, recent generations, and deployment status."
    comingSoon={["Project grid", "Recent prompts", "Deployment health"]}
  />
);

export const BuilderCreate = () => (
  <PlaceholderDashboard
    title="Create Project"
    description="Spin up a new app from a template or a single prompt."
    comingSoon={["Template gallery", "Prompt-to-app wizard", "Starter stack picker"]}
  />
);

export const BuilderPrompt = () => (
  <PlaceholderDashboard
    title="Prompt Builder"
    description="Compose, version, and refine the prompts that drive generation."
    comingSoon={["Prompt editor", "Version diff viewer", "Test runner"]}
  />
);

export const BuilderPreview = () => (
  <PlaceholderDashboard
    title="Live Preview"
    description="See generated UI updates in real time as the AI builds."
    comingSoon={["Hot-reload preview frame", "Device size switcher", "Console pane"]}
  />
);

export const BuilderComponents = () => (
  <PlaceholderDashboard
    title="Components"
    description="Library of reusable, AI-generated components."
    comingSoon={["Component palette", "Variant editor", "Code export"]}
  />
);

export const BuilderPages = () => (
  <PlaceholderDashboard
    title="Pages / Routes"
    description="Manage the routing tree of the generated app."
    comingSoon={["Route tree editor", "Per-route guard config", "404 fallback picker"]}
  />
);

export const BuilderLayoutManager = () => (
  <PlaceholderDashboard
    title="Layout Manager"
    description="Configure shells, sidebars, and theme tokens."
    comingSoon={["Layout templates", "Theme token editor", "Sidebar builder"]}
  />
);

export const BuilderAssistant = () => (
  <PlaceholderDashboard
    title="AI Assistant"
    description="Conversational helper for refactoring and feature scaffolding."
    comingSoon={["Chat thread", "Inline file diffs", "Action suggestions"]}
  />
);

export const BuilderExport = () => (
  <PlaceholderDashboard
    title="Export / Deploy"
    description="Export source or deploy to a connected target."
    comingSoon={["Source bundle download", "Connect Vercel/Netlify", "Deploy history"]}
  />
);

export const BuilderAdmin = () => (
  <PlaceholderDashboard
    title="Builder Admin"
    description="Module administration: quotas, model config, audit."
    comingSoon={["Quota & cost controls", "Model selection", "Audit log"]}
  />
);
