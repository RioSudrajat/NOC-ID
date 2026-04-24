import Link from 'next/link'
import type { AssetModuleStatus } from '@/types/rwa'

interface AssetModuleCardProps {
  moduleNumber: number
  title: string
  subtitle: string
  description: string
  status: AssetModuleStatus
  examples: string[]
  cta: string
  ctaHref: string
}

const STATUS_CONFIG: Record<AssetModuleStatus, { border: string; overlay: string | null; badge: string | null; badgeBg: string; badgeColor: string }> = {
  active: {
    border: 'rgba(94, 234, 212, 0.4)',
    overlay: null,
    badge: 'Aktif',
    badgeBg: 'rgba(94, 234, 212, 0.15)',
    badgeColor: '#5EEAD4',
  },
  coming_soon: {
    border: 'rgba(252, 211, 77, 0.4)',
    overlay: '🔜 Berikutnya',
    badge: 'Segera',
    badgeBg: 'rgba(252, 211, 77, 0.15)',
    badgeColor: '#FCD34D',
  },
  future: {
    border: 'rgba(161, 161, 170, 0.3)',
    overlay: '🔮 Masa Depan',
    badge: 'Masa Depan',
    badgeBg: 'rgba(161, 161, 170, 0.1)',
    badgeColor: '#A1A1AA',
  },
}

export function AssetModuleCard({
  moduleNumber,
  title,
  subtitle,
  description,
  status,
  examples,
  cta,
  ctaHref,
}: AssetModuleCardProps) {
  const cfg = STATUS_CONFIG[status]
  const isDisabled = status !== 'active'

  return (
    <div
      className="relative glass-card rounded-2xl p-6 flex flex-col gap-4 overflow-hidden"
      style={{ border: `1px solid ${cfg.border}` }}
    >
      {/* Overlay for non-active */}
      {cfg.overlay && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl z-10"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
        >
          <span
            className="text-lg font-bold px-4 py-2 rounded-xl"
            style={{ background: 'rgba(30,34,42,0.9)', border: `1px solid ${cfg.border}`, color: cfg.badgeColor }}
          >
            {cfg.overlay}
          </span>
        </div>
      )}

      {/* Module number */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--solana-text-muted)' }}
        >
          Modul {moduleNumber.toString().padStart(2, '0')}
        </span>
        {cfg.badge && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: cfg.badgeBg, color: cfg.badgeColor, border: `1px solid ${cfg.border}` }}
          >
            {cfg.badge}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 className="font-bold text-xl gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          {title}
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--solana-text-muted)' }}>{subtitle}</p>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--solana-text-muted)' }}>
        {description}
      </p>

      {/* Examples */}
      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <span
            key={ex}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--solana-text-muted)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {ex}
          </span>
        ))}
      </div>

      {/* CTA */}
      {!isDisabled ? (
        <Link href={ctaHref} className="glow-btn text-sm font-semibold mt-auto text-center">
          {cta}
        </Link>
      ) : (
        <button
          disabled
          className="glow-btn-outline text-sm font-semibold mt-auto opacity-40 cursor-not-allowed"
          style={{ borderColor: cfg.border, color: cfg.badgeColor }}
        >
          {cta}
        </button>
      )}
    </div>
  )
}
