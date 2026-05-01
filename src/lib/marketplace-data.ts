// Mock data for the marketplace (CodeCanyon-style)

export interface MarketItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  author: string;
  authorAvatar: string;
  price: number;
  rating: number;
  reviews: number;
  sales: number;
  thumbnail: string;
  tags: string[];
  lastUpdate: string;
  created: string;
  version: string;
  description: string;
  status: "live" | "pending" | "rejected" | "draft" | "soft_rejected";
}

const COVERS = [
  "linear-gradient(135deg,#EB0045,#0033A1)",
  "linear-gradient(135deg,#00A7E1,#2ED9C3)",
  "linear-gradient(135deg,#0033A1,#00A7E1)",
  "linear-gradient(135deg,#00205C,#EB0045)",
  "linear-gradient(135deg,#2ED9C3,#0033A1)",
  "linear-gradient(135deg,#EB0045,#00A7E1)",
  "linear-gradient(135deg,#00205C,#2ED9C3)",
  "linear-gradient(135deg,#0033A1,#EB0045)",
];

export function coverFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
}

export const ITEMS: MarketItem[] = [
  {
    id: "i1",
    slug: "novapress-saas-wordpress-theme",
    title: "NovaPress — SaaS & Startup WordPress Theme",
    category: "wordpress",
    subcategory: "Business",
    author: "PixelStack",
    authorAvatar: "PS",
    price: 59,
    rating: 4.8,
    reviews: 1240,
    sales: 12450,
    thumbnail: "",
    tags: ["wordpress", "saas", "startup", "elementor"],
    lastUpdate: "2024-12-10",
    created: "2022-04-12",
    version: "4.2.1",
    description: "Modern, fast, fully responsive SaaS theme for WordPress with Elementor builder.",
    status: "live",
  },
  {
    id: "i2",
    slug: "shopfast-react-ecommerce",
    title: "ShopFast — React eCommerce Template",
    category: "html-templates",
    subcategory: "Retail",
    author: "DevOrbit",
    authorAvatar: "DO",
    price: 29,
    rating: 4.7,
    reviews: 845,
    sales: 8230,
    thumbnail: "",
    tags: ["react", "ecommerce", "tailwind", "next.js"],
    lastUpdate: "2024-11-28",
    created: "2023-01-08",
    version: "2.5.0",
    description: "Production-ready React eCommerce template with cart, checkout and admin.",
    status: "live",
  },
  {
    id: "i3",
    slug: "bizpro-admin-dashboard",
    title: "BizPro — Admin Dashboard Kit",
    category: "html-templates",
    subcategory: "Admin",
    author: "ThemeNest",
    authorAvatar: "TN",
    price: 39,
    rating: 4.9,
    reviews: 2104,
    sales: 18920,
    thumbnail: "",
    tags: ["dashboard", "admin", "tailwind", "charts"],
    lastUpdate: "2024-12-01",
    created: "2021-11-22",
    version: "6.1.0",
    description: "60+ pages, dark mode, RTL support, and 12 chart variants included.",
    status: "live",
  },
  {
    id: "i4",
    slug: "laravel-crm-pro",
    title: "Laravel CRM Pro — Customer Management",
    category: "php-scripts",
    subcategory: "CRM",
    author: "CodeMatrix",
    authorAvatar: "CM",
    price: 49,
    rating: 4.6,
    reviews: 432,
    sales: 3210,
    thumbnail: "",
    tags: ["laravel", "crm", "php", "mysql"],
    lastUpdate: "2024-12-05",
    created: "2022-08-19",
    version: "3.0.0",
    description: "Full-featured CRM with leads, deals, pipelines, and email integration.",
    status: "live",
  },
  {
    id: "i5",
    slug: "flutter-food-delivery-app",
    title: "FoodGo — Flutter Food Delivery App",
    category: "mobile",
    subcategory: "Food",
    author: "AppForge",
    authorAvatar: "AF",
    price: 79,
    rating: 4.8,
    reviews: 612,
    sales: 4120,
    thumbnail: "",
    tags: ["flutter", "dart", "ios", "android"],
    lastUpdate: "2024-11-15",
    created: "2023-03-04",
    version: "5.2.1",
    description: "Complete food delivery solution: customer app, driver app, restaurant app.",
    status: "live",
  },
  {
    id: "i6",
    slug: "wp-booking-engine",
    title: "WP Booking Engine — Reservations Plugin",
    category: "wordpress",
    subcategory: "Plugins",
    author: "PixelStack",
    authorAvatar: "PS",
    price: 35,
    rating: 4.5,
    reviews: 298,
    sales: 2840,
    thumbnail: "",
    tags: ["wordpress", "booking", "calendar", "payment"],
    lastUpdate: "2024-10-30",
    created: "2023-06-15",
    version: "2.1.0",
    description: "Hotel, salon, restaurant booking plugin with WooCommerce integration.",
    status: "live",
  },
  {
    id: "i7",
    slug: "vue-pos-system",
    title: "Vue POS — Point of Sale System",
    category: "javascript",
    subcategory: "POS",
    author: "DevOrbit",
    authorAvatar: "DO",
    price: 45,
    rating: 4.7,
    reviews: 187,
    sales: 1640,
    thumbnail: "",
    tags: ["vue", "pos", "retail", "javascript"],
    lastUpdate: "2024-12-08",
    created: "2023-09-22",
    version: "1.8.0",
    description: "Modern POS system with inventory, receipts, and multi-store support.",
    status: "live",
  },
  {
    id: "i8",
    slug: "elementor-mega-addons",
    title: "Mega Addons for Elementor — 200+ Widgets",
    category: "wordpress",
    subcategory: "Plugins",
    author: "ThemeNest",
    authorAvatar: "TN",
    price: 29,
    rating: 4.9,
    reviews: 3420,
    sales: 24500,
    thumbnail: "",
    tags: ["elementor", "wordpress", "widgets"],
    lastUpdate: "2024-12-12",
    created: "2021-05-10",
    version: "8.0.2",
    description: "The largest collection of Elementor addons. Sliders, forms, animations and more.",
    status: "live",
  },
  {
    id: "i9",
    slug: "react-native-chat-app",
    title: "ChatRN — React Native Chat & Messenger",
    category: "mobile",
    subcategory: "Social",
    author: "AppForge",
    authorAvatar: "AF",
    price: 69,
    rating: 4.6,
    reviews: 245,
    sales: 1980,
    thumbnail: "",
    tags: ["react-native", "chat", "firebase"],
    lastUpdate: "2024-11-20",
    created: "2023-02-14",
    version: "3.4.0",
    description: "1-to-1, group chats, voice notes, file sharing, push notifications.",
    status: "live",
  },
  {
    id: "i10",
    slug: "django-saas-starter",
    title: "Django SaaS Starter Kit",
    category: "php-scripts",
    subcategory: "Starter",
    author: "CodeMatrix",
    authorAvatar: "CM",
    price: 55,
    rating: 4.7,
    reviews: 156,
    sales: 1240,
    thumbnail: "",
    tags: ["django", "python", "saas", "stripe"],
    lastUpdate: "2024-12-03",
    created: "2023-07-01",
    version: "2.0.0",
    description: "Production Django SaaS boilerplate with multi-tenancy and Stripe billing.",
    status: "live",
  },
  {
    id: "i11",
    slug: "tailwind-landing-bundle",
    title: "Landwind — 30 Tailwind Landing Pages",
    category: "html-templates",
    subcategory: "Landing",
    author: "ThemeNest",
    authorAvatar: "TN",
    price: 24,
    rating: 4.8,
    reviews: 1820,
    sales: 15600,
    thumbnail: "",
    tags: ["tailwind", "landing", "html"],
    lastUpdate: "2024-11-25",
    created: "2022-12-08",
    version: "4.5.0",
    description: "30 conversion-optimized landing pages built with Tailwind CSS.",
    status: "live",
  },
  {
    id: "i12",
    slug: "woocommerce-multivendor",
    title: "WC Multi-Vendor — Marketplace Plugin",
    category: "ecommerce",
    subcategory: "Marketplace",
    author: "PixelStack",
    authorAvatar: "PS",
    price: 89,
    rating: 4.5,
    reviews: 412,
    sales: 3890,
    thumbnail: "",
    tags: ["woocommerce", "multivendor", "wordpress"],
    lastUpdate: "2024-12-09",
    created: "2022-03-18",
    version: "5.1.0",
    description: "Turn your WooCommerce store into a multi-vendor marketplace.",
    status: "live",
  },
];

