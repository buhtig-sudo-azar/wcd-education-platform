export type ViewType = 'home' | 'theory' | 'lab' | 'ai' | 'about'

export interface TheorySection {
  id: string
  title: string
  content: string
  icon: string
}

export interface LabStep {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'completed'
}

export interface ParsedUrl {
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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface AgentPersona {
  slug: string
  name: string
  role: string
  avatar: string
  gradient: string
  greeting: string
  suggestions: string[]
}

export interface ModelState {
  id: string
  name: string
  isRateLimited: boolean
}
