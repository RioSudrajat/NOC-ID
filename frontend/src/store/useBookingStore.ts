import { create } from "zustand";
import { VehicleKey, vehicleData } from "@/context/ActiveVehicleContext";
import { workshopsData } from "@/data/workshops";
import type {
  BookingMap,
  BookingRequest,
  BookingNotification,
  BookingStatus,
  CompletedBooking,
  WarrantyClaimDraft,
  WarrantyClaimRecord,
  WarrantyClaimStatus,
  Workshop,
  BookingForm,
  InvoiceData,
  ReviewData,
  WalkinParams,
} from "@/types/booking";

/* ── Storage helpers ── */

const STORAGE_KEY = "noc-booking-state-v2";
const LEGACY_STORAGE_KEY = "noc-booking-state";
const COMPLETED_KEY = "noc-completed-bookings";
const NOTIF_KEY = "noc-booking-notifications";
const WARRANTY_KEY = "noc-warranty-claims";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function emptyBookingMap(): BookingMap {
  const map = {} as BookingMap;
  for (const key of Object.keys(vehicleData) as VehicleKey[]) {
    map[key] = null;
  }
  return map;
}

function formatTimeAgo(): string {
  return "Baru saja";
}

/* ── Store shape ── */

interface BookingState {
  bookings: BookingMap;
  completedBookings: CompletedBooking[];
  bookingNotifications: BookingNotification[];
  warrantyClaims: WarrantyClaimRecord[];
  hydrated: boolean;
}

interface BookingActions {
  /** Call once on mount to hydrate from localStorage */
  hydrate: () => void;

  submitBooking: (workshop: Workshop, form: BookingForm) => void;
  createWalkinSession: (params: WalkinParams) => void;

  acceptBooking: (vehicleKey: VehicleKey) => void;
  rejectBooking: (vehicleKey: VehicleKey) => void;
  startService: (vehicleKey: VehicleKey) => void;
  sendInvoice: (vehicleKey: VehicleKey, invoice: InvoiceData) => void;
  attachWarrantyClaim: (vehicleKey: VehicleKey, draft: WarrantyClaimDraft, vin: string, vehicleName: string) => void;

  payInvoice: (vehicleKey: VehicleKey) => void;
  signAnchoring: (vehicleKey: VehicleKey) => void;
  submitReview: (vehicleKey: VehicleKey, review: ReviewData) => void;

  reset: (vehicleKey?: VehicleKey) => void;