export const SUBMISSIONS: MarketItem[] = [
  {
    id: "s1",
    slug: "node-realtime-board",
    title: "TaskBoard Pro — Realtime Kanban (Node.js)",
    category: "php-scripts",
    subcategory: "Productivity",
    author: "NewDev99",
    authorAvatar: "ND",
    price: 32,
    rating: 0,
    reviews: 0,
    sales: 0,
    thumbnail: "",
    tags: ["node", "socket.io"],
    lastUpdate: "2024-12-14",
    created: "2024-12-14",
    version: "1.0.0",
    description: "Submitted for review.",
    status: "pending",
  },
  {
    id: "s2",
    slug: "swift-fitness-tracker",
    title: "FitTrack — Swift Fitness Tracker",
    category: "mobile",
    subcategory: "Health",
    author: "iOSGuru",
    authorAvatar: "IG",
    price: 45,
    rating: 0,
    reviews: 0,
    sales: 0,
    thumbnail: "",
    tags: ["swift", "ios", "healthkit"],
    lastUpdate: "2024-12-13",
    created: "2024-12-13",
    version: "1.0.0",
    description: "Pending review.",
    status: "pending",
  },
  {
    id: "s3",
    slug: "wp-newsletter-light",
    title: "Newsletter Light — WP Plugin",
    category: "wordpress",
    subcategory: "Plugins",
    author: "PluginLab",
    authorAvatar: "PL",
    price: 19,
    rating: 0,
    reviews: 0,
    sales: 0,
    thumbnail: "",
    tags: ["wordpress", "newsletter"],
    lastUpdate: "2024-12-12",
    created: "2024-12-12",
    version: "1.0.0",
    description: "Submitted; needs documentation.",
    status: "soft_rejected",
  },
  {
    id: "s4",
    slug: "react-charts-pack",
    title: "ChartPack — 40 React Charts",
    category: "javascript",
    subcategory: "UI",
    author: "VizMaster",
    authorAvatar: "VM",
    price: 29,
    rating: 0,
    reviews: 0,
    sales: 0,
    thumbnail: "",
    tags: ["react", "charts", "d3"],
    lastUpdate: "2024-12-11",
    created: "2024-12-11",
    version: "1.0.0",
    description: "Awaiting QA.",
    status: "pending",
  },
  {
    id: "s5",
    slug: "old-html-template",
    title: "Vintage HTML Template",
    category: "html-templates",
    subcategory: "Other",
    author: "OldTimer",
    authorAvatar: "OT",
    price: 12,
    rating: 0,
    reviews: 0,
    sales: 0,
    thumbnail: "",
    tags: ["html", "css"],
    lastUpdate: "2024-12-10",
    created: "2024-12-10",
    version: "1.0.0",
    description: "Rejected — does not meet quality standards.",
    status: "rejected",
  },
];

