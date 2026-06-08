'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FlaskConical,
  Send,
  RotateCcw,
  ChevronRight,
  Database,
  Server,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
  Globe,
  Lock,
  Unlock,
  Copy,
} from 'lucide-react'

interface LabStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

interface ParsedResult {
  original: string
  cache: {
    path: string
    extension: string
    isStatic: boolean
    interpretation: string
  }
  backend: {
    path: string
    extension: string | null
    isStatic: boolean
    interpretation: string
  }
  isVulnerable: boolean
  vulnerabilityType: string | null
}

const labSteps: LabStep[] = [
  { id: 1, title: 'Ввод URL', description: 'Пользователь вводит URL для анализа', icon: <Globe className="h-5 w-5" /> },
  { id: 2, title: 'Разбор Cache', description: 'Кэш-сервер анализирует URL', icon: <Database className="h-5 w-5" /> },
  { id: 3, title: 'Разбор Backend', description: 'Сервер-источник анализирует URL', icon: <Server className="h-5 w-5" /> },
  { id: 4, title: 'Кэширование', description: 'Кэш сохраняет ответ как статический ресурс', icon: <Copy className="h-5 w-5" /> },
  { id: 5, title: 'Утечка данных', description: 'Атакующий получает конфиденциальные данные', icon: <AlertTriangle className="h-5 w-5" /> },
]

const exampleUrls = [
  { url: '/account/home', label: 'Обычный запрос', vulnerable: false },
  { url: '/account/home%0f.css', label: 'WCD с %0f', vulnerable: true },
  { url: '/api/user%00.js', label: 'WCD с null-byte', vulnerable: true },
  { url: '/profile;admin.css', label: 'WCD с ;', vulnerable: true },
  { url: '/dashboard%0a.png', label: 'WCD с %0a', vulnerable: true },
]

function parseUrl(url: string): ParsedResult {
  const original = url.trim()

  // Decode for analysis
  const decoded = decodeURIComponent(original)

  // Cache interpretation - looks at the raw URL
  const rawExtension = original.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)?.[1] || ''
  const rawPath = original

  // Backend interpretation - decodes and strips special chars
  let backendPath = decoded

  // Check for delimiter characters
  const delimiters = ['%0f', '%0a', '%00', '%0d', ';']

  let activeDelimiter: string | null = null
  for (const delim of delimiters) {
    if (original.toLowerCase().includes(delim.toLowerCase())) {
      activeDelimiter = delim
      break
    }
  }

  // Also check decoded form
  if (!activeDelimiter) {
    if (decoded.includes('\x0f')) activeDelimiter = '%0f'
    else if (decoded.includes('\n')) activeDelimiter = '%0a'
    else if (decoded.includes('\r')) activeDelimiter = '%0d'
    else if (decoded.includes('\0')) activeDelimiter = '%00'
    else if (decoded.includes(';')) activeDelimiter = ';'
  }

  if (activeDelimiter) {
    if (activeDelimiter === ';') {
      backendPath = decoded.split(';')[0]
    } else if (activeDelimiter === '%0f') {
      backendPath = decoded.split('\x0f')[0]
    } else if (activeDelimiter === '%0a') {
      backendPath = decoded.split('\n')[0]
    } else if (activeDelimiter === '%0d') {
      backendPath = decoded.split('\r')[0]
    } else if (activeDelimiter === '%00') {
      backendPath = decoded.split('\0')[0]
    }
  }

  const isVulnerable = rawExtension !== '' && backendPath !== rawPath && !original.includes('?')
  const vulnerabilityType = isVulnerable
    ? `Delimiter Discrepancy (${activeDelimiter})`
    : null

  return {
    original,
    cache: {
      path: rawPath,
      extension: rawExtension,
      isStatic: rawExtension !== '',
      interpretation: rawExtension
        ? `Статический ресурс (.${rawExtension}) — подлежит кэшированию`
        : 'Динамический ресурс — не кэшируется',
    },
    backend: {
      path: backendPath,
      extension: null,
      isStatic: false,
      interpretation: `Динамическая страница (${backendPath}) — защищённый ресурс`,
    },
    isVulnerable,
    vulnerabilityType,
  }
}

