export interface Workshop {
  id: string;
  name: string;
  location: string;
  city: string;
  address: string;
  rating: number;
  totalReviews: number;
  totalServices: number;
  verified: boolean;
  oem: boolean;
  specialization: string;
  phone: string;
  treasuryWallet?: string;
  operatingHours: { weekday: string; weekend: string };
  coordinates: { lat: number; lng: number };
  badges: string[];
  serviceBreakdown: Record<string, number>;
  reviews: WorkshopReview[];
}

export interface WorkshopReview {
  name: string;
  rating: number;
  date: string;
  comment: string;
  onChainVerified: boolean;
  vehicleType?: string;
}

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "IN_SERVICE"
  | "INVOICE_SENT"
  | "PAID"
  | "ANCHORING"
  | "ANCHORED"
  | "COMPLETED";

export type WarrantyClaimStatus = "Pending" | "Approved" | "Rejected";

export interface WarrantyClaimDraft {
  category: "Engine" | "Drivetrain" | "Electrical" | "Suspension" | "Body" | "Other";
  description: string;
  estimatedAmountIDR: number;
  evidencePhotos: string[];
  submittedByWorkshopId: string;
  submittedByWorkshopName: string;
  submittedAt: string;
  aiPreScore: number;
}

export interface WarrantyClaimRecord extends WarrantyClaimDraft {
  id: string;
  bookingId: string;
  vin: string;
  vehicleName: string;
  status: WarrantyClaimStatus;
  reimbursementIDR?: number;
  rejectionReason?: string;
  resubmissionCount?: number;
}

export type SessionType = "booking" | "walkin";

export interface InvoicePart {
  name: string;
  partNumber: string;
  manufacturer: string;
  price: number;
  isOEM: boolean;
  componentId?: string;
  componentName?: string;
  componentZone?: string;
  serviceAction?: "inspect" | "service" | "repair" | "replace";
  originStatus?: "unverified" | "pending" | "verified" | "non_oem" | "failed";
  originSignature?: string;
  originRecordPda?: string;
  originCatalogItemId?: string;
}

export interface InvoiceData {
  invoiceId?: string;
  parts: InvoicePart[];
  serviceCost: number;
  /** Internal workshop overhead (anchoring gas). NOT billed to customer -- kept for accounting. */
  gasFee: number;
  totalIDR: number;
  serviceType: string;
  serviceLevel?: string;
  serviceFocus?: string;
  mechanicNotes: string;
}

export interface ReviewData {
  rating: number;
  comment: string;
  onChainVerified: boolean;
}

export interface BookingForm {
  date: string;
  time: string;
  complaint: string;
  shareHistory: boolean;
  shareDigitalTwin: boolean;
  vehicleKey: string;
  vehicleName?: string;
  vehicleVin?: string;
}

export interface BookingRequest {
  id: string;
  type: SessionType;
  workshop: Workshop;
  form: BookingForm;
  status: BookingStatus;
  createdAt: string;
  invoice: InvoiceData | null;
  review: ReviewData | null;
  serviceLogId?: string;
  anchorTxSig?: string;
  passportTxSig?: string;
  warrantyClaim?: WarrantyClaimDraft;
}

// Completed booking for timeline/ledger integration
export interface CompletedBooking {
  id: string;
  bookingId: string;
  workshopName: string;
  workshopId: string;
  vehicleName: string;
  vehicleKey: string;
  vin: string;
  serviceType: string;
  date: string;
  parts: InvoicePart[];
  serviceCost: number;
  gasFee: number;
  totalIDR: number;
  mechanicNotes: string;
  review: ReviewData | null;
  completedAt: string;
  txSig: string;
}

// Notification item for booking events
export interface BookingNotification {
  id: string;
  type: "booking_pending" | "booking_accepted" | "booking_rejected" | "booking_service" | "booking_invoice" | "booking_paid" | "booking_completed" | "service_anchoring" | "service_anchored" | "warranty_submitted" | "warranty_update" | "recall_notice" | "kyc_change" | "audit_request" | "audit_submitted" | "mint_ready" | "vehicle_claimed" | "dispute_filed" | "dispute_resolved";
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetRole: "user" | "workshop" | "enterprise" | "admin";
}

export interface WalkinParams {
  vehicleKey: string;
  vehicleName: string;
  vin: string;
  workshopName: string;
}

/** Per-vehicle booking slot map. Independent sessions coexist without overwriting each other. */
export type BookingMap = Record<string, BookingRequest | null>;
