"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { VehicleKey } from "./ActiveVehicleContext";

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
  | "COMPLETED";

export type SessionType = "booking" | "walkin";

export interface InvoicePart {
  name: string;
  partNumber: string;
  manufacturer: string;
  price: number;
  isOEM: boolean;
}

export interface InvoiceData {
  parts: InvoicePart[];
  serviceCost: number;
  gasFee: number;
  totalIDR: number;
  serviceType: string;
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
  vehicleKey: VehicleKey;
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
}

// Completed booking for timeline/ledger integration
export interface CompletedBooking {
  id: string;
  bookingId: string;
  workshopName: string;
  workshopId: string;
  vehicleName: string;
  vehicleKey: VehicleKey;
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
  type: "booking_pending" | "booking_accepted" | "booking_rejected" | "booking_service" | "booking_invoice" | "booking_paid" | "booking_completed" | "warranty_update" | "recall_notice" | "kyc_change" | "dispute_filed" | "dispute_resolved";
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetRole: "user" | "workshop" | "enterprise" | "admin";
}

export interface WalkinParams {
  vehicleKey: VehicleKey;
  vehicleName: string;
  vin: string;
  workshopName: string;
}

interface BookingContextType {
  booking: BookingRequest | null;
  submitBooking: (workshop: Workshop, form: BookingForm) => void;
  createWalkinSession: (params: WalkinParams) => void;
  // Workshop-side actions
  acceptBooking: () => void;
  rejectBooking: () => void;
  startService: () => void;
  sendInvoice: (invoice: InvoiceData) => void;
  // User-side actions
  payInvoice: () => void;
  submitReview: (review: ReviewData) => void;
  reset: () => void;
  dataAccessActive: boolean;
  // Completed bookings & notifications
  completedBookings: CompletedBooking[];
  bookingNotifications: BookingNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (role: BookingNotification["targetRole"]) => void;
  deleteNotification: (id: string) => void;
  addNotification: (type: BookingNotification["type"], title: string, message: string, targetRole: BookingNotification["targetRole"]) => void;
}

const STORAGE_KEY = "noc-booking-state";
const COMPLETED_KEY = "noc-completed-bookings";
const NOTIF_KEY = "noc-booking-notifications";

const BookingContext = createContext<BookingContextType | undefined>(undefined);

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

