import type { VehicleCategory } from "@/types/vehicle";

export type AuditStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "minting"
  | "minted";

export interface ComponentHealthEntry {
  componentId: string;
  componentName: string;
  conditionScore: number;
  notes?: string;
}

export interface VehicleAuditReport {
  auditId: string;
  requestId?: string;
  workshopId: string;
  mechanicId: string;
  submittedForUserId: string;
  vin: string;
  frameNumber: string;
  engineNumber: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  bpkbFileRef?: string;
  stnkFileRef?: string;
  ownerNameOnDocs: string;
  odometerKm: number;
  odometerPhotoRef?: string;
  componentHealth: ComponentHealthEntry[];
  overallConditionScore: number;
  photoRefs: string[];
  diagnosticReportRef?: string;
  mechanicNotes: string;
  auditedAt: string;
  status: AuditStatus;
  reviewedByEnterpriseId?: string;
  reviewDecision?: "approved" | "rejected";
  reviewNotes?: string;
  reviewedAt?: string;
  mintedVehicleId?: string;
}

export type VehicleMintRequestStatus =
  | "requested"
  | "scheduled"
  | "in_audit"
  | "audit_submitted"
  | "enterprise_review"
  | "minted_escrow"
  | "claimed"
  | "rejected";

export interface VehicleMintRequest {
  requestId: string;
  userId: string;
  userName: string;
  userContact: string;
  workshopId: string;
  workshopName: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate?: string;
  preferredDate?: string;
  notes?: string;
  status: VehicleMintRequestStatus;
  createdAt: string;
  updatedAt: string;
  auditId?: string;
  mintedVehicleId?: string;
  rejectionReason?: string;
}

export interface AuditComponentTemplate {
  componentId: string;
  componentName: string;
  zone: string;
}

export const AUDIT_COMPONENT_TEMPLATES: Record<VehicleCategory, AuditComponentTemplate[]> = {
  car: [
    { componentId: "engine.block", componentName: "Engine Block", zone: "Engine" },
    { componentId: "engine.cooling", componentName: "Cooling System", zone: "Engine" },
    { componentId: "engine.fuel", componentName: "Fuel & Injection", zone: "Engine" },
    { componentId: "drivetrain.transmission", componentName: "Transmission", zone: "Drivetrain" },
    { componentId: "drivetrain.differential", componentName: "Differential", zone: "Drivetrain" },
    { componentId: "brakes.front", componentName: "Front Brake System", zone: "Brakes" },
    { componentId: "brakes.rear", componentName: "Rear Brake System", zone: "Brakes" },
    { componentId: "suspension.front", componentName: "Front Suspension", zone: "Suspension" },
    { componentId: "suspension.rear", componentName: "Rear Suspension", zone: "Suspension" },
    { componentId: "steering", componentName: "Steering Rack", zone: "Chassis" },
    { componentId: "electrical.battery", componentName: "Battery & Charging", zone: "Electrical" },
    { componentId: "electrical.ecu", componentName: "ECU & Sensors", zone: "Electrical" },
    { componentId: "body.frame", componentName: "Frame & Body", zone: "Body" },
    { componentId: "wheels.tires", componentName: "Wheels & Tires", zone: "Wheels" },
  ],
  motorcycle_matic: [
    { componentId: "engine.single", componentName: "Engine Assembly", zone: "Engine" },
    { componentId: "fuel.injection", componentName: "Injection System", zone: "Fuel" },
    { componentId: "cvt.belt", componentName: "CVT Belt", zone: "CVT" },
    { componentId: "cvt.roller", componentName: "Roller & Pulley", zone: "CVT" },
    { componentId: "brakes.front", componentName: "Front Brake", zone: "Brakes" },
    { componentId: "brakes.rear", componentName: "Rear Brake", zone: "Brakes" },
    { componentId: "suspension.front", componentName: "Front Fork", zone: "Suspension" },
    { componentId: "suspension.rear", componentName: "Rear Shock", zone: "Suspension" },
    { componentId: "electrical.battery", componentName: "Battery", zone: "Electrical" },
    { componentId: "electrical.lighting", componentName: "Lighting & Switches", zone: "Electrical" },
    { componentId: "frame", componentName: "Frame", zone: "Body" },
    { componentId: "wheels.tires", componentName: "Wheels & Tires", zone: "Wheels" },
  ],
  motorcycle_big: [
    { componentId: "engine.assembly", componentName: "Engine Assembly", zone: "Engine" },
    { componentId: "engine.cooling", componentName: "Cooling System", zone: "Engine" },
    { componentId: "drivetrain.clutch", componentName: "Clutch", zone: "Drivetrain" },
    { componentId: "drivetrain.final", componentName: "Final Drive", zone: "Drivetrain" },
    { componentId: "brakes.front", componentName: "Front Brake System", zone: "Brakes" },
    { componentId: "brakes.rear", componentName: "Rear Brake System", zone: "Brakes" },
    { componentId: "suspension.front", componentName: "Front Fork", zone: "Suspension" },
    { componentId: "suspension.rear", componentName: "Rear Suspension", zone: "Suspension" },
    { componentId: "electrical.battery", componentName: "Battery & Charging", zone: "Electrical" },
    { componentId: "electrical.ecu", componentName: "ECU & Sensors", zone: "Electrical" },
    { componentId: "frame", componentName: "Frame", zone: "Body" },
    { componentId: "wheels.tires", componentName: "Wheels & Tires", zone: "Wheels" },
  ],
};
