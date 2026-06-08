'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  Hacker,
} from 'lucide-react'

/* ─────────────────────── types ─────────────────────── */

interface ProxyConfig {
  type: 'cloudflare' | 'nginx' | 'varnish'
  cacheStaticExts: string[]
  cacheKey: 'full-url' | 'path-only' | 'normalized'
  normalizeUrl: boolean
  respectCacheControl: boolean
  defaultTtl: number
}

interface BackendConfig {
  type: 'nodejs' | 'python' | 'java' | 'ruby'
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
    stripDelimiters: ['%0a', '%0d'],
    ignoreAfterDelimiter: false,
    treatDotAsFormat: true,
  },
}

const PROXY_CONFIG_FILES: Record<string, string> = {
  cloudflare: `# Cloudflare Cache Rules (Page Rules / Cache Rules)
# Конфигурация кэширования для Cloudflare CDN

cache_rules:
  # Кэшировать по расширению файла
  - expression: "http.request.uri.path.ends_with('.css')"
    action: cache
    ttl: 3600
    edge_ttl: 7200

  - expression: "http.request.uri.path.ends_with('.js')"
    action: cache
    ttl: 3600

  - expression: "http.request.uri.path.ends_with('.png')"
    action: cache
    ttl: 86400

  # Динамические страницы — не кэшировать
  - expression: "http.request.uri.path.matches('/api/*')"
    action: bypass

  # Ключ кэша: полный URL (без нормализации!)
  cache_key:
    include_query_string: true
    normalize_path: false  # ← ПРОБЛЕМА: не нормализует %0f, %0a
    ignore_delimiters: []`,

  nginx: `# nginx.conf — Конфигурация обратного прокси
# Кэширование статических ресурсов

proxy_cache_path /var/cache/nginx levels=1:2
                 keys_zone=STATIC:10m
                 max_size=1g inactive=60m;

server {
    listen 80;
    server_name example.com;

    # Статические файлы — кэшировать
    location ~* \\.(css|js|png|jpg|gif|svg|ico)$ {
        proxy_cache STATIC;
        proxy_cache_valid 200 30m;
        proxy_cache_key "$scheme$host$uri";
        # ↑ Ключ: нормализованный путь
        add_header X-Cache-Status $upstream_cache_status;
    }

    # Динамические запросы — проксировать без кэша
    location / {
        proxy_pass http://backend;
        proxy_cache_bypass 1;
    }
}

# Важно: nginx нормализует URL перед проверкой location
# %0f → удаляется при нормализации
# Но Cloudflare этого не делает!`,

  varnish: `# default.vcl — Конфигурация Varnish Cache
# Логика кэширования запросов

vcl 4.1;

backend default {
    .host = "127.0.0.1";
    .port = "8080";
}

sub vcl_recv {
    # Кэшировать статические файлы по расширению
    if (req.url ~ "\\.(css|js|png|jpg|gif|svg|ico)$") {
        unset req.http.Cookie;
        return (hash);
    }

    # Ключ кэша: только путь (без query string)
    # ↑ ПРОБЛЕМА: Varnish использует req.url как есть
    # Если URL = /account/home%0f.css → hash по полному URL
    # Backend получит /account/home (после strip)
}

sub vcl_backend_response {
    # Кэшировать ответы со статусом 200
    if (beresp.status == 200) {
        set beresp.ttl = 2h;
    }
}

sub vcl_deliver {
    # Добавить заголовок для отладки
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
}`,
}

