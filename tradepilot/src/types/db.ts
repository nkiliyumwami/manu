export type StrategyStatus = 'running' | 'stopped' | 'error'

export interface Strategy {
  id: string
  user_id: string
  name: string
  status: StrategyStatus
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Trade {
  id: string
  user_id: string
  strategy_id: string | null
  symbol: string
  side: string
  qty: number | null
  price: number | null
  pnl: number | null
  ts: string
}

export interface EventLog {
  id: string
  user_id: string
  strategy_id: string | null
  type: string
  message: string | null
  meta: Record<string, unknown> | null
  ts: string
}

export interface Settings {
  user_id: string
  webhook_url: string | null
  api_key: string | null
  preferences: Record<string, unknown> | null
  updated_at: string
}