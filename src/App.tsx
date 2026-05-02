import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AdminAiassistPage from "./pages_uploaded/admin__ai-assist";
import AdminApilogsPage from "./pages_uploaded/admin__api-logs";
import AdminApiselftestPage from "./pages_uploaded/admin__api-self-test";
import AdminAuditlogsPage from "./pages_uploaded/admin__audit-logs";
import AdminAutorollbackPage from "./pages_uploaded/admin__auto-rollback";
import AdminBackupPage from "./pages_uploaded/admin__backup";
import AdminBisyncPage from "./pages_uploaded/admin__bi-sync";
import AdminBillingPage from "./pages_uploaded/admin__billing";
import AdminBusinesslogicPage from "./pages_uploaded/admin__business-logic";
import AdminCdnedgePage from "./pages_uploaded/admin__cdn-edge";
import AdminCircuitbreakersPage from "./pages_uploaded/admin__circuit-breakers";
import AdminCompliancePage from "./pages_uploaded/admin__compliance";
import AdminConfigsyncPage from "./pages_uploaded/admin__config-sync";
import AdminConsistencyPage from "./pages_uploaded/admin__consistency";
import AdminCostgovernorPage from "./pages_uploaded/admin__cost-governor";
import AdminCostoptimizationPage from "./pages_uploaded/admin__cost-optimization";
import AdminCurrencyPage from "./pages_uploaded/admin__currency";
import AdminCustomersPage from "./pages_uploaded/admin__customers";
import AdminDashboardPage from "./pages_uploaded/admin__dashboard";
import AdminDataguardianPage from "./pages_uploaded/admin__data-guardian";
import AdminDependencywatcherPage from "./pages_uploaded/admin__dependency-watcher";
import AdminDeploymentsPage from "./pages_uploaded/admin__deployments";
import AdminDigitaltwinPage from "./pages_uploaded/admin__digital-twin";
import AdminDocumentsPage from "./pages_uploaded/admin__documents";
import AdminDunningPage from "./pages_uploaded/admin__dunning";
import AdminEntitlementsPage from "./pages_uploaded/admin__entitlements";
import AdminEventbusPage from "./pages_uploaded/admin__event-bus";
import AdminFeatureflagsPage from "./pages_uploaded/admin__feature-flags";
import AdminFraudmlPage from "./pages_uploaded/admin__fraud-ml";
import AdminFraudPage from "./pages_uploaded/admin__fraud";
import AdminGatewaysPage from "./pages_uploaded/admin__gateways";
import AdminImpersonationPage from "./pages_uploaded/admin__impersonation";
import AdminIntegrationsPage from "./pages_uploaded/admin__integrations";
import AdminLicensesPage from "./pages_uploaded/admin__licenses";
import AdminLoadpredictionPage from "./pages_uploaded/admin__load-prediction";
import AdminMarketplaceAuthorsPage from "./pages_uploaded/admin__marketplace__authors";
import AdminMarketplaceCategoriesPage from "./pages_uploaded/admin__marketplace__categories";
import AdminMarketplaceCollectionsPage from "./pages_uploaded/admin__marketplace__collections";
import AdminMarketplaceFeaturedPage from "./pages_uploaded/admin__marketplace__featured";
import AdminMarketplaceFlagsPage from "./pages_uploaded/admin__marketplace__flags";
import AdminMarketplacePage from "./pages_uploaded/admin__marketplace__index";
import AdminMarketplaceItemsPage from "./pages_uploaded/admin__marketplace__items";
import AdminMarketplaceLevelsPage from "./pages_uploaded/admin__marketplace__levels";
import AdminMarketplacePayoutsPage from "./pages_uploaded/admin__marketplace__payouts";
import AdminMarketplaceQueuePage from "./pages_uploaded/admin__marketplace__queue";
import AdminMarketplaceRefundsPage from "./pages_uploaded/admin__marketplace__refunds";
import AdminMarketplaceReportsPage from "./pages_uploaded/admin__marketplace__reports";
import AdminMarketplaceSalesreportsPage from "./pages_uploaded/admin__marketplace__sales-reports";
import AdminMarketplaceSettingsPage from "./pages_uploaded/admin__marketplace__settings";
import AdminMarketplaceTakedownsPage from "./pages_uploaded/admin__marketplace__takedowns";
import AdminMarketplaceTaxrulesPage from "./pages_uploaded/admin__marketplace__tax-rules";
import AdminMemoryrecoveryPage from "./pages_uploaded/admin__memory-recovery";
import AdminMerchantsPage from "./pages_uploaded/admin__merchants";
import AdminNotificationsPage from "./pages_uploaded/admin__notifications";
import AdminObservabilityPage from "./pages_uploaded/admin__observability";
import AdminPaymentsgodmodePage from "./pages_uploaded/admin__payments-god-mode";
import AdminPolicyenginePage from "./pages_uploaded/admin__policy-engine";
import AdminProductsPage from "./pages_uploaded/admin__products";
import AdminProrationPage from "./pages_uploaded/admin__proration";
import AdminRatelimitsPage from "./pages_uploaded/admin__rate-limits";
import AdminRecoverylogPage from "./pages_uploaded/admin__recovery-log";
import AdminRegionsyncPage from "./pages_uploaded/admin__region-sync";
import AdminRolesPage from "./pages_uploaded/admin__roles";
import AdminSchedulerPage from "./pages_uploaded/admin__scheduler";
import AdminSearchenginePage from "./pages_uploaded/admin__search-engine";
import AdminSecretsPage from "./pages_uploaded/admin__secrets";
import AdminServerPage from "./pages_uploaded/admin__server";
import AdminDevelopmentPage from "./pages_uploaded/admin__development";
import AdminServerDashboardPage from "./pages_uploaded/admin__server__dashboard";
import AdminServerManagementPage from "./pages_uploaded/admin__server__management";
import AdminDevelopmentDashboardPage from "./pages_uploaded/admin__development__dashboard";
import AdminDevelopmentManagementPage from "./pages_uploaded/admin__development__management";
import AdminSecurityPage from "./pages_uploaded/admin__security";
import AdminSettingsPage from "./pages_uploaded/admin__settings";
import AdminSlaPage from "./pages_uploaded/admin__sla";
import AdminSubscriptionsPage from "./pages_uploaded/admin__subscriptions";
import AdminSystemhealthPage from "./pages_uploaded/admin__system-health";
import AdminTaxPage from "./pages_uploaded/admin__tax";
import AdminTenantsPage from "./pages_uploaded/admin__tenants";
import AdminTransactionsPage from "./pages_uploaded/admin__transactions";
import AdminTrustscoresPage from "./pages_uploaded/admin__trust-scores";
import AdminPage from "./pages_uploaded/admin";
import AdminVersioningPage from "./pages_uploaded/admin__versioning";
import AdminWebhooksPage from "./pages_uploaded/admin__webhooks";
import AdminAuthObservabilityPage from "./pages_uploaded/admin__auth-observability";
import { AdminRouteGuard } from "./components/AdminRouteGuard";
import AdminUnknownRouteFallback from "./components/AdminUnknownRouteFallback";
import AuthLayoutReal from "./pages/auth/AuthLayout";
import LoginReal from "./pages/auth/Login";
import RegisterReal from "./pages/auth/Register";
import ForgotPasswordReal from "./pages/auth/ForgotPassword";
import ResetPasswordReal from "./pages/auth/ResetPassword";
import AuthVerifyemailPage from "./pages_uploaded/auth__verify-email";
import CheckoutPage from "./pages_uploaded/checkout";
import CustomerAccountPage from "./pages_uploaded/customer__account";
import CustomerDashboardPage from "./pages_uploaded/customer__dashboard";
import CustomerDownloadsPage from "./pages_uploaded/customer__downloads";
import CustomerInvoicesPage from "./pages_uploaded/customer__invoices";
import CustomerLicensesPage from "./pages_uploaded/customer__licenses";
import CustomerMarketplacedownloadsPage from "./pages_uploaded/customer__marketplace-downloads";
import CustomerPaymentmethodsPage from "./pages_uploaded/customer__payment-methods";
import CustomerPrivacyPage from "./pages_uploaded/customer__privacy";
import CustomerSecurityPage from "./pages_uploaded/customer__security";
import CustomerSubscriptionsPage from "./pages_uploaded/customer__subscriptions";
import CustomerPage from "./pages_uploaded/customer";
import RootPage from "./pages_uploaded/index";
import MarketplaceAuthorUsernamePage from "./pages_uploaded/marketplace__author__$username";
import MarketplaceAuthorAnalyticsPage from "./pages_uploaded/marketplace__author__analytics";
import MarketplaceAuthorBadgesPage from "./pages_uploaded/marketplace__author__badges";
import MarketplaceAuthorCommentsPage from "./pages_uploaded/marketplace__author__comments";
import MarketplaceAuthorDashboardPage from "./pages_uploaded/marketplace__author__dashboard";
import MarketplaceAuthorEarningsPage from "./pages_uploaded/marketplace__author__earnings";
import MarketplaceAuthorFollowersPage from "./pages_uploaded/marketplace__author__followers";
import MarketplaceAuthorPortfolioPage from "./pages_uploaded/marketplace__author__portfolio";
import MarketplaceAuthorRefundsPage from "./pages_uploaded/marketplace__author__refunds";
import MarketplaceAuthorReviewsPage from "./pages_uploaded/marketplace__author__reviews";
import MarketplaceAuthorSettingsPage from "./pages_uploaded/marketplace__author__settings";
import MarketplaceAuthorStatementsPage from "./pages_uploaded/marketplace__author__statements";
import MarketplaceAuthorPage from "./pages_uploaded/marketplace__author";
import MarketplaceAuthorUploadPage from "./pages_uploaded/marketplace__author__upload";
import MarketplaceAuthorWithdrawPage from "./pages_uploaded/marketplace__author__withdraw";
import MarketplaceAuthorsPage from "./pages_uploaded/marketplace__authors";
import MarketplaceBecomeauthorPage from "./pages_uploaded/marketplace__become-author";
import MarketplaceBlogPage from "./pages_uploaded/marketplace__blog";
import MarketplaceCartPage from "./pages_uploaded/marketplace__cart";
import MarketplaceCategorySlugPage from "./pages_uploaded/marketplace__category__$slug";
import MarketplaceCheckoutPage from "./pages_uploaded/marketplace__checkout";
import MarketplaceComparePage from "./pages_uploaded/marketplace__compare";
import MarketplaceForumsPage from "./pages_uploaded/marketplace__forums";
import MarketplacePage from "./pages_uploaded/marketplace__index";
import MarketplaceItemSlugPage from "./pages_uploaded/marketplace__item__$slug";
import MarketplacePreviewSlugPage from "./pages_uploaded/marketplace__preview__$slug";
import MarketplaceSearchPage from "./pages_uploaded/marketplace__search";
import MarketplacePage2 from "./pages_uploaded/marketplace";
import MarketplaceWishlistPage from "./pages_uploaded/marketplace__wishlist";
import CategoryPage from "./pages/marketplace/CategoryPage";
import SearchPage from "./pages/marketplace/SearchPage";
import CategoriesPage from "./pages/marketplace/CategoriesPage";
import HomePage from "./pages/marketplace/HomePage";
import BlogPage from "./pages/marketplace/BlogPage";
import BlogDetailPage from "./pages/marketplace/BlogDetailPage";
import ResellerSoftwarePage from "./pages/reseller/ResellerSoftwarePage";
import ResellerPluginsPage from "./pages/reseller/ResellerPluginsPage";
import FranchiseSoftwareBusinessPage from "./pages/franchise/FranchiseSoftwareBusinessPage";
import AuthorRoutes from "./pages/author/AuthorRoutes";
import MerchantAnalyticsPage from "./pages_uploaded/merchant__analytics";
import MerchantApiPage from "./pages_uploaded/merchant__api";
import MerchantCheckoutlinksPage from "./pages_uploaded/merchant__checkout-links";
import MerchantCustomersPage from "./pages_uploaded/merchant__customers";
import MerchantDashboardPage from "./pages_uploaded/merchant__dashboard";
import MerchantDiscountsCreatePage from "./pages_uploaded/merchant__discounts__create";
import MerchantDiscountsPage from "./pages_uploaded/merchant__discounts";
import MerchantDunningPage from "./pages_uploaded/merchant__dunning";
import MerchantEntitlementsPage from "./pages_uploaded/merchant__entitlements";
import MerchantFilesPage from "./pages_uploaded/merchant__files";
import MerchantInvoicesPage from "./pages_uploaded/merchant__invoices";
import MerchantLicensesPage from "./pages_uploaded/merchant__licenses";
import MerchantPricingCreatePage from "./pages_uploaded/merchant__pricing__create";
import MerchantPricingPage from "./pages_uploaded/merchant__pricing";
import MerchantProductsCreatePage from "./pages_uploaded/merchant__products__create";
import MerchantProductsPage from "./pages_uploaded/merchant__products";
import ProductDetailPage from "./pages_uploaded/product__$id";
import ProductAnalyticsPage from "./pages_uploaded/admin__products__$id__analytics";
import MerchantSettingsPage from "./pages_uploaded/merchant__settings";
import MerchantSubscriptionsPage from "./pages_uploaded/merchant__subscriptions";
import MerchantTransactionsPage from "./pages_uploaded/merchant__transactions";
import MerchantPage from "./pages_uploaded/merchant";
import MerchantWebhooksCreatePage from "./pages_uploaded/merchant__webhooks__create";
import MerchantWebhooksPage from "./pages_uploaded/merchant__webhooks";
import SupportCustomersPage from "./pages_uploaded/support__customers";
import SupportDashboardPage from "./pages_uploaded/support__dashboard";
import SupportEscalationsPage from "./pages_uploaded/support__escalations";
import SupportLogsPage from "./pages_uploaded/support__logs";
import SupportSearchPage from "./pages_uploaded/support__search";
import SupportSettingsPage from "./pages_uploaded/support__settings";
import SupportTicketsPage from "./pages_uploaded/support__tickets";
import SupportPage from "./pages_uploaded/support";
import InfluencerLayout from "./pages/influencer/InfluencerLayout";
import {
  InfluencerDashboard,
  InfluencerCampaigns,
  InfluencerContent,
  InfluencerAnalytics,
  InfluencerEarnings,
  InfluencerManager,
  InfluencerAdmin,
} from "./pages/influencer/InfluencerPages";
import BuilderLayout from "./pages/builder/BuilderLayout";
import {
  BuilderDashboard,
  BuilderCreate,
  BuilderPrompt,
  BuilderPreview,
  BuilderComponents,
  BuilderPages,
  BuilderLayoutManager,
  BuilderAssistant,
  BuilderExport,
  BuilderAdmin,
} from "./pages/builder/BuilderPages";
import PartnerLayout from "./pages/partner/PartnerLayout";
import {
  PartnerDashboard,
  PartnerReseller,
  PartnerAffiliate,
  PartnerAdmin,
} from "./pages/partner/PartnerPages";
import ChatLayout from "./pages/chat/ChatLayout";
import { ChatDashboard, ChatManager, ChatAdmin } from "./pages/chat/ChatPages";
import ProductivityLayout from "./pages/productivity/ProductivityLayout";
import {
  ProductivityDashboard,
  ProductivityManager,
  ProductivityAdmin,
} from "./pages/productivity/ProductivityPages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<RootPage />} />
          <Route element={<AdminRouteGuard />}>
          <Route path="/admin" element={<AdminPage />}>
              <Route path="ai-assist" element={<AdminAiassistPage />} />
              <Route path="auth-observability" element={<AdminAuthObservabilityPage />} />
              <Route path="api-logs" element={<AdminApilogsPage />} />
              <Route path="api-self-test" element={<AdminApiselftestPage />} />
              <Route path="audit-logs" element={<AdminAuditlogsPage />} />
              <Route path="auto-rollback" element={<AdminAutorollbackPage />} />
              <Route path="backup" element={<AdminBackupPage />} />
              <Route path="bi-sync" element={<AdminBisyncPage />} />
              <Route path="billing" element={<AdminBillingPage />} />
              <Route path="business-logic" element={<AdminBusinesslogicPage />} />
              <Route path="cdn-edge" element={<AdminCdnedgePage />} />
              <Route path="circuit-breakers" element={<AdminCircuitbreakersPage />} />
              <Route path="compliance" element={<AdminCompliancePage />} />
              <Route path="config-sync" element={<AdminConfigsyncPage />} />
              <Route path="consistency" element={<AdminConsistencyPage />} />
              <Route path="cost-governor" element={<AdminCostgovernorPage />} />
              <Route path="cost-optimization" element={<AdminCostoptimizationPage />} />
              <Route path="currency" element={<AdminCurrencyPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="data-guardian" element={<AdminDataguardianPage />} />
              <Route path="dependency-watcher" element={<AdminDependencywatcherPage />} />
              <Route path="deployments" element={<AdminDeploymentsPage />} />
              <Route path="digital-twin" element={<AdminDigitaltwinPage />} />
              <Route path="documents" element={<AdminDocumentsPage />} />
              <Route path="dunning" element={<AdminDunningPage />} />
              <Route path="entitlements" element={<AdminEntitlementsPage />} />
              <Route path="event-bus" element={<AdminEventbusPage />} />
              <Route path="feature-flags" element={<AdminFeatureflagsPage />} />
              <Route path="fraud-ml" element={<AdminFraudmlPage />} />
              <Route path="fraud" element={<AdminFraudPage />} />
              <Route path="gateways" element={<AdminGatewaysPage />} />
              <Route path="impersonation" element={<AdminImpersonationPage />} />
              <Route path="integrations" element={<AdminIntegrationsPage />} />
              <Route path="licenses" element={<AdminLicensesPage />} />
              <Route path="load-prediction" element={<AdminLoadpredictionPage />} />
              <Route path="marketplace/authors" element={<AdminMarketplaceAuthorsPage />} />
              <Route path="marketplace/categories" element={<AdminMarketplaceCategoriesPage />} />
              <Route path="marketplace/collections" element={<AdminMarketplaceCollectionsPage />} />
              <Route path="marketplace/featured" element={<AdminMarketplaceFeaturedPage />} />
              <Route path="marketplace/flags" element={<AdminMarketplaceFlagsPage />} />
              <Route path="marketplace" element={<AdminMarketplacePage />} />
              <Route path="marketplace/items" element={<AdminMarketplaceItemsPage />} />
              <Route path="marketplace/levels" element={<AdminMarketplaceLevelsPage />} />
              <Route path="marketplace/payouts" element={<AdminMarketplacePayoutsPage />} />
              <Route path="marketplace/queue" element={<AdminMarketplaceQueuePage />} />
              <Route path="marketplace/refunds" element={<AdminMarketplaceRefundsPage />} />
              <Route path="marketplace/reports" element={<AdminMarketplaceReportsPage />} />
              <Route path="marketplace/sales-reports" element={<AdminMarketplaceSalesreportsPage />} />
              <Route path="marketplace/settings" element={<AdminMarketplaceSettingsPage />} />
              <Route path="marketplace/takedowns" element={<AdminMarketplaceTakedownsPage />} />
              <Route path="marketplace/tax-rules" element={<AdminMarketplaceTaxrulesPage />} />
              <Route path="memory-recovery" element={<AdminMemoryrecoveryPage />} />
              <Route path="merchants" element={<AdminMerchantsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="observability" element={<AdminObservabilityPage />} />
              <Route path="payments-god-mode" element={<AdminPaymentsgodmodePage />} />
              <Route path="policy-engine" element={<AdminPolicyenginePage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/:id/analytics" element={<ProductAnalyticsPage />} />
              <Route path="proration" element={<AdminProrationPage />} />
              <Route path="rate-limits" element={<AdminRatelimitsPage />} />
              <Route path="recovery-log" element={<AdminRecoverylogPage />} />
              <Route path="region-sync" element={<AdminRegionsyncPage />} />
              <Route path="roles" element={<AdminRolesPage />} />
              <Route path="scheduler" element={<AdminSchedulerPage />} />
              <Route path="search-engine" element={<AdminSearchenginePage />} />
              <Route path="secrets" element={<AdminSecretsPage />} />
              <Route path="server" element={<AdminServerPage />} />
              <Route path="development" element={<AdminDevelopmentPage />} />
              <Route path="server/dashboard" element={<AdminServerDashboardPage />} />
              <Route path="server/management" element={<AdminServerManagementPage />} />
              <Route path="development/dashboard" element={<AdminDevelopmentDashboardPage />} />
              <Route path="development/management" element={<AdminDevelopmentManagementPage />} />
              <Route path="security" element={<AdminSecurityPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="sla" element={<AdminSlaPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="system-health" element={<AdminSystemhealthPage />} />
              <Route path="tax" element={<AdminTaxPage />} />
              <Route path="tenants" element={<AdminTenantsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="trust-scores" element={<AdminTrustscoresPage />} />
              <Route path="versioning" element={<AdminVersioningPage />} />
              <Route path="webhooks" element={<AdminWebhooksPage />} />
              <Route path="*" element={<AdminUnknownRouteFallback />} />
          </Route>
          </Route>
          <Route path="/auth" element={<AuthLayoutReal />}>
              <Route path="login" element={<LoginReal />} />
              <Route path="register" element={<RegisterReal />} />
              <Route path="forgot-password" element={<ForgotPasswordReal />} />
              <Route path="reset-password" element={<ResetPasswordReal />} />
              <Route path="verify-email" element={<AuthVerifyemailPage />} />
          </Route>
          <Route path="/customer" element={<CustomerPage />}>
              <Route path="account" element={<CustomerAccountPage />} />
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="downloads" element={<CustomerDownloadsPage />} />
              <Route path="invoices" element={<CustomerInvoicesPage />} />
              <Route path="licenses" element={<CustomerLicensesPage />} />
              <Route path="marketplace-downloads" element={<CustomerMarketplacedownloadsPage />} />
              <Route path="payment-methods" element={<CustomerPaymentmethodsPage />} />
              <Route path="privacy" element={<CustomerPrivacyPage />} />
              <Route path="security" element={<CustomerSecurityPage />} />
              <Route path="subscriptions" element={<CustomerSubscriptionsPage />} />
          </Route>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/marketplace" element={<HomePage />}>
              <Route index element={<MarketplacePage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="category/:slug" element={<MarketplaceCategorySlugPage />} />
              <Route path="search" element={<MarketplaceSearchPage />} />
              <Route path="blog" element={<MarketplaceBlogPage />} />
              <Route path="blog/:slug" element={<BlogDetailPage />} />
              <Route path="author/*" element={<AuthorRoutes />} />
              <Route path="authors" element={<MarketplaceAuthorsPage />} />
              <Route path="become-author" element={<MarketplaceBecomeauthorPage />} />
              <Route path="cart" element={<MarketplaceCartPage />} />
              <Route path="checkout" element={<MarketplaceCheckoutPage />} />
              <Route path="compare" element={<MarketplaceComparePage />} />
              <Route path="forums" element={<MarketplaceForumsPage />} />
              <Route path="forums/:slug" element={<MarketplaceForumsPage />} />
              <Route path="forums/:slug/:topicId" element={<MarketplaceForumsPage />} />
              <Route path="item/:slug" element={<MarketplaceItemSlugPage />} />
              <Route path="preview/:slug" element={<MarketplacePreviewSlugPage />} />
              <Route path="wishlist" element={<MarketplaceWishlistPage />} />
              <Route path="profile" element={<MarketplaceAuthorPage />} />
          </Route>
          <Route path="/reseller/software" element={<ResellerSoftwarePage />} />
          <Route path="/reseller/plugins" element={<ResellerPluginsPage />} />
          <Route path="/franchise/software-business" element={<FranchiseSoftwareBusinessPage />} />
          <Route path="/merchant" element={<MerchantPage />}>
              <Route path="analytics" element={<MerchantAnalyticsPage />} />
              <Route path="api" element={<MerchantApiPage />} />
              <Route path="checkout-links" element={<MerchantCheckoutlinksPage />} />
              <Route path="customers" element={<MerchantCustomersPage />} />
              <Route path="dashboard" element={<MerchantDashboardPage />} />
              <Route path="discounts/create" element={<MerchantDiscountsCreatePage />} />
              <Route path="discounts" element={<MerchantDiscountsPage />} />
              <Route path="dunning" element={<MerchantDunningPage />} />
              <Route path="entitlements" element={<MerchantEntitlementsPage />} />
              <Route path="files" element={<MerchantFilesPage />} />
              <Route path="invoices" element={<MerchantInvoicesPage />} />
              <Route path="licenses" element={<MerchantLicensesPage />} />
              <Route path="pricing/create" element={<MerchantPricingCreatePage />} />
              <Route path="pricing" element={<MerchantPricingPage />} />
              <Route path="products/create" element={<MerchantProductsCreatePage />} />
              <Route path="products" element={<MerchantProductsPage />} />
              <Route path="products/:id/edit" element={<MerchantProductsCreatePage />} />
              <Route path="settings" element={<MerchantSettingsPage />} />
              <Route path="subscriptions" element={<MerchantSubscriptionsPage />} />
              <Route path="transactions" element={<MerchantTransactionsPage />} />
              <Route path="webhooks/create" element={<MerchantWebhooksCreatePage />} />
              <Route path="webhooks" element={<MerchantWebhooksPage />} />
          </Route>
          <Route path="/support" element={<SupportPage />}>
              <Route path="customers" element={<SupportCustomersPage />} />
              <Route path="dashboard" element={<SupportDashboardPage />} />
              <Route path="escalations" element={<SupportEscalationsPage />} />
              <Route path="logs" element={<SupportLogsPage />} />
              <Route path="search" element={<SupportSearchPage />} />
              <Route path="settings" element={<SupportSettingsPage />} />
              <Route path="tickets" element={<SupportTicketsPage />} />
          </Route>
          <Route path="/influencer" element={<InfluencerLayout />}>
            <Route index element={<InfluencerDashboard />} />
            <Route path="dashboard" element={<InfluencerDashboard />} />
            <Route path="campaigns" element={<InfluencerCampaigns />} />
            <Route path="content" element={<InfluencerContent />} />
            <Route path="analytics" element={<InfluencerAnalytics />} />
            <Route path="earnings" element={<InfluencerEarnings />} />
            <Route path="manager" element={<InfluencerManager />} />
            <Route path="admin" element={<InfluencerAdmin />} />
          </Route>
          <Route path="/builder" element={<BuilderLayout />}>
            <Route index element={<BuilderDashboard />} />
            <Route path="dashboard" element={<BuilderDashboard />} />
            <Route path="create" element={<BuilderCreate />} />
            <Route path="prompt" element={<BuilderPrompt />} />
            <Route path="preview" element={<BuilderPreview />} />
            <Route path="components" element={<BuilderComponents />} />
            <Route path="pages" element={<BuilderPages />} />
            <Route path="layout" element={<BuilderLayoutManager />} />
            <Route path="assistant" element={<BuilderAssistant />} />
            <Route path="export" element={<BuilderExport />} />
            <Route path="admin" element={<BuilderAdmin />} />
          </Route>
          <Route path="/partner" element={<PartnerLayout />}>
            <Route index element={<PartnerDashboard />} />
            <Route path="dashboard" element={<PartnerDashboard />} />
            <Route path="reseller" element={<PartnerReseller />} />
            <Route path="affiliate" element={<PartnerAffiliate />} />
            <Route path="admin" element={<PartnerAdmin />} />
          </Route>
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<ChatDashboard />} />
            <Route path="dashboard" element={<ChatDashboard />} />
            <Route path="manager" element={<ChatManager />} />
            <Route path="admin" element={<ChatAdmin />} />
          </Route>
          <Route path="/productivity" element={<ProductivityLayout />}>
            <Route index element={<ProductivityDashboard />} />
            <Route path="dashboard" element={<ProductivityDashboard />} />
            <Route path="manager" element={<ProductivityManager />} />
            <Route path="admin" element={<ProductivityAdmin />} />
          </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