const BACKEND_CONFIG_FILES: Record<string, string> = {
  nodejs: `// app.js — Node.js + Express сервер
// Обработка URL и маршрутизация

const express = require('express');
const app = express();

// Middleware: парсинг URL
// Express автоматически декодирует URL:
//   /account/home%0f.css → decoded: /account/home\\x0f.css
// Но \\x0f — непечатный символ, маршрут не совпадает!

// Защищённый маршрут — профиль пользователя
app.get('/account/home', authMiddleware, (req, res) => {
    // req.user извлекается из cookie/session
    const userData = {
        username: req.user.email,
        api_key: req.user.apiKey,
        balance: req.user.balance,
        personal_data: req.user.personalData
    };
    res.json(userData);
    // ↑ Нет заголовка Cache-Control: no-store!
    // ↑ Кэш может сохранить этот ответ
});

// Статические файлы
app.use('/static', express.static('public'));

// ВАЖНО: Express обрабатывает %0f в пути
// /account/home%0f.css → маршрут /account/home НЕ совпадает
// Но некоторые конфигурации прокси обрезают %0f
// и THEN направляют запрос сюда как /account/home
// → Расхождение с кэшем!`,

  python: `# app.py — Python + Flask/Django сервер
# Обработка URL и маршрутизация

from flask import Flask, request, jsonify
from auth import require_auth

app = Flask(__name__)

# Защищённый маршрут — профиль пользователя
@app.route('/account/home')
@require_auth
def account_home():
    user = get_current_user()
    return jsonify({
        'username': user.email,
        'api_key': user.api_key,
        'balance': user.balance,
    })
    # ↑ Нет Cache-Control: no-store!

# Flask маршрутизатор:
# /account/home%0a.css → 404 (маршрут не найден)
# Но если прокси обрезает %0a → /account/home
# И передаёт на сервер → маршрут совпадает → данные утечки
#
# Python urllib.parse декодирует:
#   %0a → \\n (перевод строки)
#   %00 → \\x00 (null byte)
# Flask обрезает путь по null byte`,

  java: `// Application.java — Java + Spring Boot
// Обработка URL и маршрутизация

@RestController
@RequestMapping("/account")
public class AccountController {

    @GetMapping("/home")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserData> accountHome(
            @AuthenticationPrincipal User user) {
        UserData data = new UserData(
            user.getEmail(),
            user.getApiKey(),
            user.getBalance()
        );
        return ResponseEntity.ok(data);
        // ↑ Нет Cache-Control: no-store!
    }
}

// Spring MVC URL处理:
// /account/home;.css → матчит /account/home
//   (semicolon — matrix parameter, игнорируется)
// /account/home%00.css → зависит от сервера (Tomcat vs Undertow)
//   Tomcat: обрезает по null byte → /account/home
//   Undertow: может вернуть 400`,

  ruby: `# app.rb — Ruby on Rails сервер
# Обработка URL и маршрутизация

Rails.application.routes.draw do
  # Защищённый маршрут
  get '/account/home', to: 'accounts#home'
  get '/profile', to: 'profiles#show'
end

class AccountsController < ApplicationController
  before_action :authenticate_user!

  def home
    render json: {
      username: current_user.email,
      api_key: current_user.api_key,
      balance: current_user.balance
    }
    # ↑ Нет Cache-Control: no-store!
  end
end

# Rails маршрутизатор:
# /account/home.css → формат .css (respond_to)
#   Если нет CSS шаблона → 406 Not Acceptable
# /account/home%0a.css → зависит от Rack middleware
#   Rack может обрезать по переводам строк`,
}

