import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Убираем output: "standalone" — он не нужен для Vercel деплоя
  // Standalone нужен только для Docker-контейнеров
};

export default nextConfig;
