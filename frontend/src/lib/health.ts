/**
 * Shared health score utilities used across admin, enterprise, fleet, and UI components.
 */

export function getHealthColor(health: number): string {
  if (health >= 80) return "#86EFAC";
  if (health >= 60) return "#FCD34D";
  if (health >= 40) return "#FB923C";
  return "#FCA5A5";
}

export function getHealthStatus(health: number): string {
  if (health >= 80) return "Excellent";
  if (health >= 60) return "Good";
  if (health >= 40) return "Fair";
  return "Critical";
}

export function getHealthLabel(health: number): string {
  if (health >= 80) return "Excellent";
  if (health >= 60) return "Good";
  if (health >= 40) return "Warning";
  return "Critical";
}
