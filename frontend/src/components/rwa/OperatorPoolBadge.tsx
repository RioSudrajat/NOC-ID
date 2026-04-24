import type { OperatorType } from '@/types/fi'

interface OperatorPoolBadgeProps {
  type: OperatorType
  className?: string
}

const BADGE_CONFIG: Record<OperatorType, { label: string; bg: string; color: string; border: string }> = {
  nemesis_native: {
    label: 'Nemesis Native 🔵',
    bg: 'rgba(94, 234, 212, 0.15)',
    color: '#5EEAD4',
    border: 'rgba(94, 234, 212, 0.4)',
  },
  verified_partner: {
    label: 'Verified Partner',
    bg: 'rgba(45, 212, 191, 0.12)',
    color: '#2DD4BF',
    border: 'rgba(45, 212, 191, 0.35)',
  },
  independent: {
    label: 'Independent',
    bg: 'rgba(161, 161, 170, 0.1)',
    color: '#A1A1AA',
    border: 'rgba(161, 161, 170, 0.25)',
  },
}

export function OperatorPoolBadge({ type, className = '' }: OperatorPoolBadgeProps) {
  const cfg = BADGE_CONFIG[type]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}
