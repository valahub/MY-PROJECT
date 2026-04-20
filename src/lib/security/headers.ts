export const secureHeadMeta = [
  {
    httpEquiv: "Content-Security-Policy",
    content:
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
  { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
  { httpEquiv: "Referrer-Policy", content: "strict-origin-when-cross-origin" },
  { httpEquiv: "X-Frame-Options", content: "DENY" },
  {
    httpEquiv: "Permissions-Policy",
    content: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];
