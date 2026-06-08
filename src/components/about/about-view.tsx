'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Info,
  ExternalLink,
  BookOpen,
  ShieldAlert,
  GraduationCap,
  Target,
} from 'lucide-react'

export function AboutView() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
          <Info className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">О проекте</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">WCD Education Platform</p>
        </div>
      </div>

      {/* About */}
      <Card className="mb-4 sm:mb-6 border-border">
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Web Cache Deception Education Platform</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4">
            Интерактивная образовательная платформа, созданная для изучения уязвимости Web Cache Deception (WCD).
            Проект ориентирован на начинающих специалистов по веб-безопасности и студентов PortSwigger Web Security Academy.
            Платформа позволяет изучить теоретические основы уязвимости, визуально наблюдать механизм атаки в интерактивной
            лаборатории и получать помощь от встроенного ассистента с поддержкой различных ИИ-моделей.
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge variant="secondary" className="text-[10px] sm:text-xs">Next.js</Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">TypeScript</Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">Tailwind CSS</Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">shadcn/ui</Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">OpenRouter</Badge>
          </div>
        </CardContent>
      </Card>

      {/* What you'll learn */}
      <Card className="mb-4 sm:mb-6 border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Что вы изучите</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
            {[
              'Что такое Web Cache и зачем нужно кэширование',
              'Как работает Backend-сервер',
              'Механизм уязвимости Web Cache Deception',
              'Что такое delimiter discrepancies',
              'Как компоненты инфраструктуры интерпретируют URL',
              'Как происходит утечка конфиденциальных данных',
              'Методы защиты от WCD-атак',
              'Использование Burp Suite для тестирования',
            ].map((item) => (
              <div key={item} className="flex items-start gap-1.5 sm:gap-2">
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="mb-4 sm:mb-6 border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Полезные ресурсы</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {[
              {
                title: 'PortSwigger Web Security Academy',
                description: 'Главный ресурс для изучения веб-безопасности с интерактивными лабораториями',
                url: 'https://portswigger.net/web-security',
              },
              {
                title: 'Web Cache Deception — Раздел',
                description: 'Основной раздел, посвящённый уязвимости WCD на PortSwigger',
                url: 'https://portswigger.net/web-security/web-cache-deception',
              },
              {
                title: 'WCD Learning Path',
                description: 'Полный учебный путь по Web Cache Deception',
                url: 'https://portswigger.net/web-security/learning-paths/web-cache-deception',
              },
              {
                title: 'Exploiting Delimiter Discrepancies',
                description: 'Лаборатория по эксплуатации расхождений разделителей',
                url: 'https://portswigger.net/web-security/learning-paths/web-cache-deception/wcd-using-delimiter-discrepancies/web-cache-deception/exploiting-delimiter-discrepancies',
              },
            ].map((resource) => (
              <a
                key={resource.url}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors group"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors">{resource.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{resource.description}</p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="mb-4 sm:mb-6 border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Технологический стек</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              { name: 'Next.js 16', desc: 'React фреймворк' },
              { name: 'TypeScript', desc: 'Типизированный JS' },
              { name: 'Tailwind CSS 4', desc: 'Утилитарный CSS' },
              { name: 'shadcn/ui', desc: 'UI компоненты' },
              { name: 'Zustand', desc: 'Управление состоянием' },
              { name: 'OpenRouter', desc: 'Модели и API' },
            ].map((tech) => (
              <div key={tech.name} className="p-2.5 sm:p-3 rounded-lg border border-border text-center">
                <p className="text-xs sm:text-sm font-medium text-foreground">{tech.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Creator */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold text-base sm:text-lg">
              A
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-foreground">создатель AZAR</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Интерактивная образовательная платформа по Web Cache Deception</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
