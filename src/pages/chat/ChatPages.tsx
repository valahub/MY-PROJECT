import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";

export const ChatDashboard = () => (
  <PlaceholderDashboard
    title="Chat (User)"
    description="Your conversations, channels, and direct messages."
    comingSoon={["Channel list", "DM threads", "Unread badges"]}
  />
);

export const ChatManager = () => (
  <PlaceholderDashboard
    title="Chat Manager"
    description="Workspace administration: channels, members, retention."
    comingSoon={["Channel management", "Member roles", "Retention policies"]}
  />
);

export const ChatAdmin = () => (
  <PlaceholderDashboard
    title="Chat Admin"
    description="Module administration: compliance, exports, audit."
    comingSoon={["Compliance exports", "Global audit log", "Encryption settings"]}
  />
);