export const AUTHORS = [
  {
    id: "a1",
    username: "PixelStack",
    avatar: "PS",
    country: "United Kingdom",
    joined: "2018-03-12",
    items: 24,
    sales: 42180,
    rating: 4.7,
    earnings: 184500,
    level: "Elite Author",
    featured: true,
  },
  {
    id: "a2",
    username: "ThemeNest",
    avatar: "TN",
    country: "United States",
    joined: "2017-06-08",
    items: 38,
    sales: 89420,
    rating: 4.8,
    earnings: 312000,
    level: "Power Elite",
    featured: true,
  },
  {
    id: "a3",
    username: "DevOrbit",
    avatar: "DO",
    country: "Germany",
    joined: "2019-11-22",
    items: 16,
    sales: 18420,
    rating: 4.7,
    earnings: 98000,
    level: "Elite Author",
    featured: false,
  },
  {
    id: "a4",
    username: "CodeMatrix",
    avatar: "CM",
    country: "India",
    joined: "2020-02-14",
    items: 12,
    sales: 7240,
    rating: 4.6,
    earnings: 42500,
    level: "Author L4",
    featured: false,
  },
  {
    id: "a5",
    username: "AppForge",
    avatar: "AF",
    country: "Canada",
    joined: "2019-08-30",
    items: 9,
    sales: 9120,
    rating: 4.7,
    earnings: 78400,
    level: "Author L5",
    featured: true,
  },
  {
    id: "a6",
    username: "VizMaster",
    avatar: "VM",
    country: "Australia",
    joined: "2021-05-17",
    items: 6,
    sales: 2840,
    rating: 4.5,
    earnings: 18900,
    level: "Author L3",
    featured: false,
  },
];