function formatTimeAgo(): string {
  return "Baru saja";
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [bookingNotifications, setBookingNotifications] = useState<BookingNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setBooking(loadJSON<BookingRequest | null>(STORAGE_KEY, null));
    // Deduplicate by bookingId on load to clean up any existing duplicates
    const raw = loadJSON<CompletedBooking[]>(COMPLETED_KEY, []);
    const seen = new Set<string>();
    const deduped = raw.filter(cb => {
      if (seen.has(cb.bookingId)) return false;
      seen.add(cb.bookingId);
      return true;
    });
    setCompletedBookings(deduped);
    setBookingNotifications(loadJSON<BookingNotification[]>(NOTIF_KEY, []));
    setHydrated(true);
  }, []);

  // Persist on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (booking) {
      saveJSON(STORAGE_KEY, booking);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [booking, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveJSON(COMPLETED_KEY, completedBookings);
  }, [completedBookings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveJSON(NOTIF_KEY, bookingNotifications);
  }, [bookingNotifications, hydrated]);

  // Sync across browser tabs via storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setBooking(e.newValue ? JSON.parse(e.newValue) : null);
      } else if (e.key === COMPLETED_KEY) {
        setCompletedBookings(e.newValue ? JSON.parse(e.newValue) : []);
      } else if (e.key === NOTIF_KEY) {
        setBookingNotifications(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addNotification = useCallback((
    type: BookingNotification["type"],
    title: string,
    message: string,
    targetRole: BookingNotification["targetRole"]
  ) => {
    const notif: BookingNotification = {
      id: `BN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message,
      time: formatTimeAgo(),
      read: false,
      targetRole,
    };
    setBookingNotifications((prev) => [notif, ...prev]);
  }, []);

  const submitBooking = useCallback((workshop: Workshop, form: BookingForm) => {
    const bookingId = `BK-${Date.now()}`;
    setBooking({
      id: bookingId,
      type: "booking",
      workshop,
      form,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      invoice: null,
      review: null,
    });
    // Notify workshop
    addNotification(
      "booking_pending",
      "Booking Baru Masuk!",
      `Permintaan booking dari pelanggan untuk ${form.date} pukul ${form.time}. Keluhan: ${form.complaint.slice(0, 60)}...`,
      "workshop"
    );
  }, [addNotification]);

  const createWalkinSession = useCallback((params: WalkinParams) => {
    // Find the mock workshop or build a minimal one
    const mockWorkshop = workshopsData[0]; // default to first workshop
    setBooking({
      id: `WI-${Date.now()}`,
      type: "walkin",
      workshop: mockWorkshop,
      form: {
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        complaint: "Walk-in – datang langsung ke bengkel",
        shareHistory: true,
        shareDigitalTwin: false,
        vehicleKey: params.vehicleKey,
      },
      status: "ACCEPTED", // walk-in starts accepted (physically present)
      createdAt: new Date().toISOString(),
      invoice: null,
      review: null,
    });
    addNotification(
      "booking_accepted",
      "Kendaraan Masuk Antrian Bengkel 🔧",
      `${params.vehicleName} telah terdaftar di ${params.workshopName}. Pantau status servis Anda.`,
      "user"
    );
    addNotification(
      "booking_pending",
      `Walk-In: ${params.vehicleName}`,
      `Kendaraan datang langsung. VIN: ${params.vin}. Siapkan mekanik.`,
      "workshop"
    );
  }, [addNotification]);

  const acceptBooking = useCallback(() => {
    setBooking((prev) => prev ? { ...prev, status: "ACCEPTED" } : null);
    addNotification(
      "booking_accepted",
      "Booking Diterima! ✅",
      "Bengkel telah mengkonfirmasi booking Anda. Kendaraan sedang dianalisis. Datang sesuai jadwal.",
      "user"
    );
  }, [addNotification]);

  const rejectBooking = useCallback(() => {
    setBooking((prev) => prev ? { ...prev, status: "REJECTED" } : null);
    addNotification(
      "booking_rejected",
      "Booking Ditolak",
      "Mohon maaf, bengkel tidak dapat menerima booking pada waktu yang dipilih. Silakan cari bengkel lain.",
      "user"
    );
  }, [addNotification]);

  const startService = useCallback(() => {
    setBooking((prev) => prev ? { ...prev, status: "IN_SERVICE" } : null);
    addNotification(
      "booking_service",
      "Kendaraan Sedang Diservis 🔧",
      "Mekanik sudah mulai mengerjakan kendaraan Anda. Invoice akan dikirim setelah servis selesai.",
      "user"
    );
  }, [addNotification]);

  const sendInvoice = useCallback((invoice: InvoiceData) => {
    setBooking((prev) => prev ? { ...prev, status: "INVOICE_SENT", invoice } : null);
    addNotification(
      "booking_invoice",
      "Invoice Diterima 📄",
      `Invoice servis sebesar Rp ${invoice.totalIDR.toLocaleString("id-ID")} telah dikirim. Silakan lakukan pembayaran.`,
      "user"
    );
  }, [addNotification]);

  const payInvoice = useCallback(() => {
    setBooking((prev) => prev ? { ...prev, status: "PAID" } : null);
    addNotification(
      "booking_paid",
      "Pembayaran Diterima 💰",
      "Pelanggan telah menyelesaikan pembayaran. Menunggu review.",
      "workshop"
    );
  }, [addNotification]);

  const submitReview = useCallback((review: ReviewData) => {
    setBooking((prev) => {
      if (!prev || !prev.invoice) return prev;
      const updated = { ...prev, status: "COMPLETED" as BookingStatus, review };

      // Create completed booking entry for timeline/ledger
      // Use deterministic ID so double-invocation (React StrictMode) doesn't produce duplicates
      const completed: CompletedBooking = {
        id: `SRV-${prev.id}`,
        bookingId: prev.id,
        workshopName: prev.workshop.name,
        workshopId: prev.workshop.id,
        vehicleName: "",
        vehicleKey: prev.form.vehicleKey,
        vin: "",
        serviceType: prev.invoice.serviceType,
        date: new Date().toISOString().split("T")[0],
        parts: prev.invoice.parts,
        serviceCost: prev.invoice.serviceCost,
        gasFee: prev.invoice.gasFee,
        totalIDR: prev.invoice.totalIDR,
        mechanicNotes: prev.invoice.mechanicNotes,
        review,
        completedAt: new Date().toISOString(),
        txSig: `${prev.id.slice(-4)}...${prev.workshop.id.slice(-4)}`,
      };

      setCompletedBookings((existing) => {
        // Prevent duplicate if updater runs more than once
        if (existing.some(cb => cb.bookingId === prev.id)) return existing;
        return [completed, ...existing];
      });

      // Notify workshop about review
      addNotification(
        "booking_completed",
        `Review Baru: ${review.rating}/5 ⭐`,
        review.comment || "Pelanggan memberikan review tanpa komentar.",
        "workshop"
      );

      // Notify user about completion
      addNotification(
        "booking_completed",
        "Servis Selesai & Tercatat On-Chain ✅",
        "Riwayat servis telah di-anchor ke Solana. Review Anda telah diverifikasi on-chain.",
        "user"
      );

      return updated;
    });
  }, [addNotification]);

  const reset = useCallback(() => setBooking(null), []);

  const markNotificationRead = useCallback((id: string) => {
    setBookingNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback((role: BookingNotification["targetRole"]) => {
    setBookingNotifications((prev) =>
      prev.map((n) => (n.targetRole === role ? { ...n, read: true } : n))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setBookingNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dataAccessActive =
    booking?.status === "ACCEPTED" ||
    booking?.status === "IN_SERVICE" ||
    booking?.status === "INVOICE_SENT"
      ? booking.form.shareHistory || booking.form.shareDigitalTwin
      : false;

  return (
    <BookingContext.Provider
      value={{
        booking,
        submitBooking,
        createWalkinSession,
        acceptBooking,
        rejectBooking,
        startService,
        sendInvoice,
        payInvoice,
        submitReview,
        reset,
        dataAccessActive,
        completedBookings,
        bookingNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        addNotification,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}

export const workshopsData: Workshop[] = [
  {
    id: "ws-1",
    name: "Bengkel Hendra Motor",
    location: "Jakarta Selatan",
    city: "Jakarta",
    address: "Jl. Fatmawati No. 12, Cilandak",
    rating: 4.9,
    totalReviews: 312,
    totalServices: 1284,
    verified: true,
    oem: true,
    specialization: "Toyota, Daihatsu",
    phone: "0812-3456-7890",
    operatingHours: { weekday: "08:00 - 17:00", weekend: "09:00 - 14:00" },
    coordinates: { lat: -6.261, lng: 106.781 },
    badges: ["Verified Signer", "OEM Certified"],
    serviceBreakdown: { "Oil Change": 420, "Brake Service": 280, "Full Inspection": 190, "Transmission": 150, "Electrical": 120, "Others": 124 },
    reviews: [
      { name: "Pak Ahmad", rating: 5, date: "2026-03-10", comment: "Servis sangat profesional, mekanik berpengalaman. CVT Belt langsung ketahuan harus ganti.", onChainVerified: true, vehicleType: "Toyota Avanza 2024" },
      { name: "Ibu Sari", rating: 5, date: "2026-02-28", comment: "Harga wajar dan transparan. Suku cadang OEM asli semua.", onChainVerified: true, vehicleType: "Daihatsu Xenia 2023" },
      { name: "Mas Doni", rating: 4, date: "2026-02-15", comment: "Bagus tapi antrian agak panjang di hari Sabtu.", onChainVerified: true, vehicleType: "Toyota Avanza 2025" },
    ],
  },
  {
    id: "ws-2",
    name: "Maju Jaya Motor",
    location: "Surabaya Barat",
    city: "Surabaya",
    address: "Jl. Raya Darmo No. 45",
    rating: 4.7,
    totalReviews: 189,
    totalServices: 876,
    verified: true,
    oem: false,
    specialization: "Honda, Suzuki",
    phone: "0813-5678-1234",
    operatingHours: { weekday: "07:30 - 16:30", weekend: "08:00 - 13:00" },
    coordinates: { lat: -7.291, lng: 112.738 },
    badges: ["Verified Signer"],
    serviceBreakdown: { "Oil Change": 310, "Brake Service": 180, "CVT Service": 140, "Full Inspection": 110, "Electrical": 80, "Others": 56 },
    reviews: [
      { name: "Pak Rudi", rating: 5, date: "2026-03-05", comment: "Spesialis Honda Beat memang terpercaya. V-Belt langsung diganti dengan yang OEM.", onChainVerified: true, vehicleType: "Honda Beat 2024" },
      { name: "Mbak Lia", rating: 4, date: "2026-02-20", comment: "Cepat dan rapi, harga kompetitif dibanding bengkel resmi.", onChainVerified: true },
    ],
  },
  {
    id: "ws-3",
    name: "EuroHaus M Performance",
    location: "BSD City, Tangerang",
    city: "Tangerang",
    address: "Ruko Golden Boulevard Blok C-15, BSD",
    rating: 4.9,
    totalReviews: 156,
    totalServices: 520,
    verified: true,
    oem: true,
    specialization: "BMW, Mercedes, Audi",
    phone: "0821-9876-5432",
    operatingHours: { weekday: "09:00 - 18:00", weekend: "10:00 - 15:00" },
    coordinates: { lat: -6.302, lng: 106.652 },
    badges: ["Verified Signer", "OEM Certified"],
    serviceBreakdown: { "Engine Tuning": 180, "Brake Service": 120, "Suspension": 90, "Electrical": 70, "Full Inspection": 40, "Others": 20 },
    reviews: [
      { name: "Andi Wijaya", rating: 5, date: "2026-03-01", comment: "Satu-satunya bengkel yang benar-benar paham BMW M series. Suspension check sangat detail.", onChainVerified: true, vehicleType: "BMW M4 G82 2025" },
      { name: "Kevin Tan", rating: 5, date: "2026-01-18", comment: "Worth the premium price. Diagnostic tools lengkap dan spare parts genuine.", onChainVerified: true, vehicleType: "BMW 330i 2024" },
    ],
  },
  {
    id: "ws-4",
    name: "Ahass Sejahtera Motor",
    location: "Bandung Utara",
    city: "Bandung",
    address: "Jl. Setiabudi No. 88",
    rating: 4.5,
    totalReviews: 245,
    totalServices: 1560,
    verified: true,
    oem: true,
    specialization: "Honda Motor",
    phone: "0822-1234-5678",
    operatingHours: { weekday: "08:00 - 16:00", weekend: "08:00 - 12:00" },
    coordinates: { lat: -6.864, lng: 107.593 },
    badges: ["Verified Signer", "OEM Certified"],
    serviceBreakdown: { "Oil Change": 520, "CVT Service": 380, "Brake Service": 240, "Injection Cleaning": 200, "Electrical": 120, "Others": 100 },
    reviews: [
      { name: "Siti Nur", rating: 4, date: "2026-02-12", comment: "Bengkel resmi Honda, pelayanan standar tapi terjamin kualitasnya.", onChainVerified: true, vehicleType: "Honda Beat 2024" },
      { name: "Pak Joko", rating: 5, date: "2026-01-25", comment: "Service rutin selalu di sini. Mekanik Honda memang paling ngerti.", onChainVerified: true },
    ],
  },
  {
    id: "ws-5",
    name: "Mabua Harley Custom",
    location: "Jakarta Utara",
    city: "Jakarta",
    address: "Jl. Boulevard Kelapa Gading Blk. A-10",
    rating: 4.8,
    totalReviews: 98,
    totalServices: 340,
    verified: true,
    oem: true,
    specialization: "Harley-Davidson, Custom Bikes",
    phone: "0811-8765-4321",
    operatingHours: { weekday: "09:00 - 17:00", weekend: "10:00 - 14:00" },
    coordinates: { lat: -6.150, lng: 106.892 },
    badges: ["Verified Signer", "OEM Certified"],
    serviceBreakdown: { "Engine Service": 120, "Primary Chain": 80, "Brake Service": 50, "Electrical": 40, "Suspension": 30, "Others": 20 },
    reviews: [
      { name: "John Doe", rating: 5, date: "2025-12-20", comment: "Tempat terbaik untuk Harley di Jakarta. Primary chain adjustment sempurna.", onChainVerified: true, vehicleType: "Harley-Davidson Sportster S" },
      { name: "Bro Rico", rating: 5, date: "2025-11-10", comment: "Community-nya juga asik. Mekanik paham banget soal Sportster.", onChainVerified: true },
    ],
  },
  {
    id: "ws-6",
    name: "Bengkel Jaya Abadi",
    location: "Semarang Tengah",
    city: "Semarang",
    address: "Jl. Pandanaran No. 55",
    rating: 4.2,
    totalReviews: 67,
    totalServices: 290,
    verified: false,
    oem: false,
    specialization: "Umum - Mobil & Motor",
    phone: "0856-7890-1234",
    operatingHours: { weekday: "07:00 - 16:00", weekend: "08:00 - 12:00" },
    coordinates: { lat: -6.991, lng: 110.423 },
    badges: ["Pending KYC"],
    serviceBreakdown: { "Oil Change": 100, "Brake Service": 60, "Tire Service": 50, "General Repair": 40, "Electrical": 25, "Others": 15 },
    reviews: [
      { name: "Pak Budi", rating: 4, date: "2026-01-30", comment: "Bengkel umum tapi cukup bisa diandalkan. Harga murah.", onChainVerified: false },
      { name: "Mas Agung", rating: 4, date: "2025-12-05", comment: "Lokasi strategis, servis cepat untuk pekerjaan ringan.", onChainVerified: false },
    ],
  },
];
