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
  Database: <Database className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
  ShieldAlert: <ShieldAlert className="h-5 w-5" />,
  Split: <Split className="h-5 w-5" />,
  GitBranch: <GitBranch className="h-5 w-5" />,
  AlertTriangle: <AlertTriangle className="h-5 w-5" />,
}

export function TheoryView() {
  const [expandedSection, setExpandedSection] = useState<string | null>('what-is-cache')

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Теория Web Cache Deception</h1>
            <p className="text-sm text-muted-foreground">Изучите основы уязвимости шаг за шагом</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">7 разделов</Badge>
          <Badge variant="secondary" className="text-xs">Для начинающих</Badge>
          <Badge variant="secondary" className="text-xs">PortSwigger Academy</Badge>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-8">
        {theorySections.map((section, index) => (
          <div
            key={section.id}
            className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
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
      <div className="space-y-3">
        {theorySections.map((section, index) => (
          <Card
            key={section.id}
            className={`border transition-all duration-300 cursor-pointer ${
              expandedSection === section.id
                ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                : 'border-border hover:border-emerald-500/20'
            }`}
            onClick={() => toggleSection(section.id)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shrink-0 ${
                  expandedSection === section.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-emerald-400 shrink-0">
                    {iconMap[section.icon]}
                  </div>
                  <CardTitle className="text-base font-semibold truncate">{section.title}</CardTitle>
                </div>
                <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                  expandedSection === section.id ? 'rotate-90' : ''
                }`} />
              </div>
            </CardHeader>

            {expandedSection === section.id && (
              <CardContent className="px-4 pb-4 pt-0">
                <div className="border-t border-border pt-4">
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
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Изучили теорию? Переходите к практике!
        </p>
        <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
          Откройте раздел «Лаборатория» в боковом меню
        </div>
      </div>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []

  const renderInline = (text: string): React.ReactNode => {
    // Bold
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
        <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-emerald-400 text-xs font-mono">{part}</code>
      ) : (
        part
      )
    )
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter((c) => c.trim()).map((c) => c.trim())
      if (cells.some((c) => c.match(/^[-:]+$/))) {
        continue // separator line
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
        <div key={i} className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                {tableHeaders.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 text-left text-foreground font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-muted-foreground">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Empty line
    if (line.trim() === '') {
      continue
    }

    // Heading-like lines (numbered sections)
    if (line.match(/^\*\*\d+\./)) {
      const text = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*\*/g, '')
      elements.push(
        <h4 key={i} className="text-base font-bold text-foreground mt-4 mb-2">
          {renderInline(text)}
        </h4>
      )
      continue
    }

    // Bullet points
    if (line.trim().startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2 mb-1">
          <span className="text-emerald-400 shrink-0">•</span>
          <span className="text-sm text-muted-foreground">{renderInline(line.trim().slice(2))}</span>
        </div>
      )
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">
        {renderInline(line)}
      </p>
    )
  }

  // Handle table at end of content
  if (inTable) {
    elements.push(
      <div key="final-table" className="overflow-x-auto my-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              {tableHeaders.map((h, hi) => (
                <th key={hi} className="px-3 py-2 text-left text-foreground font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-muted-foreground">{renderInline(cell)}</td>
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