export function LabView() {
  const [urlInput, setUrlInput] = useState('/account/home%0f.css')
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<ParsedResult | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  const runSimulation = useCallback(() => {
    const parsed = parseUrl(urlInput)
    setResult(parsed)
    setCurrentStep(0)
    setIsAnimating(true)
    setAnimationPhase(0)

    // Step-by-step animation
    const timeouts: NodeJS.Timeout[] = []
    for (let i = 1; i <= 5; i++) {
      timeouts.push(
        setTimeout(() => {
          setCurrentStep(i)
          setAnimationPhase(i)
        }, i * 1200)
      )
    }
    timeouts.push(
      setTimeout(() => {
        setIsAnimating(false)
      }, 6000)
    )

    return () => timeouts.forEach(clearTimeout)
  }, [urlInput])

  const reset = () => {
    setCurrentStep(0)
    setResult(null)
    setIsAnimating(false)
    setAnimationPhase(0)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Лаборатория WCD</h1>
          <p className="text-sm text-muted-foreground">Интерактивная демонстрация механизма атаки</p>
        </div>
      </div>

      {/* URL Input */}
      <Card className="mb-6 border-emerald-500/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Введите URL для анализа
              </label>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="/account/home%0f.css"
                  className="font-mono text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
                />
                <Button
                  onClick={runSimulation}
                  disabled={isAnimating}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shrink-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Анализ
                </Button>
                <Button variant="outline" onClick={reset} className="shrink-0">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Example URLs */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Примеры URL:</p>
            <div className="flex flex-wrap gap-2">
              {exampleUrls.map((ex) => (
                <button
                  key={ex.url}
                  onClick={() => setUrlInput(ex.url)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
                >
                  {ex.vulnerable ? (
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  )}
                  <span className="text-muted-foreground">{ex.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Progress */}
      {currentStep > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {labSteps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0 transition-all duration-500 ${
                currentStep >= step.id
                  ? step.id === 5 && result?.isVulnerable
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-border bg-card'
              }`}
            >
              <div className={`${
                currentStep >= step.id
                  ? step.id === 5 && result?.isVulnerable
                    ? 'text-red-400'
                    : 'text-emerald-400'
                  : 'text-muted-foreground'
              }`}>
                {step.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium ${
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visualization */}
      {result && currentStep > 0 && (
        <div className="space-y-4">
          {/* Step 1: Original Request */}
          {currentStep >= 1 && (
            <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <CardTitle className="text-sm font-semibold">Исходный запрос</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted font-mono text-sm">
                  <span className="text-cyan-400">GET</span>
                  <span className="text-foreground">{result.original}</span>
                  <span className="text-muted-foreground">HTTP/1.1</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps 2 & 3: Cache and Backend interpretation */}
          {currentStep >= 2 && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Cache */}
              <Card className={`animate-in fade-in slide-in-from-left-2 duration-500 ${
                result.isVulnerable ? 'border-amber-500/30' : 'border-emerald-500/30'
              }`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-amber-400" />
                      <CardTitle className="text-sm font-semibold">Cache (Кэш-сервер)</CardTitle>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${
                      result.cache.isStatic ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {result.cache.isStatic ? 'Статический' : 'Динамический'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Путь URL:</p>
                    <code className="px-2 py-1 rounded bg-muted text-xs font-mono text-amber-400">
                      {result.cache.path}
                    </code>
                  </div>
                  {result.cache.extension && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Расширение:</p>
                      <code className="px-2 py-1 rounded bg-muted text-xs font-mono text-amber-400">
                        .{result.cache.extension}
                      </code>
                    </div>
                  )}
                  <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs text-amber-300">
                      {result.cache.interpretation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Backend */}
              <Card className={`animate-in fade-in slide-in-from-right-2 duration-500 ${
                result.isVulnerable ? 'border-red-500/30' : 'border-emerald-500/30'
              }`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-red-400" />
                      <CardTitle className="text-sm font-semibold">Backend (Сервер-источник)</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-400">
                      Динамический
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Путь URL:</p>
                    <code className="px-2 py-1 rounded bg-muted text-xs font-mono text-red-400">
                      {result.backend.path}
                    </code>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-xs text-red-300">
                      {result.backend.interpretation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Discrepancy indicator */}
          {currentStep >= 3 && result.isVulnerable && (
            <Card className="border-red-500/30 bg-red-500/5 animate-in fade-in duration-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">Обнаружено расхождение!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cache видит <code className="text-amber-400">.{result.cache.extension}</code> файл (кэширует), а Backend видит
                      <code className="text-red-400"> {result.backend.path}</code> (возвращает данные пользователя).
                      Тип: {result.vulnerabilityType}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Caching */}
          {currentStep >= 4 && result.isVulnerable && (
            <Card className="border-amber-500/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-sm font-semibold">Процесс кэширования</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 shrink-0">
                      <Lock className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Сервер возвращает защищённые данные пользователя</p>
                      <code className="text-xs text-red-400">{"{ username: 'victim@email.com', api_key: 'sk_...', ... }"}</code>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown className="h-5 w-5 text-amber-400" />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 shrink-0">
                      <Database className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-amber-300 font-medium">
                        Кэш сохраняет ответ как статический файл .{result.cache.extension}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cache-Control: public, max-age=3600 — ответ будет выдан любому пользователю
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Data Leak */}
          {currentStep >= 5 && result.isVulnerable && (
            <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-red-400" />
                  <CardTitle className="text-sm font-semibold text-red-400">Утечка данных!</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 shrink-0">
                      <span className="text-sm">🏴‍☠️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Атакующий запрашивает:</p>
                      <code className="text-xs text-red-400">{result.original}</code>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown className="h-5 w-5 text-red-400" />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-400">Кэш возвращает данные жертвы без аутентификации!</p>
                      <code className="text-xs text-red-300 mt-1 block">{"{ username: 'victim@email.com', api_key: 'sk_...', balance: '$1,250' }"}</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safe result */}
          {currentStep >= 3 && !result.isVulnerable && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 animate-in fade-in duration-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Уязвимость не обнаружена</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cache и Backend интерпретируют этот URL одинаково. Попробуйте добавить расширение файла с разделителем, например:
                      <code className="text-amber-400 ml-1">/account/home%0f.css</code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Instructions */}
      {!result && (
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Как пользоваться лабораторией</h3>
              <div className="text-sm text-muted-foreground space-y-2 max-w-lg mx-auto text-left">
                <p>1. Введите URL в поле выше или выберите один из примеров</p>
                <p>2. Нажмите кнопку «Анализ» для запуска симуляции</p>
                <p>3. Наблюдайте пошаговую обработку URL компонентами Cache и Backend</p>
                <p>4. Обратите внимание на расхождения в интерпретации URL</p>
                <p className="pt-2 text-emerald-400 font-medium">
                  Попробуйте: /account/home%0f.css — этот URL вызывает расхождение между Cache и Backend
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