// ── Deep category hierarchy: top → sub → nano → micro ─────────────────────
// `subs: string[]` kept for backward compatibility with existing consumers.
// New `tree` field provides the full 4-level hierarchy.
export interface NanoCategory {
  slug: string;
  title: string;
  micro?: string[];
}
export interface SubCategory {
  slug: string;
  title: string;
  count?: number;
  nano?: NanoCategory[];
}
export interface TopCategory {
  slug: string;
  title: string;
  count: number;
  subs: string[]; // legacy flat list
  tree?: SubCategory[]; // new deep hierarchy
  tagPool?: string[];
  compatibility?: string[];
}

export const CATEGORY_TREE: TopCategory[] = [
  {
    slug: "wordpress",
    title: "WordPress",
    count: 45230,
    subs: ["Themes", "Plugins", "Business", "Blog", "Portfolio", "eCommerce"],
    tagPool: ["elementor", "gutenberg", "woocommerce", "divi", "wpbakery", "saas", "blog"],
    compatibility: ["WP 6.5", "WP 6.4", "PHP 8.2", "PHP 8.1", "WooCommerce 9.x"],
    tree: [
      {
        slug: "themes",
        title: "Themes",
        count: 18420,
        nano: [
          { slug: "business", title: "Business", micro: ["SaaS", "Agency", "Startup", "Consulting", "Finance"] },
          { slug: "blog-magazine", title: "Blog / Magazine", micro: ["Personal", "News", "Lifestyle", "Tech"] },
          { slug: "portfolio", title: "Portfolio", micro: ["Photography", "Designer", "Creative", "Architecture"] },
          { slug: "ecommerce", title: "eCommerce", micro: ["Fashion", "Electronics", "Furniture", "Marketplace"] },
          { slug: "education", title: "Education", micro: ["LMS", "School", "Course", "University"] },
        ],
      },
      {
        slug: "plugins",
        title: "Plugins",
        count: 14820,
        nano: [
          { slug: "forms", title: "Forms", micro: ["Contact", "Survey", "Quiz", "Booking"] },
          { slug: "seo", title: "SEO", micro: ["Schema", "Sitemap", "Redirects", "Analytics"] },
          { slug: "performance", title: "Performance", micro: ["Cache", "Image Optimize", "CDN", "Lazy Load"] },
          { slug: "security", title: "Security", micro: ["Firewall", "2FA", "Backup", "Anti-spam"] },
          { slug: "marketing", title: "Marketing", micro: ["Email", "Popups", "CRM", "Affiliate"] },
        ],
      },
      {
        slug: "ecommerce",
        title: "WooCommerce",
        count: 6420,
        nano: [
          { slug: "payments", title: "Payments", micro: ["Stripe", "PayPal", "Razorpay", "COD"] },
          { slug: "shipping", title: "Shipping", micro: ["Table Rate", "FedEx", "Local Pickup", "Print Labels"] },
          { slug: "subscriptions", title: "Subscriptions", micro: ["Recurring", "Memberships", "Gifting"] },
        ],
      },
    ],
  },
  {
    slug: "html-templates",
    title: "HTML Templates",
    count: 12840,
    subs: ["Admin", "Landing", "Retail", "Corporate", "Portfolio"],
    tagPool: ["tailwind", "bootstrap", "html5", "scss", "alpine.js", "dark-mode"],
    compatibility: ["HTML5", "Bootstrap 5", "Tailwind 3.x", "Tailwind 4.x"],
    tree: [
      {
        slug: "admin",
        title: "Admin & Dashboard",
        count: 3120,
        nano: [
          { slug: "saas-admin", title: "SaaS Admin", micro: ["Analytics", "CRM", "Project Mgmt", "HR"] },
          { slug: "ecommerce-admin", title: "eCommerce Admin", micro: ["Inventory", "Orders", "POS"] },
          { slug: "developer-tools", title: "Developer Tools", micro: ["API Console", "DB Manager", "Logs"] },
        ],
      },
      {
        slug: "landing",
        title: "Landing Pages",
        count: 4280,
        nano: [
          { slug: "saas-landing", title: "SaaS / App", micro: ["Single", "Multi", "Mobile App", "Browser Ext"] },
          { slug: "agency-landing", title: "Agency", micro: ["Creative", "Marketing", "Studio"] },
          { slug: "event-landing", title: "Event", micro: ["Conference", "Webinar", "Wedding"] },
        ],
      },
      {
        slug: "corporate",
        title: "Corporate",
        count: 2840,
        nano: [
          { slug: "finance-corp", title: "Finance", micro: ["Bank", "Insurance", "Investment"] },
          { slug: "consulting-corp", title: "Consulting", micro: ["Legal", "Business", "Strategy"] },
        ],
      },
    ],
  },
  {
    slug: "ecommerce",
    title: "eCommerce",
    count: 8120,
    subs: ["Shopify", "WooCommerce", "Magento", "Marketplace"],
    tagPool: ["shopify", "magento", "opencart", "prestashop", "headless"],
    compatibility: ["Shopify 2.0", "Magento 2.4", "WooCommerce 9.x", "PrestaShop 8.x"],
    tree: [
      {
        slug: "shopify",
        title: "Shopify",
        count: 2980,
        nano: [
          { slug: "shopify-themes", title: "Themes", micro: ["Fashion", "Electronics", "Beauty", "Home"] },
          { slug: "shopify-apps", title: "Apps", micro: ["Upsell", "Reviews", "Loyalty", "Subscriptions"] },
        ],
      },
      {
        slug: "magento",
        title: "Magento",
        count: 1240,
        nano: [
          { slug: "magento-themes", title: "Themes", micro: ["Multi-vendor", "B2B", "Fashion"] },
          { slug: "magento-extensions", title: "Extensions", micro: ["Checkout", "SEO", "Marketing"] },
        ],
      },
      {
        slug: "marketplace",
        title: "Multi-Vendor",
        count: 980,
        nano: [
          { slug: "mv-platforms", title: "Platforms", micro: ["Digital Goods", "Services", "Physical"] },
        ],
      },
    ],
  },
  {
    slug: "php-scripts",
    title: "PHP Scripts",
    count: 9450,
    subs: ["CRM", "CMS", "Productivity", "Starter", "Forms"],
    tagPool: ["laravel", "symfony", "codeigniter", "php8", "mysql", "postgres", "redis"],
    compatibility: ["PHP 8.3", "PHP 8.2", "PHP 8.1", "MySQL 8.0", "MariaDB 10.6"],
    tree: [
      {
        slug: "crm",
        title: "CRM",
        count: 1820,
        nano: [
          { slug: "sales-crm", title: "Sales CRM", micro: ["Pipeline", "Lead Mgmt", "Quotes"] },
          { slug: "support-crm", title: "Support CRM", micro: ["Tickets", "Knowledge Base", "Chat"] },
        ],
      },
      {
        slug: "saas-starter",
        title: "SaaS Starter",
        count: 1240,
        nano: [
          { slug: "laravel-saas", title: "Laravel SaaS", micro: ["Multi-tenant", "Stripe", "Teams"] },
          { slug: "symfony-saas", title: "Symfony SaaS", micro: ["Multi-tenant", "API"] },
        ],
      },
      {
        slug: "productivity",
        title: "Productivity",
        count: 980,
        nano: [
          { slug: "project-mgmt", title: "Project Mgmt", micro: ["Kanban", "Gantt", "Time Tracking"] },
          { slug: "hr", title: "HR / Payroll", micro: ["Attendance", "Leave", "Payslips"] },
        ],
      },
    ],
  },
  {
    slug: "javascript",
    title: "JavaScript",
    count: 6230,
    subs: ["UI", "POS", "Charts", "Forms", "Tools"],
    tagPool: ["react", "vue", "angular", "svelte", "next.js", "nuxt", "typescript"],
    compatibility: ["Node 20.x", "Node 18.x", "React 18", "Vue 3", "Angular 17"],
    tree: [
      {
        slug: "ui",
        title: "UI Components",
        count: 1840,
        nano: [
          { slug: "react-ui", title: "React", micro: ["Tailwind", "shadcn", "Material", "Chakra"] },
          { slug: "vue-ui", title: "Vue", micro: ["Vuetify", "Quasar", "PrimeVue"] },
          { slug: "svelte-ui", title: "Svelte", micro: ["SvelteKit", "Skeleton"] },
        ],
      },
      {
        slug: "charts",
        title: "Charts & Viz",
        count: 740,
        nano: [
          { slug: "chart-libs", title: "Chart Libraries", micro: ["D3", "Chart.js", "Recharts", "ApexCharts"] },
        ],
      },
      {
        slug: "tools",
        title: "Dev Tools",
        count: 920,
        nano: [
          { slug: "build-tools", title: "Build", micro: ["Vite Plugins", "Webpack Loaders", "ESLint"] },
        ],
      },
    ],
  },
  {
    slug: "mobile",
    title: "Mobile",
    count: 4120,
    subs: ["Food", "Social", "Health", "Fitness", "Travel"],
    tagPool: ["flutter", "react-native", "swift", "kotlin", "ionic", "firebase"],
    compatibility: ["iOS 17+", "iOS 16+", "Android 14", "Android 13", "Flutter 3.x"],
    tree: [
      {
        slug: "ios",
        title: "iOS (Swift / SwiftUI)",
        count: 1240,
        nano: [
          { slug: "ios-social", title: "Social", micro: ["Chat", "Dating", "Community"] },
          { slug: "ios-health", title: "Health", micro: ["Fitness", "Meditation", "Tracker"] },
          { slug: "ios-utility", title: "Utility", micro: ["Notes", "Calendar", "Finance"] },
        ],
      },
      {
        slug: "android",
        title: "Android (Kotlin / Java)",
        count: 980,
        nano: [
          { slug: "android-ecommerce", title: "eCommerce", micro: ["Shop", "Food Delivery", "Grocery"] },
          { slug: "android-social", title: "Social", micro: ["Chat", "Video", "Forum"] },
        ],
      },
      {
        slug: "flutter",
        title: "Flutter",
        count: 1420,
        nano: [
          { slug: "flutter-templates", title: "Templates", micro: ["Multi-purpose", "eCommerce", "Booking"] },
        ],
      },
      {
        slug: "react-native",
        title: "React Native",
        count: 480,
        nano: [
          { slug: "rn-templates", title: "Templates", micro: ["Social", "Food", "Travel"] },
        ],
      },
    ],
  },
  {
    slug: "themes",
    title: "CMS Themes",
    count: 7890,
    subs: ["Drupal", "Joomla", "Ghost", "Concrete5"],
    tagPool: ["drupal", "joomla", "ghost", "concrete5", "responsive"],
    compatibility: ["Drupal 10", "Joomla 5", "Ghost 5", "Concrete 9"],
  },
  {
    slug: "plugins",
    title: "Plugins",
    count: 5430,
    subs: ["jQuery", "Vue", "React", "Angular"],
    tagPool: ["jquery", "vue3", "react18", "angular17"],
    compatibility: ["jQuery 3.x", "Vue 3", "React 18", "Angular 17"],
  },
  {
    slug: "graphics",
    title: "Graphics & UI Kits",
    count: 6840,
    subs: ["Icons", "Illustrations", "UI Kits", "Mockups", "Logos"],
    tagPool: ["figma", "sketch", "xd", "illustrator", "photoshop", "svg"],
    compatibility: ["Figma", "Sketch 99+", "Adobe XD", "Adobe CC 2024"],
    tree: [
      {
        slug: "icons",
        title: "Icon Sets",
        count: 1820,
        nano: [
          { slug: "line-icons", title: "Line Icons", micro: ["Outline", "Stroke", "Duotone"] },
          { slug: "filled-icons", title: "Filled Icons", micro: ["Solid", "Glyph"] },
        ],
      },
      {
        slug: "ui-kits",
        title: "UI Kits",
        count: 2140,
        nano: [
          { slug: "design-systems", title: "Design Systems", micro: ["Tailwind", "Material", "iOS", "Android"] },
        ],
      },
    ],
  },
  {
    slug: "audio",
    title: "Audio",
    count: 12480,
    subs: ["Music", "Sound Effects", "Loops", "Logos & Idents"],
    tagPool: ["royalty-free", "background", "cinematic", "corporate", "epic"],
  },
  {
    slug: "video",
    title: "Video",
    count: 8920,
    subs: ["Stock Footage", "Motion Graphics", "After Effects", "Premiere Pro"],
    tagPool: ["4k", "loop", "intro", "lower-thirds", "transitions"],
    compatibility: ["After Effects CC 2024", "Premiere Pro CC 2024", "DaVinci Resolve 19"],
  },
  {
    slug: "3d",
    title: "3D Files",
    count: 3240,
    subs: ["Models", "Materials", "Scenes", "Print Models"],
    tagPool: ["blender", "cinema4d", "maya", "unity", "unreal", "fbx", "obj", "gltf"],
    compatibility: ["Blender 4.x", "Cinema 4D R26", "Unity 2023", "Unreal 5.4"],
  },
];

