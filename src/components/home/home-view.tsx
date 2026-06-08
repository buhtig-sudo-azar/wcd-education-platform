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
} from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { wcdAgent } from '@/data/agent-data'

export function HomeView() {
  const { setView } = useNavigationStore()
  const { setActiveCategory } = useChatStore()
  const { setChatOpen } = useNavigationStore()

  const openAgentChat = () => {
    setActiveCategory('wcd-expert')
    setChatOpen(true)
  }

  const features = [
    {
      icon: <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Теория WCD',
      description: 'Подробное объяснение уязвимости Web Cache Deception, механизмов кэширования и причин возникновения расхождений в обработке URL.',
      action: () => setView('theory'),
      gradient: 'from-emerald-500 to-cyan-500',
    },
    {
      icon: <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Интерактивная лаборатория',
      description: 'Пошаговая визуализация атаки WCD. Введите URL и наблюдайте, как Cache и Backend по-разному интерпретируют один и тот же запрос.',
      action: () => setView('lab'),
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Ассистент',
      description: 'Задавайте вопросы эксперту по Web Cache Deception. Поддержка различных ИИ-моделей через OpenRouter с автоматическим фоллбэком.',
      action: openAgentChat,
      gradient: 'from-violet-500 to-purple-500',
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
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-1.5 sm:mb-2">
          Интерактивная образовательная платформа для изучения уязвимости Web Cache Deception
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
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
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-0.5 sm:mb-1">{concept.title}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">{concept.description}</p>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group relative overflow-hidden border-border hover:border-emerald-500/30 transition-all duration-300 cursor-pointer"
            onClick={feature.action}
          >
            <CardContent className="p-4 sm:p-6">
              <div className={`inline-flex p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-3 sm:mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">{feature.description}</p>
              <div className="flex items-center text-xs sm:text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                Перейти <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-1.5 sm:mb-2">Начните обучение прямо сейчас</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Изучите теорию Web Cache Deception, затем перейдите к интерактивной лаборатории, чтобы увидеть уязвимость в действии. Если возникнут вопросы — ассистент {wcdAgent.name} всегда готов помочь.
              </p>
            </div>
            <button
              onClick={() => setView('theory')}
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
