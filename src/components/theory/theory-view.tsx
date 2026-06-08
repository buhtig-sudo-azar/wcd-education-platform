'use client'

import { useState } from 'react'
import { theorySections } from '@/data/theory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  Zap,
  Server,
  ShieldAlert,
  Split,
  GitBranch,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Database: <Database className="h-4 w-4 sm:h-5 sm:w-5" />,
  Zap: <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,
  Server: <Server className="h-4 w-4 sm:h-5 sm:w-5" />,
  ShieldAlert: <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />,
  Split: <Split className="h-4 w-4 sm:h-5 sm:w-5" />,
  GitBranch: <GitBranch className="h-4 w-4 sm:h-5 sm:w-5" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />,
}

export function TheoryView() {
  const [expandedSection, setExpandedSection] = useState<string | null>('what-is-cache')

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
            <Database className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Теория Web Cache Deception</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Изучите основы уязвимости шаг за шагом</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge variant="secondary" className="text-[10px] sm:text-xs">7 разделов</Badge>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">Для начинающих</Badge>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">PortSwigger Academy</Badge>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-6 sm:mb-8">
        {theorySections.map((section, index) => (
          <div
            key={section.id}
            className={`h-1 sm:h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
              expandedSection === section.id
                ? 'bg-emerald-500'
                : index < theorySections.findIndex((s) => s.id === expandedSection)
                ? 'bg-emerald-500/50'
                : 'bg-muted'
            }`}
            onClick={() => toggleSection(section.id)}
          />
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-2.5 sm:space-y-3">
        {theorySections.map((section, index) => (
          <Card
            key={section.id}
            className={`border transition-all duration-300 ${
              expandedSection === section.id
                ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                : 'border-border hover:border-emerald-500/20'
            }`}
          >
            {/* Only header is clickable with pointer cursor */}
            <CardHeader
              className="p-3 sm:p-4 cursor-pointer select-none"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs sm:text-sm font-bold shrink-0 ${
                  expandedSection === section.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  <div className="text-emerald-400 shrink-0">
                    {iconMap[section.icon]}
                  </div>
                  <CardTitle className="text-sm sm:text-base font-semibold truncate">{section.title}</CardTitle>
                </div>
                <ChevronRight className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                  expandedSection === section.id ? 'rotate-90' : ''
                }`} />
              </div>
            </CardHeader>

            {/* Content area: NOT clickable, default cursor */}
            {expandedSection === section.id && (
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 cursor-default">
                <div className="border-t border-border pt-3 sm:pt-4">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <MarkdownContent content={section.content} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Navigation hint */}
      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
          Изучили теорию? Переходите к практике!
        </p>
        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-medium">
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
        <code key={i} className="px-1 sm:px-1.5 py-0.5 rounded bg-muted text-emerald-400 text-[10px] sm:text-xs font-mono">{part}</code>
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
        <div key={i} className="overflow-x-auto my-3 sm:my-4">
          <table className="w-full text-[10px] sm:text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                {tableHeaders.map((h, hi) => (
                  <th key={hi} className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-foreground font-semibold">{h}</th>
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
        <h4 key={i} className="text-sm sm:text-base font-bold text-foreground mt-3 sm:mt-4 mb-1.5 sm:mb-2">
          {renderInline(text)}
        </h4>
      )
      continue
    }

    if (line.trim().startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-1.5 sm:gap-2 ml-1 sm:ml-2 mb-0.5 sm:mb-1">
          <span className="text-emerald-400 shrink-0">•</span>
          <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{renderInline(line.trim().slice(2))}</span>
        </div>
      )
      continue
    }

    elements.push(
      <p key={i} className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-1.5 sm:mb-2">
        {renderInline(line)}
      </p>
    )
  }

  if (inTable) {
    elements.push(
      <div key="final-table" className="overflow-x-auto my-3 sm:my-4">
        <table className="w-full text-[10px] sm:text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              {tableHeaders.map((h, hi) => (
                <th key={hi} className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-foreground font-semibold">{h}</th>
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
