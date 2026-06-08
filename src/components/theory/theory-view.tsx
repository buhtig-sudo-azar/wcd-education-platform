'use client'

import { theorySections } from '@/data/theory'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Database,
  Zap,
  Server,
  ShieldAlert,
  Split,
  GitBranch,
  AlertTriangle,
  Settings,
  FileCode,
  Cloud,
  Code,
  Layers,
  Shield,
} from 'lucide-react'
import { useCallback } from 'react'

const iconMap: Record<string, React.ReactNode> = {
  Database: <Database className="h-4 w-4 sm:h-5 sm:w-5" />,
  Zap: <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,
  Server: <Server className="h-4 w-4 sm:h-5 sm:w-5" />,
  ShieldAlert: <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />,
  Split: <Split className="h-4 w-4 sm:h-5 sm:w-5" />,
  GitBranch: <GitBranch className="h-4 w-4 sm:h-5 sm:w-5" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />,
  Settings: <Settings className="h-4 w-4 sm:h-5 sm:w-5" />,
  FileCode: <FileCode className="h-4 w-4 sm:h-5 sm:w-5" />,
  Cloud: <Cloud className="h-4 w-4 sm:h-5 sm:w-5" />,
  Code: <Code className="h-4 w-4 sm:h-5 sm:w-5" />,
  Layers: <Layers className="h-4 w-4 sm:h-5 sm:w-5" />,
  Shield: <Shield className="h-4 w-4 sm:h-5 sm:w-5" />,
}

export function TheoryView() {
  // Автопрокрутка к открытой секции аккордеона
  const handleAccordionChange = useCallback((value: string) => {
    if (!value) return
    // Небольшая задержка, чтобы контент успел развернуться
    setTimeout(() => {
      const el = document.querySelector(`[data-state="open"][data-accordion-item]`)
        ?? document.querySelector(`[data-state="open"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
            <Database className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Теория Web Cache Deception</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Изучите основы уязвимости шаг за шагом</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge variant="secondary" className="text-xs sm:text-sm">{theorySections.length} разделов</Badge>
          <Badge variant="secondary" className="text-xs sm:text-sm">Для начинающих</Badge>
          <Badge variant="secondary" className="text-xs sm:text-sm">PortSwigger Academy</Badge>
          <Badge variant="secondary" className="text-xs sm:text-sm">Серверные конфигурации</Badge>
          <Badge variant="secondary" className="text-xs sm:text-sm">Fly.io и Workers</Badge>
        </div>
      </div>

      {/* Sections — using Radix Accordion for proper trigger/content isolation */}
      <Accordion
        type="single"
        collapsible
        defaultValue="what-is-cache"
        onValueChange={handleAccordionChange}
        className="space-y-2.5 sm:space-y-3"
      >
        {theorySections.map((section, index) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border rounded-xl px-3 sm:px-4 transition-all duration-300 data-[state=open]:border-emerald-500/30 data-[state=open]:shadow-lg data-[state=open]:shadow-emerald-500/5 data-[state=closed]:border-border data-[state=closed]:hover:border-emerald-500/20"
          >
            {/* TRIGGER — only this area is clickable, cursor-pointer is native */}
            <AccordionTrigger className="py-3 sm:py-4 hover:no-underline">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs sm:text-sm font-bold shrink-0">
                  {index + 1}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="text-emerald-400 shrink-0">
                    {iconMap[section.icon]}
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-semibold truncate text-foreground">{section.title}</span>
                </div>
              </div>
            </AccordionTrigger>

            {/* CONTENT — NOT clickable, default cursor, fully isolated from trigger */}
            <AccordionContent className="cursor-default">
              <div className="border-t border-border pt-3 sm:pt-4 pb-1">
                <MarkdownContent content={section.content} />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Navigation hint */}
      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-sm sm:text-base text-muted-foreground mb-1.5 sm:mb-2">
          Изучили теорию? Переходите к практике!
        </p>
        <div className="inline-flex items-center gap-2 text-emerald-400 text-sm sm:text-base font-medium">
          Откройте раздел «Лаборатория» в боковом меню
        </div>
      </div>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/\*\*([^*]+)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-foreground">{part}</strong>
      ) : (
        <span key={i}>{renderCodeInline(part)}</span>
      )
    )
  }

  const renderCodeInline = (text: string): React.ReactNode => {
    const parts = text.split(/`([^`]+)`/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <code key={i} className="px-1 sm:px-2 py-0.5 rounded bg-muted text-emerald-400 text-xs sm:text-sm font-mono break-all">{part}</code>
      ) : (
        part
      )
    )
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter((c) => c.trim()).map((c) => c.trim())
      if (cells.some((c) => c.match(/^[-:]+$/))) {
        continue
      }
      if (!inTable) {
        inTable = true
        tableHeaders = cells
        tableRows = []
      } else {
        tableRows.push(cells)
      }
      continue
    } else if (inTable) {
      inTable = false
      elements.push(
        <div key={i} className="overflow-x-auto my-3 sm:my-4 -mx-1 sm:mx-0">
          <table className="w-full min-w-[400px] sm:min-w-0 text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                {tableHeaders.map((h, hi) => (
                  <th key={hi} className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-foreground font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground">{renderInline(cell)}</td>
                  ))}
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (line.trim() === '') {
      continue
    }

    if (line.match(/^\*\*\d+\./)) {
      const text = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*\*/g, '')
      elements.push(
        <h4 key={i} className="text-base sm:text-lg font-bold text-foreground mt-3 sm:mt-4 mb-1.5 sm:mb-2">
          {renderInline(text)}
        </h4>
      )
      continue
    }

    if (line.trim().startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-1.5 sm:gap-2 ml-1 sm:ml-2 mb-0.5 sm:mb-1">
          <span className="text-emerald-400 shrink-0">•</span>
          <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">{renderInline(line.trim().slice(2))}</span>
        </div>
      )
      continue
    }

    elements.push(
      <p key={i} className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-2 sm:mb-3">
        {renderInline(line)}
      </p>
    )
  }

  if (inTable) {
    elements.push(
      <div key="final-table" className="overflow-x-auto my-3 sm:my-4 -mx-1 sm:mx-0">
        <table className="w-full min-w-[400px] sm:min-w-0 text-[10px] sm:text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              {tableHeaders.map((h, hi) => (
                <th key={hi} className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-foreground font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground">{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return <>{elements}</>
}