// ── Tag pool aggregated from all categories (used by search/autosuggest) ──
export const ALL_TAGS: string[] = Array.from(
  new Set(CATEGORY_TREE.flatMap((c) => c.tagPool ?? [])),
).sort();

// ── Trending search terms (used by autosuggest) ──────────────────────────
export const TRENDING_SEARCHES: string[] = [
  "dashboard tailwind",
  "react saas starter",
  "wordpress elementor",
  "flutter ecommerce",
  "shopify theme",
  "ai chat app",
  "next.js boilerplate",
  "figma ui kit",
  "after effects intro",
  "laravel crm",
];

// ── Price buckets for filter sidebar ─────────────────────────────────────
export const PRICE_BUCKETS = [
  { label: "Free", min: 0, max: 0 },
  { label: "$1 – $20", min: 1, max: 20 },
  { label: "$21 – $50", min: 21, max: 50 },
  { label: "$51 – $100", min: 51, max: 100 },
  { label: "$100+", min: 101, max: 99999 },
];

// ── Rating buckets for filter sidebar ────────────────────────────────────
export const RATING_BUCKETS = [5, 4, 3, 2, 1];

// ── Sort options used across listing pages ───────────────────────────────
export const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "best-sellers", label: "Best Sellers" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "updated", label: "Recently Updated" },
];

