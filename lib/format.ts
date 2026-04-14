/**
 * Shared formatting utilities for UnlockedVC.
 */

export function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export function fmtArrRange(r: string): string {
  const map: Record<string, string> = {
    '0-500k': '$0 – $500K',
    '500k-2m': '$500K – $2M',
    '2m-5m': '$2M – $5M',
    '5m-plus': '$5M+',
  }
  return map[r] ?? r
}

export function fmtStage(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Returns days until the given ISO date string. Negative if in the past. */
export function daysUntil(s: string): number {
  const now = Date.now()
  const target = new Date(s).getTime()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}
