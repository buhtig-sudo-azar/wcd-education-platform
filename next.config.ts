import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Запрещаем кэширование HTML на CDN и в браузере,
  // чтобы после деплоя всегда отдавалась свежая версия.
  // Статика (JS/CSS с хэшами) кэшируется нормально — это ок.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
