import type { BookingRequest } from "@/types/booking";

/** Helper: returns true when the booking is in a state where the workshop can access
 *  the customer's shared vehicle data (history / 3D twin). Walk-in sessions always
 *  grant access for their active phases. */
export function isDataAccessActive(booking: BookingRequest | null | undefined): boolean {
  if (!booking) return false;
  if (booking.type === "walkin") {
    return booking.status === "ACCEPTED" || booking.status === "IN_SERVICE" || booking.status === "INVOICE_SENT";
  }
  if (booking.status !== "ACCEPTED" && booking.status !== "IN_SERVICE" && booking.status !== "INVOICE_SENT") return false;
  return booking.form.shareHistory || booking.form.shareDigitalTwin;
}