// ── Extended item catalog (appended live items for richer listings) ──────
const EXTRA_ITEMS: MarketItem[] = [
  {
    id: "i13", slug: "shopify-fashion-theme", title: "Vogueify — Shopify Fashion Theme",
    category: "ecommerce", subcategory: "Shopify", author: "ThemeNest", authorAvatar: "TN",
    price: 79, rating: 4.8, reviews: 612, sales: 5430, thumbnail: "",
    tags: ["shopify", "fashion", "responsive"], lastUpdate: "2024-12-11", created: "2023-04-02",
    version: "3.1.0", description: "Premium Shopify 2.0 theme for fashion stores with lookbook & quick view.", status: "live",
  },
  {
    id: "i14", slug: "figma-saas-ui-kit", title: "Northwind — Figma SaaS UI Kit (1200+ components)",
    category: "graphics", subcategory: "UI Kits", author: "VizMaster", authorAvatar: "VM",
    price: 49, rating: 4.9, reviews: 980, sales: 7820, thumbnail: "",
    tags: ["figma", "saas", "design-system"], lastUpdate: "2024-12-09", created: "2023-08-15",
    version: "5.0.0", description: "Auto-layout components, dark/light, 24 ready-made flows.", status: "live",
  },
  {
    id: "i15", slug: "ae-cinematic-intro", title: "Cinematic Title Intro — After Effects",
    category: "video", subcategory: "After Effects", author: "AppForge", authorAvatar: "AF",
    price: 24, rating: 4.6, reviews: 312, sales: 2180, thumbnail: "",
    tags: ["after-effects", "intro", "cinematic", "4k"], lastUpdate: "2024-11-22", created: "2024-02-08",
    version: "1.4.0", description: "10s cinematic title intro, AE 2024+, 4K resolution, no plugins.", status: "live",
  },
  {
    id: "i16", slug: "swift-meditation-app", title: "Calmly — SwiftUI Meditation App",
    category: "mobile", subcategory: "Health", author: "iOSGuru", authorAvatar: "IG",
    price: 65, rating: 4.7, reviews: 198, sales: 1420, thumbnail: "",
    tags: ["swift", "swiftui", "ios", "health"], lastUpdate: "2024-12-04", created: "2023-11-19",
    version: "2.2.0", description: "Full meditation app with audio sessions, streaks, HealthKit sync.", status: "live",
  },
  {
    id: "i17", slug: "blender-product-pack", title: "Studio Pack — 40 Blender Product Scenes",
    category: "3d", subcategory: "Scenes", author: "PixelStack", authorAvatar: "PS",
    price: 35, rating: 4.5, reviews: 142, sales: 980, thumbnail: "",
    tags: ["blender", "product", "studio", "cycles"], lastUpdate: "2024-11-30", created: "2024-03-12",
    version: "1.2.0", description: "Pre-lit studio scenes for product renders, Cycles + Eevee ready.", status: "live",
  },
  {
    id: "i18", slug: "nextjs-blog-starter", title: "InkPress — Next.js MDX Blog Starter",
    category: "javascript", subcategory: "UI", author: "DevOrbit", authorAvatar: "DO",
    price: 19, rating: 4.7, reviews: 421, sales: 3210, thumbnail: "",
    tags: ["next.js", "mdx", "blog", "tailwind", "typescript"], lastUpdate: "2024-12-13", created: "2024-01-20",
    version: "2.3.0", description: "SEO-first MDX blog starter with RSS, sitemap, OG image generation.", status: "live",
  },
  {
    id: "i19", slug: "audio-corporate-pack", title: "Corporate Inspire — 12-Track Music Pack",
    category: "audio", subcategory: "Music", author: "VizMaster", authorAvatar: "VM",
    price: 22, rating: 4.6, reviews: 215, sales: 1840, thumbnail: "",
    tags: ["royalty-free", "corporate", "background"], lastUpdate: "2024-10-18", created: "2023-12-05",
    version: "1.0.0", description: "12 royalty-free corporate tracks, all stems & loops included.", status: "live",
  },
  {
    id: "i20", slug: "drupal-portfolio-theme", title: "Folium — Drupal Portfolio Theme",
    category: "themes", subcategory: "Drupal", author: "CodeMatrix", authorAvatar: "CM",
    price: 38, rating: 4.4, reviews: 88, sales: 540, thumbnail: "",
    tags: ["drupal", "portfolio", "responsive"], lastUpdate: "2024-11-14", created: "2024-04-08",
    version: "1.5.0", description: "Modern Drupal 10 portfolio theme with case-study templates.", status: "live",
  },
];

