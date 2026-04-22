export const siteConfig = {
  name: "Captain's Chair",
  description: "Built on Next.js 16, React 19, Tailwind v4",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    github: "https://github.com",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
  ],
} as const;
