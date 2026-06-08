'use client'

import { useNavigationStore } from '@/store/navigation-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShieldAlert,
  BookOpen,
  FlaskConical,
  Bot,
  ArrowRight,
  Zap,
  Server,
  Globe,
  Lock,
} from 'lucide-react'

export function HomeView() {
  const { setView } = useNavigationStore()

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Теория WCD',
      description: 'Подробное объяснение уязвимости Web Cache Deception, механизмов кэширования и причин возникновения расхождений в обработке URL.',
      action: () => setView('theory'),
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: <FlaskConical className="h-6 w-6" />,
      title: 'Интерактивная лаборатория',
      description: 'Пошаговая визуализация атаки WCD. Введите URL и наблюдайте, как Cache и Backend по-разному интерпретируют один и тот же запрос.',
      action: () => setView('lab'),
      gradient: 'from-emerald-500 to-cyan-500',
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: 'Ассистент',
      description: 'Задавайте вопросы эксперту по Web Cache Deception, HTTP, CDN, прокси и веб-безопасности. Получайте развёрнутые ответы с примерами.',
      action: () => setView('ai'),
      gradient: 'from-amber-500 to-orange-500',
    },
  ]

  const concepts = [
    {
      icon: <Globe className="h-8 w-8 text-cyan-400" />,
      title: 'Web Cache',
      description: 'Промежуточное хранилище копий ресурсов для ускорения загрузки',
    },
    {
      icon: <Server className="h-8 w-8 text-emerald-400" />,
      title: 'Backend',
      description: 'Сервер-источник, обрабатывающий запросы и генерирующий ответы',
    },
    {
      icon: <Zap className="h-8 w-8 text-amber-400" />,
      title: 'Delimiter',
      description: 'Разделитель в URL, который разные компоненты интерпретируют по-разному',
    },
    {
      icon: <Lock className="h-8 w-8 text-red-400" />,
      title: 'Data Leak',
      description: 'Утечка конфиденциальных данных через кэшированный ответ',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 blur-xl opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg">
              <ShieldAlert className="h-10 w-10" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Web Cache Deception
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
          Интерактивная образовательная платформа для изучения уязвимости Web Cache Deception
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Ориентирована на начинающих специалистов по веб-безопасности и студентов PortSwigger Web Security Academy
        </p>
      </div>

      {/* Key Concepts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {concepts.map((concept) => (
          <div
            key={concept.title}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border hover:border-emerald-500/30 transition-colors"
          >
            <div className="mb-3">{concept.icon}</div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{concept.title}</h3>
            <p className="text-xs text-muted-foreground">{concept.description}</p>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group relative overflow-hidden border-border hover:border-emerald-500/30 transition-all duration-300 cursor-pointer"
            onClick={feature.action}
          >
            <CardContent className="p-6">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
              <div className="flex items-center text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                Перейти <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">Начните обучение прямо сейчас</h3>
              <p className="text-sm text-muted-foreground">
                Изучите теорию Web Cache Deception, затем перейдите к интерактивной лаборатории, чтобы увидеть уязвимость в действии. Если возникнут вопросы — ассистент всегда готов помочь.
              </p>
            </div>
            <Button
              onClick={() => setView('theory')}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shrink-0"
            >
              Начать с теории <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
