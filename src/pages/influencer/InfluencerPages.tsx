import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";

export const InfluencerDashboard = () => (
  <PlaceholderDashboard
    title="Influencer Home"
    description="Your campaign performance, active deals, and earnings at a glance."
    comingSoon={[
      "Active campaign cards with deadlines",
      "Pending deliverables checklist",
      "Recent earnings summary",
    ]}
  />
);

export const InfluencerCampaigns = () => (
  <PlaceholderDashboard
    title="Campaigns"
    description="Browse open campaigns, apply, and track participation."
    comingSoon={["Campaign discovery feed", "Application status tracker", "Brief & contract viewer"]}
  />
);

export const InfluencerContent = () => (
  <PlaceholderDashboard
    title="Content / Posts"
    description="Upload, schedule, and submit deliverables for review."
    comingSoon={["Content uploader", "Scheduling calendar", "Submission status & feedback"]}
  />
);

export const InfluencerAnalytics = () => (
  <PlaceholderDashboard
    title="Analytics"
    description="Reach, engagement, and conversion metrics across campaigns."
    comingSoon={["Engagement charts", "Audience demographics", "Per-campaign ROI"]}
  />
);

export const InfluencerEarnings = () => (
  <PlaceholderDashboard
    title="Earnings / Payouts"
    description="Track invoices, payouts, and tax statements."
    comingSoon={["Payout history", "Pending balance", "Tax statement download"]}
  />
);

export const InfluencerManager = () => (
  <PlaceholderDashboard
    title="Influencer Manager"
    description="Campaign-manager workspace: roster, briefs, approvals."
    comingSoon={["Talent roster", "Brief builder", "Approval queue"]}
  />
);

export const InfluencerAdmin = () => (
  <PlaceholderDashboard
    title="Influencer Admin"
    description="Module-level administration: roles, payouts, fraud."
    comingSoon={["Role assignments", "Global payout controls", "Fraud & policy review"]}
  />
);