  updateWarrantyClaimStatus: (id: string, status: WarrantyClaimStatus, opts?: { reimbursementIDR?: number; rejectionReason?: string }) => void;
  resubmitWarrantyClaim: (id: string, updates: { description: string; evidencePhotos: string[] }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (role: BookingNotification["targetRole"]) => void;
  deleteNotification: (id: string) => void;
  addNotification: (type: BookingNotification["type"], title: string, message: string, targetRole: BookingNotification["targetRole"]) => void;
}

export type BookingStore = BookingState & BookingActions;

/* ── Helpers for within set() ── */

function updateSlot(
  bookings: BookingMap,
  vehicleKey: VehicleKey,
  updater: (prev: BookingRequest | null) => BookingRequest | null,
): BookingMap {
  return { ...bookings, [vehicleKey]: updater(bookings[vehicleKey] ?? null) };
}

function pushNotification(
  prev: BookingNotification[],
  type: BookingNotification["type"],
  title: string,
  message: string,
  targetRole: BookingNotification["targetRole"],
): BookingNotification[] {
  const notif: BookingNotification = {
    id: `BN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    time: formatTimeAgo(),
    read: false,
    targetRole,
  };
  return [notif, ...prev];
}

/* ── Persistence middleware (subscribe-based) ── */

function persistBookings(bookings: BookingMap) {
  const hasAny = Object.values(bookings).some(Boolean);
  if (hasAny) {
    saveJSON(STORAGE_KEY, bookings);
  } else if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Always clear legacy key
  if (typeof window !== "undefined") {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

/* ── Store ── */

export const useBookingStore = create<BookingStore>((set, get) => {
  // Set up cross-tab sync via storage events
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as BookingMap;
            set({ bookings: { ...emptyBookingMap(), ...parsed } });
          } catch {
            set({ bookings: emptyBookingMap() });
          }
        } else {
          set({ bookings: emptyBookingMap() });
        }
      } else if (e.key === COMPLETED_KEY) {
        set({ completedBookings: e.newValue ? JSON.parse(e.newValue) : [] });
      } else if (e.key === NOTIF_KEY) {
        set({ bookingNotifications: e.newValue ? JSON.parse(e.newValue) : [] });
      } else if (e.key === WARRANTY_KEY) {
        set({ warrantyClaims: e.newValue ? JSON.parse(e.newValue) : [] });
      }
    });
  }

  return {
    /* ── Initial state ── */
    bookings: emptyBookingMap(),
    completedBookings: [],
    bookingNotifications: [],
    warrantyClaims: [],
    hydrated: false,

    /* ── Hydrate ── */
    hydrate: () => {
      if (get().hydrated) return;

      // Prefer v2 per-vehicle slot map
      const v2 = loadJSON<BookingMap | null>(STORAGE_KEY, null);
      let bookings: BookingMap;
      if (v2 && typeof v2 === "object") {
        bookings = { ...emptyBookingMap(), ...v2 };
      } else {
        // Legacy migration
        const legacy = loadJSON<BookingRequest | null>(LEGACY_STORAGE_KEY, null);
        if (legacy && legacy.form?.vehicleKey) {
          const migrated = emptyBookingMap();
          migrated[legacy.form.vehicleKey] = legacy;
          bookings = migrated;
        } else {
          bookings = emptyBookingMap();
        }
      }

      // Deduplicate completed bookings
      const rawCompleted = loadJSON<CompletedBooking[]>(COMPLETED_KEY, []);
      const seen = new Set<string>();
      const completedBookings = rawCompleted.filter(cb => {
        if (seen.has(cb.bookingId)) return false;
        seen.add(cb.bookingId);
        return true;
      });

      set({
        bookings,
        completedBookings,
        bookingNotifications: loadJSON<BookingNotification[]>(NOTIF_KEY, []),
        warrantyClaims: loadJSON<WarrantyClaimRecord[]>(WARRANTY_KEY, []),
        hydrated: true,
      });
    },

    /* ── Actions ── */

    addNotification: (type, title, message, targetRole) => {
      set(state => {
        const bookingNotifications = pushNotification(state.bookingNotifications, type, title, message, targetRole);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookingNotifications };
      });
    },

    submitBooking: (workshop, form) => {
      const bookingId = `BK-${Date.now()}`;
      const newBooking: BookingRequest = {
        id: bookingId,
        type: "booking",
        workshop,
        form,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        invoice: null,
        review: null,
      };
      set(state => {
        const bookings = updateSlot(state.bookings, form.vehicleKey, () => newBooking);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "booking_pending",
          "Booking Baru Masuk!",
          `Permintaan booking dari pelanggan untuk ${form.date} pukul ${form.time}. Keluhan: ${form.complaint.slice(0, 60)}...`,
          "workshop"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookings, bookingNotifications };
      });
    },

    createWalkinSession: (params) => {
      const mockWorkshop = workshopsData[0];
      const walkin: BookingRequest = {
        id: `WI-${Date.now()}`,
        type: "walkin",
        workshop: mockWorkshop,
        form: {
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          complaint: "Walk-in \u2013 datang langsung ke bengkel",
          shareHistory: true,
          shareDigitalTwin: false,
          vehicleKey: params.vehicleKey,
        },
        status: "ACCEPTED",
        createdAt: new Date().toISOString(),
        invoice: null,
        review: null,
      };
      set(state => {
        const bookings = updateSlot(state.bookings, params.vehicleKey, () => walkin);
        let notifs = pushNotification(
          state.bookingNotifications,
          "booking_accepted",
          "Kendaraan Masuk Antrian Bengkel \uD83D\uDD27",
          `${params.vehicleName} telah terdaftar di ${params.workshopName}. Pantau status servis Anda.`,
          "user"
        );
        notifs = pushNotification(
          notifs,
          "booking_pending",
          `Walk-In: ${params.vehicleName}`,
          `Kendaraan datang langsung. VIN: ${params.vin}. Siapkan mekanik.`,
          "workshop"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, notifs);
        return { bookings, bookingNotifications: notifs };
      });
    },

    acceptBooking: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "ACCEPTED" } : null);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "booking_accepted",
          "Booking Diterima! \u2705",
          "Bengkel telah mengkonfirmasi booking Anda. Kendaraan sedang dianalisis. Datang sesuai jadwal.",
          "user"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookings, bookingNotifications };
      });
    },

    rejectBooking: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "REJECTED" } : null);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "booking_rejected",
          "Booking Ditolak",
          "Mohon maaf, bengkel tidak dapat menerima booking pada waktu yang dipilih. Silakan cari bengkel lain.",
          "user"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookings, bookingNotifications };
      });
    },

    startService: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "IN_SERVICE" } : null);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "booking_service",
          "Kendaraan Sedang Diservis \uD83D\uDD27",
          "Mekanik sudah mulai mengerjakan kendaraan Anda. Invoice akan dikirim setelah servis selesai.",
          "user"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookings, bookingNotifications };
      });
    },

    sendInvoice: (vehicleKey, invoice) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "INVOICE_SENT", invoice } : null);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "booking_invoice",
          "Invoice Diterima \uD83D\uDCC4",
          `Invoice servis sebesar Rp ${invoice.totalIDR.toLocaleString("id-ID")} telah dikirim. Silakan lakukan pembayaran.`,
          "user"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookings, bookingNotifications };
      });
    },

    payInvoice: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "PAID" } : null);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "booking_paid",
          "Pembayaran Diterima \uD83D\uDCB0",
          "Pelanggan telah menyelesaikan pembayaran. Silakan tandatangani transaksi anchoring untuk mencatat log servis on-chain.",
          "workshop"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookings, bookingNotifications };
      });
    },

    signAnchoring: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "ANCHORING" } : null);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "service_anchoring",
          "Menandatangani Log Servis \u23F3",
          "Wallet bengkel sedang menandatangani pembaruan cNFT pada tree enterprise.",
          "workshop"
        );
        persistBookings(bookings);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookings, bookingNotifications };
      });

      // Simulate async anchoring completion
      setTimeout(() => {
        const txSig = `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`;
        set(state => {
          const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "ANCHORED", anchorTxSig: txSig } : null);
          let notifs = pushNotification(
            state.bookingNotifications,
            "service_anchored",
            "Log Servis Tercatat On-Chain \u2705",
            `Riwayat servis telah di-anchor ke Solana. Tx: ${txSig}`,
            "user"
          );
          notifs = pushNotification(
            notifs,
            "service_anchored",
            "Anchoring Selesai \u2705",
            `Log servis berhasil dicatat on-chain. Tx: ${txSig}`,
            "workshop"
          );
          persistBookings(bookings);
          saveJSON(NOTIF_KEY, notifs);
          return { bookings, bookingNotifications: notifs };
        });
      }, 2500);
    },

    attachWarrantyClaim: (vehicleKey, draft, vin, vehicleName) => {
      const recordId = `WC-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, warrantyClaim: draft } : null);

