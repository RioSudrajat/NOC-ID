import { create } from "zustand";
import { vehicleData } from "@/context/ActiveVehicleContext";
import { workshopsData } from "@/data/workshops";
import { api, type ApiBooking, type ApiWorkshop } from "@/lib/api/client";
import { DEMO_VEHICLES, getVehicleDisplayName } from "@/types/vehicle";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
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
  for (const vehicle of DEMO_VEHICLES) {
    map[vehicle.vehicleId] = null;
    if (vehicle.legacyKey) map[vehicle.legacyKey] = null;
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
  syncFromBackend: () => Promise<void>;

  submitBooking: (workshop: Workshop, form: BookingForm) => void;
  createWalkinSession: (params: WalkinParams) => void;

  acceptBooking: (vehicleKey: string) => void;
  rejectBooking: (vehicleKey: string) => void;
  startService: (vehicleKey: string) => void;
  sendInvoice: (vehicleKey: string, invoice: InvoiceData) => void;
  
  payInvoice: (vehicleKey: string) => void;
  startAnchoring: (vehicleKey: string) => void;
  completeAnchoring: (vehicleKey: string, txSig: string) => void;
  failAnchoring: (vehicleKey: string) => void;
  
  attachWarrantyClaim: (vehicleKey: string, draft: Omit<WarrantyClaimRecord, "id" | "bookingId" | "vin" | "vehicleName" | "status">, vin: string, vehicleName: string) => void;

  submitReview: (vehicleKey: string, review: ReviewData) => void;

  reset: (vehicleKey?: string) => void;

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
  vehicleKey: string,
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

function mapApiWorkshop(workshop?: ApiWorkshop): Workshop {
  const fallback = workshopsData[0];
  if (!workshop) return fallback;
  const hasVerifiedSigner = workshop.credentials?.some((credential) => credential.credential === "verified_signer" && !credential.revokedAt) ?? false;
  const hasOem = workshop.credentials?.some((credential) => credential.credential === "oem_certified" && !credential.revokedAt) ?? false;
  return {
    id: workshop.id,
    name: workshop.name,
    location: workshop.city,
    city: workshop.city,
    address: workshop.address,
    rating: 4.8,
    totalReviews: 0,
    totalServices: 0,
    verified: workshop.status === "approved" || hasVerifiedSigner,
    oem: hasOem,
    specialization: hasOem ? "OEM Certified Service" : "General Service",
    phone: workshop.phone,
    treasuryWallet: workshop.treasuryWallet ?? undefined,
    operatingHours: { weekday: "08:00 - 17:00", weekend: "09:00 - 15:00" },
    coordinates: fallback.coordinates,
    badges: [
      workshop.status === "approved" || hasVerifiedSigner ? "Verified Signer" : "Pending KYC",
      ...(hasOem ? ["OEM Certified"] : []),
    ],
    serviceBreakdown: {},
    reviews: [],
  };
}

function resolveUiVehicleKey(booking: ApiBooking) {
  const vin = booking.vehicle?.vin;
  const demo = vin ? DEMO_VEHICLES.find((vehicle) => vehicle.vin === vin) : undefined;
  return demo?.legacyKey ?? booking.vehicleId;
}

function mapApiBooking(booking: ApiBooking): BookingRequest {
  const vehicleKey = resolveUiVehicleKey(booking);
  return {
    id: booking.id,
    type: booking.type,
    workshop: mapApiWorkshop(booking.workshop),
    form: {
      date: booking.date,
      time: booking.time,
      complaint: booking.complaint,
      shareHistory: true,
      shareDigitalTwin: false,
      vehicleKey,
      vehicleName: booking.vehicle ? getVehicleDisplayName(booking.vehicle) : undefined,
      vehicleVin: booking.vehicle?.vin,
    },
    status: booking.status,
    createdAt: booking.createdAt,
    invoice: booking.invoice ? {
      invoiceId: booking.invoice.id,
      serviceType: booking.invoice.serviceType,
      serviceCost: booking.invoice.serviceCost,
      gasFee: booking.invoice.gasFee,
      totalIDR: booking.invoice.totalIdr,
      mechanicNotes: booking.invoice.mechanicNotes ?? "",
      parts: booking.invoice.parts.map((part, index) => ({
        name: String(part.name ?? `Part ${index + 1}`),
        partNumber: String(part.partNumber ?? "-"),
        manufacturer: String(part.manufacturer ?? "NOC"),
        price: Number(part.price ?? part.priceIdr ?? 0),
        isOEM: Boolean(part.isOEM ?? true),
        originStatus: typeof part.originStatus === "string" ? part.originStatus as "unverified" | "pending" | "verified" | "non_oem" | "failed" : undefined,
        originSignature: typeof part.originSignature === "string" ? part.originSignature : undefined,
        originRecordPda: typeof part.originRecordPda === "string" ? part.originRecordPda : undefined,
        originCatalogItemId: typeof part.originCatalogItemId === "string" ? part.originCatalogItemId : undefined,
      })),
    } : null,
    review: null,
    serviceLogId: booking.serviceLog?.id ?? undefined,
    anchorTxSig: booking.serviceLog?.txSignature ?? booking.invoice?.payments?.find((payment) => payment.signature)?.signature ?? undefined,
  };
}

function findBackendVehicleId(vehicleKey: string) {
  const registry = useVehicleRegistryStore.getState();
  const vehicle = registry.getVehicleById(vehicleKey);
  if (vehicle && !vehicle.isDemo) return vehicle.vehicleId;
  const vin = vehicle?.vin ?? vehicleData[vehicleKey]?.vin;
  return registry.vehicles.find((item) => item.vin === vin && !item.isDemo)?.vehicleId ?? vehicle?.vehicleId ?? vehicleKey;
}

function getBookingVehicleSnapshot(vehicleKey: string) {
  const registry = useVehicleRegistryStore.getState();
  const vehicle = registry.getVehicleById(vehicleKey);
  if (vehicle) {
    return { vehicleName: getVehicleDisplayName(vehicle), vehicleVin: vehicle.vin };
  }
  const legacy = vehicleData[vehicleKey];
  return { vehicleName: legacy?.name, vehicleVin: legacy?.vin };
}

function clearMissingBooking(state: BookingState, vehicleKey: string) {
  const bookings = updateSlot(state.bookings, vehicleKey, () => null);
  persistBookings(bookings);
  return { bookings };
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

    syncFromBackend: async () => {
      try {
        const response = await api.bookings();
        const backendBookings = response.items.map(mapApiBooking);
        set(() => {
          const bookings = emptyBookingMap();
          for (const booking of backendBookings) {
            if (bookings[booking.form.vehicleKey]) continue;
            bookings[booking.form.vehicleKey] = booking;
          }
          persistBookings(bookings);
          return { bookings, hydrated: true };
        });
      } catch (error) {
        console.warn("[booking-store] backend sync skipped", error);
      }
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
      const vehicleSnapshot = getBookingVehicleSnapshot(form.vehicleKey);
      const newBooking: BookingRequest = {
        id: bookingId,
        type: "booking",
        workshop,
        form: { ...form, ...vehicleSnapshot },
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

      void api.createBooking({
        vehicleId: findBackendVehicleId(form.vehicleKey),
        workshopId: workshop.id,
        date: form.date,
        time: form.time,
        complaint: form.complaint,
      }).then((response) => {
        set((state) => {
          const mapped = mapApiBooking(response.booking);
          const bookings = updateSlot(state.bookings, form.vehicleKey, () => null);
          bookings[mapped.form.vehicleKey] = mapped;
          persistBookings(bookings);
          return { bookings };
        });
      }).catch((error) => {
        console.warn("[booking-store] backend booking create skipped", error);
      });
    },

    createWalkinSession: (params) => {
      const bookingId = `BK-${Date.now()}`;
      const workshop = workshopsData[0]; // fallback
      const newBooking: BookingRequest = {
        id: bookingId,
        type: "walkin",
        workshop,
        form: {
          vehicleKey: params.vehicleKey,
          vehicleName: params.vehicleName,
          vehicleVin: params.vin,
          date: new Date().toLocaleDateString("id-ID"),
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          complaint: "Walk-in service",
          shareHistory: true,
          shareDigitalTwin: true,
        },
        status: "ACCEPTED",
        createdAt: new Date().toISOString(),
        invoice: null,
        review: null,
      };

      set(state => {
        const bookings = updateSlot(state.bookings, params.vehicleKey, () => newBooking);
        persistBookings(bookings);
        return { bookings };
      });
    },
    acceptBooking: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "ACCEPTED" } : null);
        persistBookings(bookings);
        return { bookings };
      });
      const booking = get().bookings[vehicleKey];
      if (booking && !booking.id.startsWith("BK-")) void api.updateBookingStatus(booking.id, "ACCEPTED").then(() => get().syncFromBackend()).catch(() => set((state) => clearMissingBooking(state, vehicleKey)));
    },
    rejectBooking: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "REJECTED" } : null);
        persistBookings(bookings);
        return { bookings };
      });
      const booking = get().bookings[vehicleKey];
      if (booking && !booking.id.startsWith("BK-")) void api.updateBookingStatus(booking.id, "REJECTED").then(() => get().syncFromBackend()).catch(() => set((state) => clearMissingBooking(state, vehicleKey)));
    },
    startService: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "IN_SERVICE" } : null);
        persistBookings(bookings);
        return { bookings };
      });
      const booking = get().bookings[vehicleKey];
      if (booking && !booking.id.startsWith("BK-")) void api.updateBookingStatus(booking.id, "IN_SERVICE").then(() => get().syncFromBackend()).catch(() => set((state) => clearMissingBooking(state, vehicleKey)));
    },
    sendInvoice: (vehicleKey, invoice) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "INVOICE_SENT" as BookingStatus, invoice } : null);
        persistBookings(bookings);
        return { bookings };
      });
      const booking = get().bookings[vehicleKey];
      if (booking && !booking.id.startsWith("BK-")) {
        void api.createInvoice({
          bookingId: booking.id,
          serviceType: invoice.serviceType,
          serviceCost: invoice.serviceCost,
          gasFee: invoice.gasFee,
          totalIdr: invoice.totalIDR,
          mechanicNotes: invoice.mechanicNotes,
          parts: invoice.parts.map((part) => ({
            name: part.name,
            partNumber: part.partNumber,
            manufacturer: part.manufacturer,
            price: part.price,
            isOEM: part.isOEM,
            componentId: part.componentId,
            componentName: part.componentName,
            componentZone: part.componentZone,
            serviceAction: part.serviceAction,
            originStatus: part.originStatus,
            originSignature: part.originSignature,
            originRecordPda: part.originRecordPda,
            originCatalogItemId: part.originCatalogItemId,
          })),
        }).then(() => get().syncFromBackend()).catch((error) => {
          console.warn("[booking-store] backend invoice create skipped", error);
        });
      }
    },
    payInvoice: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "PAID" as BookingStatus } : null);
        persistBookings(bookings);
        return { bookings };
      });
      const booking = get().bookings[vehicleKey];
      if (booking && !booking.id.startsWith("BK-")) void api.updateBookingStatus(booking.id, "PAID").then(() => get().syncFromBackend()).catch(() => set((state) => clearMissingBooking(state, vehicleKey)));
    },
    startAnchoring: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "ANCHORING" as BookingStatus } : null);
        persistBookings(bookings);
        return { bookings };
      });
    },
    completeAnchoring: (vehicleKey, txSig) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "ANCHORED" as BookingStatus, anchorTxSig: txSig } : null);
        persistBookings(bookings);
        return { bookings };
      });
      const booking = get().bookings[vehicleKey];
      if (booking) void get().syncFromBackend();
    },
    failAnchoring: (vehicleKey) => {
      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => prev ? { ...prev, status: "PAID" as BookingStatus } : null);
        persistBookings(bookings);
        return { bookings };
      });
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
      let backendBookingId: string | null = null;

      set(state => {
        const bookings = updateSlot(state.bookings, vehicleKey, prev => {
          if (!prev || !prev.invoice) return prev;
          backendBookingId = prev.id.startsWith("BK-") ? null : prev.id;
          const updated = { ...prev, status: "COMPLETED" as BookingStatus, review };

          completedToAppend = {
            id: `SRV-${prev.id}`,
            bookingId: prev.id,
            workshopName: prev.workshop.name,
            workshopId: prev.workshop.id,
            vehicleName: prev.form.vehicleName || vehicleData[prev.form.vehicleKey]?.name || "",
            vehicleKey: prev.form.vehicleKey,
            vin: prev.form.vehicleVin || vehicleData[prev.form.vehicleKey]?.vin || "",
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
      if (backendBookingId) {
        void api.updateBookingStatus(backendBookingId, "COMPLETED").then(() => get().syncFromBackend()).catch((error) => {
          console.warn("[booking-store] backend review completion skipped", error);
        });
      }
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
