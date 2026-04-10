"use client";

/**
 * Backward-compatible shim — all state now lives in useBookingStore (Zustand).
 * Existing imports like `import { useBooking, workshopsData, isDataAccessActive, ... } from "@/context/BookingContext"`
 * continue to work via re-exports below.
 */

import { ReactNode, useEffect } from "react";
import { useBookingStore } from "@/store/useBookingStore";

// Re-export types so existing `import { Workshop, ... } from "@/context/BookingContext"` keeps working
export type {
  Workshop,
  WorkshopReview,
  BookingStatus,
  WarrantyClaimStatus,
  WarrantyClaimDraft,
  WarrantyClaimRecord,
  SessionType,
  InvoicePart,
  InvoiceData,
  ReviewData,
  BookingForm,
  BookingRequest,
  CompletedBooking,
  BookingNotification,
  WalkinParams,
  BookingMap,
} from "@/types/booking";

// Re-export data
export { workshopsData, workshopsById } from "@/data/workshops";

// Re-export helper
export { isDataAccessActive } from "@/lib/booking";

/**
 * BookingProvider now just hydrates the Zustand store on mount.
 * Kept as a wrapper so existing `<BookingProvider>` usage in Providers.tsx doesn't break.
 */
export function BookingProvider({ children }: { children: ReactNode }) {
  const hydrate = useBookingStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

/**
 * useBooking() hook — returns the same shape as the old context value.
 * Components can also import `useBookingStore` directly for granular selectors.
 */
export function useBooking() {
  const store = useBookingStore();

  // Derive activeBookings (non-null slots, newest first) — same as old useMemo
  const activeBookings = (Object.values(store.bookings).filter(Boolean) as NonNullable<typeof store.bookings[keyof typeof store.bookings]>[])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const legacyBooking = activeBookings[0] || null;

  return {
    bookings: store.bookings,
    activeBookings,
    booking: legacyBooking,
    submitBooking: store.submitBooking,
    createWalkinSession: store.createWalkinSession,
    acceptBooking: store.acceptBooking,
    rejectBooking: store.rejectBooking,
    startService: store.startService,
    sendInvoice: store.sendInvoice,
    attachWarrantyClaim: store.attachWarrantyClaim,
    payInvoice: store.payInvoice,
    signAnchoring: store.signAnchoring,
    submitReview: store.submitReview,
    reset: store.reset,
    completedBookings: store.completedBookings,
    bookingNotifications: store.bookingNotifications,
    warrantyClaims: store.warrantyClaims,
    updateWarrantyClaimStatus: store.updateWarrantyClaimStatus,
    resubmitWarrantyClaim: store.resubmitWarrantyClaim,
    markNotificationRead: store.markNotificationRead,
    markAllNotificationsRead: store.markAllNotificationsRead,
    deleteNotification: store.deleteNotification,
    addNotification: store.addNotification,
  };
}
