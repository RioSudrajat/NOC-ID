import pcxParts from "@/data/pcx150Parts.json";
import { LEGACY_VEHICLE_ID_MAP } from "@/types/vehicle";

export type ServiceAction = "inspect" | "service" | "repair" | "replace";

export interface VehicleServiceComponent {
  id: string;
  name: string;
  zone: string;
  recommendedAction?: ServiceAction;
  oemPartNumber?: string;
  manufacturer: string;
  estimatedPriceIDR: number;
}

interface PCXPartEntry {
  id: string;
  label: string;
  zone: string;
}

const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const makePartNumber = (vehiclePrefix: string, id: string) =>
  `${vehiclePrefix}-${id.replace(/[^A-Z0-9]/gi, "").slice(0, 10).toUpperCase()}`;

const pcxComponents: VehicleServiceComponent[] = (pcxParts as unknown as PCXPartEntry[]).map((part) => ({
  id: part.id,
  name: part.label,
  zone: titleCase(part.zone),
  recommendedAction: part.id.includes("Oil") || part.id.includes("Filter") || part.id.includes("Belt") ? "replace" : "service",
  oemPartNumber: makePartNumber("PCX", part.id),
  manufacturer: "Honda Motor Co.",
  estimatedPriceIDR: part.id.includes("Body") || part.id.includes("Frame")
    ? 0
    : part.id.includes("Belt") || part.id.includes("Brake") || part.id.includes("Tire")
      ? 350000
      : 150000,
}));

const bmwComponents: VehicleServiceComponent[] = [
  ["Engine.S58_Block", "S58 Engine Block", "Engine", "service", 0],
  ["Engine.OilFilter", "Oil Filter", "Engine", "replace", 180000],
  ["Fluids.EngineOil", "Engine Oil", "Fluids", "replace", 1450000],
  ["Engine.Turbo_L", "Left Turbocharger", "Engine", "service", 0],
  ["Engine.Turbo_R", "Right Turbocharger", "Engine", "service", 0],
  ["Cooling.Radiator", "Radiator", "Cooling", "service", 0],
  ["Cooling.WaterPump", "Water Pump", "Cooling", "replace", 3200000],
  ["Drivetrain.Gearbox_8AT", "8-Speed Gearbox", "Drivetrain", "service", 0],
  ["Drivetrain.RearDiff", "Rear Differential", "Drivetrain", "service", 0],
  ["Wheels.FL.BrakePad", "Front Left Brake Pad", "Brakes", "replace", 2400000],
  ["Wheels.FR.BrakePad", "Front Right Brake Pad", "Brakes", "replace", 2400000],
  ["Wheels.RL", "Rear Left Wheel Assembly", "Wheels", "service", 0],
  ["Wheels.RR", "Rear Right Wheel Assembly", "Wheels", "service", 0],
  ["Suspension.Strut_FL", "Front Left Strut", "Suspension", "service", 0],
  ["Suspension.Strut_FR", "Front Right Strut", "Suspension", "service", 0],
  ["Electrical.Battery", "Battery", "Electrical", "replace", 4200000],
].map(([id, name, zone, action, price]) => ({
  id: String(id),
  name: String(name),
  zone: String(zone),
  recommendedAction: action as ServiceAction,
  oemPartNumber: makePartNumber("BMW", String(id)),
  manufacturer: "BMW Group",
  estimatedPriceIDR: Number(price),
}));

const harleyComponents: VehicleServiceComponent[] = [
  ["Engine.RevMax1250T", "Revolution Max Engine", "Engine", "service", 0],
  ["Engine.OilCooler", "Oil Cooler", "Engine", "service", 0],
  ["Fluids.EngineOil", "Engine Oil", "Fluids", "replace", 950000],
  ["Drivetrain.BeltDrive", "Final Drive Belt", "Drivetrain", "replace", 2600000],
  ["Drivetrain.ClutchAssembly", "Clutch Assembly", "Drivetrain", "service", 0],
  ["Brakes.FrontCaliper", "Front Brake Caliper", "Brakes", "service", 0],
  ["Brakes.RearCaliper", "Rear Brake Caliper", "Brakes", "service", 0],
  ["Wheels.Front", "Front Wheel Assembly", "Wheels", "service", 0],
  ["Wheels.Rear", "Rear Wheel Assembly", "Wheels", "service", 0],
  ["Suspension.InvertedFork_L", "Left Front Fork", "Suspension", "service", 0],
  ["Suspension.InvertedFork_R", "Right Front Fork", "Suspension", "service", 0],
  ["Electrical.Battery", "Battery", "Electrical", "replace", 2100000],
].map(([id, name, zone, action, price]) => ({
  id: String(id),
  name: String(name),
  zone: String(zone),
  recommendedAction: action as ServiceAction,
  oemPartNumber: makePartNumber("HD", String(id)),
  manufacturer: "Harley-Davidson",
  estimatedPriceIDR: Number(price),
}));

const supraComponents: VehicleServiceComponent[] = [
  ["Engine.2JZ_Block", "2JZ-GTE Engine Block", "Engine", "service", 0],
  ["Engine.Oil_Filter", "Oil Filter", "Engine", "replace", 220000],
  ["Engine.Turbo_Kit", "Twin Turbo Assembly", "Engine", "service", 0],
  ["Engine.Intercooler", "Front-Mount Intercooler", "Engine", "service", 0],
  ["Engine.Radiator_Fan", "Radiator Fan", "Cooling", "service", 0],
  ["Engine.Transmission", "Getrag V160 Transmission", "Drivetrain", "service", 0],
  ["Engine.Driveshaft", "Driveshaft", "Drivetrain", "service", 0],
  ["Wheels.Tyre_FL", "Front Left Tyre", "Wheels", "replace", 4200000],
  ["Wheels.Tyre_FR", "Front Right Tyre", "Wheels", "replace", 4200000],
  ["Wheels.Disc_RR", "Rear Right Brake Disc", "Brakes", "replace", 1800000],
  ["Int.Steering_Wheel", "Steering Wheel Assembly", "Interior", "service", 0],
  ["Engine.Battery", "Battery", "Electrical", "replace", 1800000],
].map(([id, name, zone, action, price]) => ({
  id: String(id),
  name: String(name),
  zone: String(zone),
  recommendedAction: action as ServiceAction,
  oemPartNumber: makePartNumber("SUP", String(id)),
  manufacturer: "Toyota Motor Corp",
  estimatedPriceIDR: Number(price),
}));

export const vehicleServiceComponents: Record<string, VehicleServiceComponent[]> = {
  [LEGACY_VEHICLE_ID_MAP.bmw_m4]: bmwComponents,
  [LEGACY_VEHICLE_ID_MAP.harley]: harleyComponents,
  [LEGACY_VEHICLE_ID_MAP.pcx_150]: pcxComponents,
  [LEGACY_VEHICLE_ID_MAP.supra]: supraComponents,
};

export function getComponentsByVehicleId(vehicleId: string) {
  return vehicleServiceComponents[LEGACY_VEHICLE_ID_MAP[vehicleId as keyof typeof LEGACY_VEHICLE_ID_MAP] ?? vehicleId] ?? [];
}

export function getServiceZones(vehicleId: string) {
  return Array.from(new Set(getComponentsByVehicleId(vehicleId).map((part) => part.zone))).sort();
}

export function getVehicleServiceComponents(vehicleId: string, zone?: string) {
  const parts = getComponentsByVehicleId(vehicleId);
  return zone ? parts.filter((part) => part.zone === zone) : parts;
}
