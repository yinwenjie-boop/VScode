export type Provider = 'deepseek' | 'claude' | 'openai' | 'kimi' | 'qwen' | 'custom'

export type TargetLevel = 'excellent' | 'good' | 'pass'

export interface ApiConfig {
  provider: Provider
  baseUrl: string
  apiKey: string
  model: string
  targetLevel: TargetLevel
}

export type FeedbackType = 'grammar' | 'word' | 'expression' | 'none'

export interface SentenceFeedback {
  original: string
  issue: string
  suggestion: string
  type: FeedbackType
}

export interface DimensionScores {
  content: number
  language: number
  structure: number
  writing: number
}

export interface GradeResult {
  total_score: number
  dimension_scores: DimensionScores
  sentence_feedback: SentenceFeedback[]
  overall_comment: string
  rewrite: string
  highlights: string[]
  key_improvements: string[]
}

export interface Topic {
  id: string
  title: string
  englishTitle: string
  requirements: string
  frequency: '高频' | '常考' | '中频'
  guidance: {
    analysis: string
    structure: string
    vocabulary: string
  }
}

export interface EssayRecord {
  id?: number
  topicId?: string
  topic: string
  requirements: string
  content: string
  result: GradeResult
  createdAt: number
}
