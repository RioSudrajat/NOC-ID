import { create } from "zustand";
import { STORAGE_KEYS } from "@/constants/storage";
import { api, type ApiVehicleMintRequest } from "@/lib/api/client";
import { useBookingStore } from "@/store/useBookingStore";
import type { VehicleAuditReport, VehicleMintRequest } from "@/types/audit";

interface VehicleMintingState {
  requests: VehicleMintRequest[];
  hydrated: boolean;
  hydrate: () => void;
  syncFromBackend: (query?: { userId?: string; workshopId?: string; status?: string }) => Promise<void>;
  submitRequest: (request: Omit<VehicleMintRequest, "requestId" | "status" | "createdAt" | "updatedAt">) => VehicleMintRequest;
  updateRequest: (requestId: string, patch: Partial<VehicleMintRequest>) => void;
  attachAudit: (requestId: string, audit: VehicleAuditReport) => void;
  markMinted: (requestId: string, mintedVehicleId: string) => void;
  markClaimed: (requestId: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  getRequestsForWorkshop: (workshopId: string) => VehicleMintRequest[];
  getRequestsForUser: (userId: string) => VehicleMintRequest[];
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep state in-memory if localStorage is unavailable.
  }
}

function persist(requests: VehicleMintRequest[]) {
  saveJSON(STORAGE_KEYS.vehicleMintRequests, requests);
}

function mapApiRequest(item: ApiVehicleMintRequest): VehicleMintRequest {
  return {
    requestId: item.id,
    userId: item.userId,
    userName: item.userId,
    userContact: "",
    workshopId: item.workshopId,
    workshopName: item.workshopId,
    make: item.make,
    model: item.model,
    year: item.year,
    vin: item.vin,
    licensePlate: item.licensePlate ?? undefined,
    status: item.status as VehicleMintRequest["status"],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    auditId: item.auditId ?? undefined,
    mintedVehicleId: item.mintedVehicleId ?? undefined,
    rejectionReason: item.rejectionReason ?? undefined,
  };
}

export const useVehicleMintingStore = create<VehicleMintingState>((set, get) => ({
  requests: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ requests: loadJSON<VehicleMintRequest[]>(STORAGE_KEYS.vehicleMintRequests, []), hydrated: true });
  },

  syncFromBackend: async (query) => {
    try {
      const response = await api.vehicleMintRequests(query);
      set((state) => {
        const fromBackend = response.items.map(mapApiRequest);
        const byId = new Map([...state.requests, ...fromBackend].map((item) => [item.requestId, item]));
        const requests = Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        persist(requests);
        return { requests, hydrated: true };
      });
    } catch (error) {
      console.warn("Failed to sync vehicle mint requests from backend", error);
    }
  },

  submitRequest: (request) => {
    const now = new Date().toISOString();
    const entry: VehicleMintRequest = {
      ...request,
      requestId: `VMR-${Date.now()}`,
      status: "requested",
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const requests = [entry, ...state.requests];
      persist(requests);
      return { requests };
    });
    void api.createVehicleMintRequest({
      userId: request.userId,
      workshopId: request.workshopId,
      vin: request.vin,
      make: request.make,
      model: request.model,
      year: request.year,
      licensePlate: request.licensePlate,
    }).then((response) => {
      get().updateRequest(entry.requestId, { requestId: response.requestId, status: response.status as VehicleMintRequest["status"] });
    }).catch((error) => {
      console.warn("Failed to persist vehicle mint request to backend", error);
    });
    useBookingStore.getState().addNotification(
      "audit_request",
      "Audit request baru",
      `${entry.userName} meminta audit ${entry.make} ${entry.model} di ${entry.workshopName}.`,
      "workshop",
    );
    return entry;
  },

  updateRequest: (requestId, patch) => {
    set((state) => {
      const requests = state.requests.map((request) =>
        request.requestId === requestId
          ? { ...request, ...patch, updatedAt: new Date().toISOString() }
          : request,
      );
      persist(requests);
      return { requests };
    });
  },

  attachAudit: (requestId, audit) => {
    get().updateRequest(requestId, {
      auditId: audit.auditId,
      status: "enterprise_review",
    });
    useBookingStore.getState().addNotification(
      "audit_submitted",
      "Audit kendaraan masuk",
      `${audit.make} ${audit.model} siap direview untuk mint NFT identity.`,
      "enterprise",
    );
  },

  markMinted: (requestId, mintedVehicleId) => {
    get().updateRequest(requestId, {
      mintedVehicleId,
      status: "minted_escrow",
    });
    useBookingStore.getState().addNotification(
      "mint_ready",
      "Vehicle NFT ready to claim",
      `Vehicle identity ${mintedVehicleId} sudah berada di escrow dan siap diklaim user.`,
      "user",
    );
  },

  markClaimed: (requestId) => {
    get().updateRequest(requestId, { status: "claimed" });
    useBookingStore.getState().addNotification(
      "vehicle_claimed",
      "Vehicle NFT claimed",
      `Request ${requestId} sudah diklaim ke akun user.`,
      "enterprise",
    );
  },

  rejectRequest: (requestId, reason) => {
    get().updateRequest(requestId, {
      status: "rejected",
      rejectionReason: reason,
    });
  },

  getRequestsForWorkshop: (workshopId) =>
    get().requests.filter((request) => request.workshopId === workshopId),

  getRequestsForUser: (userId) =>
    get().requests.filter((request) => request.userId === userId),
}));