        let warrantyClaims = state.warrantyClaims;
        if (!warrantyClaims.some(c => c.id === recordId)) {
          const bookingId = `BK-${Date.now()}`;
          const record: WarrantyClaimRecord = {
            ...draft,
            id: recordId,
            bookingId,
            vin,
            vehicleName,
            status: "Pending",
          };
          warrantyClaims = [record, ...warrantyClaims];
        }

        let notifs = pushNotification(
          state.bookingNotifications,
          "warranty_submitted",
          "Klaim Garansi Diajukan \uD83D\uDEE1\uFE0F",
          `${draft.submittedByWorkshopName} mengajukan klaim garansi: ${draft.description.slice(0, 60)}...`,
          "enterprise"
        );
        notifs = pushNotification(
          notifs,
          "warranty_submitted",
          "Klaim Garansi Terkirim \uD83D\uDEE1\uFE0F",
          `Klaim garansi Anda untuk ${vehicleName} sedang ditinjau enterprise.`,
          "user"
        );

        persistBookings(bookings);
        saveJSON(WARRANTY_KEY, warrantyClaims);
        saveJSON(NOTIF_KEY, notifs);
        return { bookings, warrantyClaims, bookingNotifications: notifs };
      });
    },

    updateWarrantyClaimStatus: (id, status, opts) => {
      set(state => {
        let target: WarrantyClaimRecord | undefined;
        const warrantyClaims = state.warrantyClaims.map(c => {
          if (c.id !== id) return c;
          target = c;
          return {
            ...c,
            status,
            reimbursementIDR: opts?.reimbursementIDR ?? c.reimbursementIDR,
            rejectionReason: opts?.rejectionReason ?? c.rejectionReason,
          };
        });

        let notifs = state.bookingNotifications;
        if (target) {
          if (status === "Approved") {
            notifs = pushNotification(
              notifs,
              "warranty_update",
              "Klaim Garansi Disetujui \u2705",
              `Klaim untuk ${target.vehicleName} disetujui. Reimbursement: Rp ${(opts?.reimbursementIDR ?? target.estimatedAmountIDR).toLocaleString("id-ID")}.`,
              "workshop"
            );
            notifs = pushNotification(
              notifs,
              "warranty_update",
              "Klaim Garansi Anda Disetujui \u2705",
              `Garansi untuk ${target.vehicleName} disetujui enterprise.`,
              "user"
            );
          } else if (status === "Rejected") {
            notifs = pushNotification(
              notifs,
              "warranty_update",
              "Klaim Garansi Ditolak \u274C",
              `Klaim untuk ${target.vehicleName} ditolak. Alasan: ${opts?.rejectionReason || "-"}. Anda dapat mengajukan ulang dengan bukti tambahan.`,
              "workshop"
            );
          }
        }

        saveJSON(WARRANTY_KEY, warrantyClaims);
        saveJSON(NOTIF_KEY, notifs);
        return { warrantyClaims, bookingNotifications: notifs };
      });
    },

    resubmitWarrantyClaim: (id, updates) => {
      set(state => {
        const warrantyClaims = state.warrantyClaims.map(c => c.id === id ? {
          ...c,
          status: "Pending" as const,
          description: updates.description,
          evidencePhotos: updates.evidencePhotos,
          resubmissionCount: (c.resubmissionCount ?? 0) + 1,
          submittedAt: new Date().toISOString(),
        } : c);
        const bookingNotifications = pushNotification(
          state.bookingNotifications,
          "warranty_submitted",
          "Klaim Garansi Diajukan Ulang \uD83D\uDD01",
          "Bengkel mengajukan ulang klaim garansi dengan bukti tambahan.",
          "enterprise"
        );
        saveJSON(WARRANTY_KEY, warrantyClaims);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { warrantyClaims, bookingNotifications };
      });
    },

    submitReview: (vehicleKey, review) => {
      let completedToAppend: CompletedBooking | null = null;

      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => {
          if (!prev || !prev.invoice) return prev;
          const updated = { ...prev, status: "COMPLETED" as BookingStatus, review };

          completedToAppend = {
            id: `SRV-${prev.id}`,
            bookingId: prev.id,
            workshopName: prev.workshop.name,
            workshopId: prev.workshop.id,
            vehicleName: vehicleData[prev.form.vehicleKey]?.name || "",
            vehicleKey: prev.form.vehicleKey,
            vin: vehicleData[prev.form.vehicleKey]?.vin || "",
            serviceType: prev.invoice!.serviceType,
            date: new Date().toISOString().split("T")[0],
            parts: prev.invoice!.parts,
            serviceCost: prev.invoice!.serviceCost,
            gasFee: prev.invoice!.gasFee,
            totalIDR: prev.invoice!.totalIDR,
            mechanicNotes: prev.invoice!.mechanicNotes,
            review,
            completedAt: new Date().toISOString(),
            txSig: `${prev.id.slice(-4)}...${prev.workshop.id.slice(-4)}`,
          };

          return updated;
        });

        let completedBookings = state.completedBookings;
        if (completedToAppend) {
          const appendId = (completedToAppend as CompletedBooking).bookingId;
          if (!completedBookings.some(cb => cb.bookingId === appendId)) {
            completedBookings = [completedToAppend as CompletedBooking, ...completedBookings];
          }
        }

        let notifs = pushNotification(
          state.bookingNotifications,
          "booking_completed",
          `Review Baru: ${review.rating}/5 \u2B50`,
          review.comment || "Pelanggan memberikan review tanpa komentar.",
          "workshop"
        );
        notifs = pushNotification(
          notifs,
          "booking_completed",
          "Servis Selesai & Tercatat On-Chain \u2705",
          "Riwayat servis telah di-anchor ke Solana. Review Anda telah diverifikasi on-chain.",
          "user"
        );

        persistBookings(bookings);
        saveJSON(COMPLETED_KEY, completedBookings);
        saveJSON(NOTIF_KEY, notifs);
        return { bookings, completedBookings, bookingNotifications: notifs };
      });
    },

    reset: (vehicleKey) => {
      set(state => {
        const bookings = vehicleKey
          ? updateSlot(state.bookings, vehicleKey, () => null)
          : emptyBookingMap();
        persistBookings(bookings);
        return { bookings };
      });
    },

    markNotificationRead: (id) => {
      set(state => {
        const bookingNotifications = state.bookingNotifications.map(n => n.id === id ? { ...n, read: true } : n);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookingNotifications };
      });
    },

    markAllNotificationsRead: (role) => {
      set(state => {
        const bookingNotifications = state.bookingNotifications.map(n => n.targetRole === role ? { ...n, read: true } : n);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookingNotifications };
      });
    },

    deleteNotification: (id) => {
      set(state => {
        const bookingNotifications = state.bookingNotifications.filter(n => n.id !== id);
        saveJSON(NOTIF_KEY, bookingNotifications);
        return { bookingNotifications };
      });
    },
  };
});