const EXAMPLE_URLS = [
  { url: '/account/home', label: 'Обычный запрос', vulnerable: false },
  { url: '/account/home%0f.css', label: 'WCD с %0f', vulnerable: true },
  { url: '/api/user%00.js', label: 'WCD с null-byte', vulnerable: true },
  { url: '/profile;admin.css', label: 'WCD с ;', vulnerable: true },
  { url: '/dashboard%0a.png', label: 'WCD с %0a', vulnerable: true },
  { url: '/settings%0d.css', label: 'WCD с %0d', vulnerable: true },
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
  }

  for (const [encoded, char] of Object.entries(delimiterMap)) {
    if (original.toLowerCase().includes(encoded.toLowerCase()) || decoded.includes(char)) {
      activeDelimiter = encoded
      break
    }
  }

  if (activeDelimiter && backendConfig.ignoreAfterDelimiter) {
    const delimChar = delimiterMap[activeDelimiter]
    if (delimChar === ';') {
      backendPath = decoded.split(';')[0]
    } else {
      backendPath = decoded.split(delimChar)[0]
    }
  }

  // Check if backend recognizes this delimiter
  const backendRecognizesDelimiter =
    activeDelimiter !== null && backendConfig.stripDelimiters.includes(activeDelimiter.toLowerCase())

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
  if (activeDelimiter && backendRecognizesDelimiter) {
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
          <code>{code}</code>
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
      <Tabs defaultValue="config" className="space-y-4 sm:space-y-5">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-9 sm:h-10">
          <TabsTrigger value="config" className="text-xs sm:text-sm gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span>Конфигурация</span>
          </TabsTrigger>
          <TabsTrigger value="simulation" className="text-xs sm:text-sm gap-1.5">
            <Play className="h-3.5 w-3.5" />
            <span>Симуляция</span>
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="text-xs sm:text-sm gap-1.5">
            <Terminal className="h-3.5 w-3.5" />
            <span>Песочница</span>
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
                <div className="flex gap-2">
                  {(['cloudflare', 'nginx', 'varnish'] as const).map(type => (
                    <Button
                      key={type}
                      variant={proxyType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setProxyType(type)}
                      className={`text-[10px] sm:text-xs ${proxyType === type ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' : ''}`}
                    >
                      {type === 'cloudflare' ? 'Cloudflare' : type === 'nginx' ? 'Nginx' : 'Varnish'}
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
                        : 'Varnish использует req.url как есть для хеширования. Если VCL-правило проверяет расширение регулярным выражением, URL с %0f.css попадёт под правило для статических файлов. Varnish не нормализует URL автоматически.'}
                  </p>
                </div>
              </div>

              {/* Config file */}
              <CodeBlock
                code={PROXY_CONFIG_FILES[proxyType]}
                title={`Конфигурация ${proxyType === 'cloudflare' ? 'Cloudflare' : proxyType === 'nginx' ? 'Nginx' : 'Varnish'}`}
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
                <div className="flex gap-2 flex-wrap">
                  {(['nodejs', 'python', 'java', 'ruby'] as const).map(type => (
                    <Button
                      key={type}
                      variant={backendType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBackendType(type)}
                      className={`text-[10px] sm:text-xs ${backendType === type ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' : ''}`}
                    >
                      {type === 'nodejs' ? 'Node.js' : type === 'python' ? 'Python' : type === 'java' ? 'Java' : 'Ruby'}
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
                        ? 'Flask/Django декодируют URL и ищут точное совпадение маршрута. Разделители %0a и %00 обрезают путь, но %0f — нет. Если прокси передаёт обрезанный путь, Flask возвращает данные пользователя без Cache-Control: no-store.'
                        : backendConfig.type === 'java'
                          ? 'Spring MVC обрабатывает точку с запятой как matrix-параметры и игнорирует их при маршрутизации. Null-byte (%00) обрезает путь в Tomcat. Это создаёт расхождение: прокси видит .css, а Spring матчит маршрут без расширения.'
                          : 'Rails интерпретирует точку в пути как спецификатор формата (format). /account/home.css пытается найти CSS-шаблон. Но если прокси обрезает разделитель до передачи запроса, Rails может обработать путь как /account/home и вернуть JSON.'}
                  </p>
                </div>
              </div>

              {/* Backend config file */}
              <CodeBlock
                code={BACKEND_CONFIG_FILES[backendType]}
                title={`Код сервера (${backendConfig.type === 'nodejs' ? 'Node.js' : backendConfig.type === 'python' ? 'Python' : backendConfig.type === 'java' ? 'Java' : 'Ruby'})`}
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
                  {EXAMPLE_URLS.map((ex) => (
                    <button
                      key={ex.url}
                      onClick={() => setUrlInput(ex.url)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-mono border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
                    >
                      {ex.vulnerable ? (
                        <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
                      )}
                      <span className="text-muted-foreground">{ex.label}</span>
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
      </Tabs>
    </div>
  )
}