// Append to ITEMS array (kept as let-style mutation via spread for backward compat).
ITEMS.push(...EXTRA_ITEMS);

// ── Helpers: counts for nano/micro using existing ITEMS + tree ────────────
// Best-effort: matches by (sub.title === item.subcategory) and tag overlap for
// nano/micro. Falls back to tree.count or 0. Pure functions, no side effects.
export function countItemsForSub(topSlug: string, subTitle: string): number {
  return ITEMS.filter(
    (i) => i.category === topSlug && i.subcategory.toLowerCase() === subTitle.toLowerCase(),
  ).length;
}

export function countItemsForNano(topSlug: string, subTitle: string, nano: NanoCategory): number {
  const subItems = ITEMS.filter(
    (i) => i.category === topSlug && i.subcategory.toLowerCase() === subTitle.toLowerCase(),
  );
  const needle = nano.slug.replace(/-/g, " ").toLowerCase();
  const titleNeedle = nano.title.toLowerCase();
  return subItems.filter((i) =>
    i.tags.some(
      (t) => t.toLowerCase().includes(needle) || t.toLowerCase().includes(titleNeedle),
    ) ||
      i.title.toLowerCase().includes(titleNeedle) ||
      i.description.toLowerCase().includes(titleNeedle),
  ).length;
}

