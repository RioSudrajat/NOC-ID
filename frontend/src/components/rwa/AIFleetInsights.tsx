import type { AIFleetInsight } from '@/types/rwa'

interface AIFleetInsightsProps {
  insights: AIFleetInsight[]
}

const SEVERITY_CONFIG = {
  critical: {
    bg: 'rgba(252, 165, 165, 0.12)',
    border: 'rgba(252, 165, 165, 0.4)',
    leftBorder: '#FCA5A5',
    badgeBg: 'rgba(252, 165, 165, 0.2)',
    badgeColor: '#FCA5A5',
    label: 'Kritis',
    dot: '#FCA5A5',
  },
  warning: {
    bg: 'rgba(252, 211, 77, 0.08)',
    border: 'rgba(252, 211, 77, 0.25)',
    leftBorder: '#FCD34D',
    badgeBg: 'rgba(252, 211, 77, 0.15)',
    badgeColor: '#FCD34D',
    label: 'Perhatian',
    dot: '#FCD34D',
  },
  info: {
    bg: 'rgba(94, 234, 212, 0.07)',
    border: 'rgba(94, 234, 212, 0.2)',
    leftBorder: '#5EEAD4',
    badgeBg: 'rgba(94, 234, 212, 0.15)',
    badgeColor: '#5EEAD4',
    label: 'Info',
    dot: '#5EEAD4',
  },
}

const CATEGORY_ICON: Record<string, string> = {
  maintenance: '🔧',
  battery: '🔋',
  utilization: '📊',
  performance: '⚡',
}

export function AIFleetInsights({ insights }: AIFleetInsightsProps) {
  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight, idx) => {
        const cfg = SEVERITY_CONFIG[insight.severity]
        return (
          <div
            key={idx}
            className="rounded-xl p-4 flex gap-4 items-start"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderLeft: `3px solid ${cfg.leftBorder}`,
            }}
          >
            {/* Category icon */}
            <div className="text-xl shrink-0 mt-0.5">
              {CATEGORY_ICON[insight.category] ?? '🤖'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {insight.unitId && (
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--solana-text-muted)' }}
                  >
                    {insight.unitId}
                  </span>
                )}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
                >
                  {cfg.label}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--solana-text-muted)' }}
                >
                  {insight.category}
                </span>
              </div>

              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {insight.message}
              </p>

              <p className="text-xs" style={{ color: 'var(--solana-text-muted)' }}>
                Prediksi: {insight.prediction}
              </p>
            </div>

            {/* Confidence */}
            <div className="shrink-0 text-right">
              <div className="text-sm font-bold" style={{ color: cfg.badgeColor }}>
                {insight.confidence}%
              </div>
              <div className="text-xs" style={{ color: 'var(--solana-text-muted)' }}>
                keyakinan
              </div>
            </div>
          </div>
        )
      })}

      {insights.length === 0 && (
        <div
          className="text-center py-8 rounded-xl"
          style={{ background: 'rgba(94, 234, 212, 0.05)', border: '1px solid rgba(94, 234, 212, 0.15)' }}
        >
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-semibold" style={{ color: '#5EEAD4' }}>Semua unit dalam kondisi baik</p>
          <p className="text-xs mt-1" style={{ color: 'var(--solana-text-muted)' }}>Tidak ada insight aktif saat ini</p>
        </div>
      )}
    </div>
  )
}
