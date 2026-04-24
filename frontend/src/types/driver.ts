import { ContractType } from './rwa'

export type KYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected'

export interface DriverProfile {
  id: string
  phone: string
  fullName: string
  ktpNumber: string
  simNumber: string
  kycStatus: KYCStatus
  assignedVehicleId?: string
  assignedVehicleUnitId?: string  // e.g. "#NMS-0042"
  contractType: ContractType
  flatFeeDaily: number            // IDR (shown in Rupiah, driver doesn't see IDRX)
  operatorId: string
  joinedAt: string
}

export interface DriverDailyStatus {
  driverId: string
  date: string                    // YYYY-MM-DD
  gpsActive: boolean
  gpsActiveMinutes: number
  flatFeePaid: boolean
  flatFeeAmount: number           // IDR
  kmToday: number
  tripsToday: number
  activeHours: number
}

export interface DriverScheduleEntry {
  date: string
  startTime: string
  endTime: string
  zone: string
  vehicleUnitId: string
  notes?: string
}

export interface KYCDocument {
  type: 'ktp' | 'sim' | 'selfie'
  label: string
  status: KYCStatus
  uploadedAt?: string
  fileUrl?: string
  rejectionReason?: string
}

export interface ServiceReminder {
  vehicleUnitId: string
  kmUntilService: number
  serviceType: string
  urgency: 'ok' | 'soon' | 'overdue'
}