export function countItemsForMicro(topSlug: string, micro: string): number {
  const m = micro.toLowerCase();
  return ITEMS.filter(
    (i) =>
      i.category === topSlug &&
      (i.tags.some((t) => t.toLowerCase().includes(m)) ||
        i.title.toLowerCase().includes(m) ||
        i.description.toLowerCase().includes(m)),
  ).length;
}

// Resolve a category by slug, with backward-compat fallback to legacy `subs`.
export function resolveCategory(slug: string): TopCategory | undefined {
  return CATEGORY_TREE.find((c) => c.slug === slug);
}

// Flatten a category's tree to a list of {sub, nano?, micro?} for selectors.
export interface CategoryNode {
  sub: SubCategory;
  nano?: NanoCategory;
  micro?: string;
  count: number;
  path: string[]; // [subTitle, nanoTitle?, micro?]
}
export function flattenCategoryTree(top: TopCategory): CategoryNode[] {
  const out: CategoryNode[] = [];
  if (!top.tree) {
    // legacy: synthesize from subs
    top.subs.forEach((s) => {
      const sub: SubCategory = { slug: s.toLowerCase().replace(/\s+/g, "-"), title: s };
      out.push({ sub, count: countItemsForSub(top.slug, s), path: [s] });
    });
    return out;
  }
  top.tree.forEach((sub) => {
    out.push({
      sub,
      count: sub.count ?? countItemsForSub(top.slug, sub.title),
      path: [sub.title],
    });
    sub.nano?.forEach((nano) => {
      out.push({
        sub,
        nano,
        count: countItemsForNano(top.slug, sub.title, nano),
        path: [sub.title, nano.title],
      });
      nano.micro?.forEach((m) => {
        out.push({
          sub,
          nano,
          micro: m,
          count: countItemsForMicro(top.slug, m),
          path: [sub.title, nano.title, m],
        });
      });
    });
  });
  return out;
}


