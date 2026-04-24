import type { RegisteredVehicle, MaintenanceFundEntry } from '@/types/rwa'
import { formatIDRX, formatKm } from '@/lib/yield'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface MaintenanceFundTrackerProps {
  vehicles: RegisteredVehicle[]
  fundLog: MaintenanceFundEntry[]
}

function getServiceStatus(v: RegisteredVehicle): { label: string; color: string; overdue: boolean } {
  const remaining = v.nextServiceKm - v.odometer
  if (remaining <= 0) return { label: 'Lewat jadwal', color: '#FCA5A5', overdue: true }
  if (remaining <= 300) return { label: 'Segera', color: '#FCD34D', overdue: false }
  return { label: 'Normal', color: '#86EFAC', overdue: false }
}

export function MaintenanceFundTracker({ vehicles, fundLog }: MaintenanceFundTrackerProps) {
  const overdueVehicles = vehicles.filter((v) => v.odometer >= v.nextServiceKm)

  return (
    <div className="flex flex-col gap-4">
      {/* Alert for overdue */}
      {overdueVehicles.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(252, 165, 165, 0.1)', border: '1px solid rgba(252, 165, 165, 0.3)' }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#FCA5A5' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>
              {overdueVehicles.length} unit melewati jadwal servis
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>
              {overdueVehicles.map((v) => v.unitId).join(', ')} — segera jadwalkan servis
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(94, 234, 212, 0.15)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(94, 234, 212, 0.07)', borderBottom: '1px solid rgba(94, 234, 212, 0.15)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>Unit ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>Fund Balance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>Servis Terakhir</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>Servis Berikutnya</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, idx) => {
              const svcStatus = getServiceStatus(v)
              const lastEntry = fundLog
                .filter((f) => f.vehicleId === v.id && f.type === 'release')
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]

              return (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: idx < vehicles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: svcStatus.overdue ? 'rgba(252, 165, 165, 0.04)' : 'transparent',
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-sm" style={{ color: '#5EEAD4' }}>{v.unitId}</span>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>{v.brand} {v.model}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatIDRX(v.maintenanceFundBalance)}</td>
                  <td className="px-4 py-3">
                    <div>{formatKm(v.lastServiceKm)}</div>
                    {lastEntry && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>
                        {lastEntry.serviceType ?? 'Servis umum'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>{formatKm(v.nextServiceKm)}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>
                      Odometer: {formatKm(v.odometer)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="flex items-center gap-1.5 text-xs font-semibold w-fit px-2 py-1 rounded-full"
                      style={{
                        background: `${svcStatus.color}20`,
                        color: svcStatus.color,
                        border: `1px solid ${svcStatus.color}40`,
                      }}
                    >
                      {svcStatus.overdue ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : svcStatus.label === 'Normal' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {svcStatus.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
