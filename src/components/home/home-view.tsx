'use client'

import { useNavigationStore } from '@/store/navigation-store'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShieldAlert,
  BookOpen,
  FlaskConical,
  ArrowRight,
  Zap,
  Server,
  Globe,
  Lock,
  MessageCircle,
  Settings,
  Key,
  Send,
} from 'lucide-react'
import { wcdAgent } from '@/data/agent-data'

export function HomeView() {
  const { navigateTo, setChatOpen } = useNavigationStore()

  const features = [
    {
      icon: <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Теория WCD',
      description: 'Подробное объяснение уязвимости Web Cache Deception, механизмов кэширования и причин возникновения расхождений в обработке URL.',
      view: 'theory' as const,
      gradient: 'from-emerald-500 to-cyan-500',
    },
    {
      icon: <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Интерактивная лаборатория',
      description: 'Конфигурация прокси и backend, пошаговая симуляция атаки и интерактивная песочница с терминалом.',
      view: 'lab' as const,
      gradient: 'from-amber-500 to-orange-500',
    },
  ]

  const concepts = [
    {
      icon: <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />,
      title: 'Web Cache',
      description: 'Промежуточное хранилище копий ресурсов для ускорения загрузки',
    },
    {
      icon: <Server className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />,
      title: 'Backend',
      description: 'Сервер-источник, обрабатывающий запросы и генерирующий ответы',
    },
    {
      icon: <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400" />,
      title: 'Delimiter',
      description: 'Разделитель в URL, который разные компоненты интерпретируют по-разному',
    },
    {
      icon: <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />,
      title: 'Data Leak',
      description: 'Утечка конфиденциальных данных через кэшированный ответ',
    },
  ]

  const agentSteps = [
    {
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />,
      title: 'Откройте ассистента',
      description: 'Нажмите на плавающую иконку ассистента в правом нижнем углу экрана — она появляется на страницах Теории и Лаборатории.',
    },
    {
      icon: <Key className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />,
      title: 'Введите API-ключ',
      description: 'Нажмите на иконку ключа в верхней панели, введите ваш OpenRouter API-ключ и выберите модель. Без ключа будет использоваться бесплатный фоллбэк.',
    },
    {
      icon: <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />,
      title: 'Выберите модель',
      description: 'В выпадающем списке в хедере выберите ИИ-модель. Рекомендуются бесплатные модели — они работают без ключа.',
    },
    {
      icon: <Send className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />,
      title: 'Задайте вопрос',
      description: 'Введите вопрос о Web Cache Deception, кэшировании, CDN, HTTP-заголовках или методах защиты. Ассистент ответит с примерами и пояснениями.',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 blur-xl opacity-30" />
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg">
              <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Web Cache Deception
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-1.5 sm:mb-2">
          Интерактивная образовательная платформа для изучения уязвимости Web Cache Deception
        </p>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Ориентирована на начинающих специалистов по веб-безопасности и студентов PortSwigger Web Security Academy
        </p>
      </div>

      {/* Key Concepts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-8 sm:mb-12">
        {concepts.map((concept) => (
          <div
            key={concept.title}
            className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-emerald-500/30 transition-colors"
          >
            <div className="mb-2 sm:mb-3">{concept.icon}</div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">{concept.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{concept.description}</p>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {features.map((feature) => (
          <button
            key={feature.title}
            onClick={() => navigateTo(feature.view)}
            className="text-left w-full"
          >
            <Card className="group relative overflow-hidden border-border hover:border-emerald-500/30 transition-all duration-300 cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <div className={`inline-flex p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-3 sm:mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">{feature.description}</p>
                <div className="flex items-center text-sm sm:text-base font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  Перейти <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Agent Instructions */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 mb-8 sm:mb-12">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
              <MessageCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">Ассистент {wcdAgent.name}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Как пользоваться ИИ-ассистентом</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {agentSteps.map((step, i) => (
              <div
                key={step.title}
                className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-background/50 border border-border"
              >
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs sm:text-sm font-bold text-muted-foreground/50">{i + 1}</span>
                    <p className="text-sm sm:text-base font-medium text-foreground">{step.title}</p>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs sm:text-sm text-amber-300 leading-relaxed">
              Ассистент доступен на страницах «Теория» и «Лаборатория» — ищите плавающую иконку в правом нижнем углу.
              Для работы без ограничений получите API-ключ на <span className="font-medium">openrouter.ai</span> — бесплатные модели доступны без оплаты.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => { navigateTo('theory'); setTimeout(() => setChatOpen(true), 500) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-xs sm:text-sm font-medium transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Попробовать ассистента
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1.5 sm:mb-2">Начните обучение прямо сейчас</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Изучите теорию Web Cache Deception, затем перейдите к интерактивной лаборатории, чтобы увидеть уязвимость в действии. Если возникнут вопросы — ассистент {wcdAgent.name} всегда готов помочь.
              </p>
            </div>
            <button
              onClick={() => navigateTo('theory')}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium text-xs sm:text-sm shrink-0 transition-colors"
            >
              Начать с теории <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
