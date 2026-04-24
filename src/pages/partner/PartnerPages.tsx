import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";

export const PartnerDashboard = () => (
  <PlaceholderDashboard
    title="Partner Home"
    description="Pipeline, commissions, and partnership health at a glance."
    comingSoon={["Active deals pipeline", "Commission balance", "Partner-tier status"]}
  />
);

export const PartnerReseller = () => (
  <PlaceholderDashboard
    title="Reseller"
    description="Manage reseller accounts, quotes, and renewals."
    comingSoon={["Customer roster", "Quote builder", "Renewal calendar"]}
  />
);

export const PartnerAffiliate = () => (
  <PlaceholderDashboard
    title="Affiliate"
    description="Track referrals, links, and payout history."
    comingSoon={["Referral link generator", "Click & conversion stats", "Payout history"]}
  />
);

export const PartnerAdmin = () => (
  <PlaceholderDashboard
    title="Partner Admin"
    description="Module administration: tiers, commissions, fraud."
    comingSoon={["Tier configuration", "Commission rules", "Fraud monitoring"]}
  />
);
