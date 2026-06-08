import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SPA fallback: все маршруты кроме API, статики и _next
  // перенаправляются на главную страницу, где клиентский роутер работает
  async rewrites() {
    return [
      {
        source: "/:path((?!api|_next|favicon|static|.*\\..*).*)*",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
