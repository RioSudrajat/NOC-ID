const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type ApiVehicle = {
  id: string;
  vin: string;
  frameNumber?: string | null;
  engineNumber?: string | null;
  make: string;
  model: string;
  year: number;
  color: string;
  category: "car" | "motorcycle_matic" | "motorcycle_big";
  transmissionType: string;
  fuelType: string;
  licensePlate: string;
  mintStatus: "demo" | "pending" | "minted" | "escrow" | "transferred";
  currentOwnerId?: string | null;
  enterpriseId?: string | null;
  currentMileageKm: number;
  healthScore: number;
  metadataUri?: string | null;
  cnftAssetId?: string | null;
  treeAddress?: string | null;
  leafIndex?: number | null;
  vehicleRecordPda?: string | null;
  createdAt: string;
};

export type ApiWorkshop = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  authorityWallet?: string | null;
  treasuryWallet?: string | null;
  status: string;
  credentials?: Array<{ credential: string; revokedAt?: string | null }>;
};

export type ApiAuthUser = {
  userId: string;
  username?: string;
  role: "user" | "workshop_owner" | "enterprise_admin" | "admin";
  walletState?: "none" | "embedded" | "self_custody";
  walletAddress?: string;
  embeddedWalletAddress?: string;
  selfCustodyAddress?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  workshopId?: string | null;
  enterpriseId?: string | null;
  createdAt?: string;
};

export type ApiPayment = {
  id: string;
  currency: "IDR" | "IDRX" | "USDC" | "NOC";
  amountAtomic: string;
  amountDisplay: string;
  mint?: string | null;
  payerWallet?: string | null;
  recipientWallet: string;
  status: string;
  signature?: string | null;
};

export type ApiInvoice = {
  id: string;
  bookingId: string;
  serviceType: string;
  serviceCost: number;
  gasFee: number;
  totalIdr: number;
  mechanicNotes?: string | null;
  parts: Array<Record<string, unknown>>;
  payments?: ApiPayment[];
};

export type ApiBooking = {
  id: string;
  type: "booking" | "walkin";
  vehicleId: string;
  workshopId: string;
  date: string;
  time: string;
  complaint: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "IN_SERVICE" | "INVOICE_SENT" | "PAID" | "ANCHORING" | "ANCHORED" | "COMPLETED";
  createdAt: string;
  vehicle?: ApiVehicle;
  workshop?: ApiWorkshop;
  invoice?: ApiInvoice | null;
  serviceLog?: { id: string; txSignature?: string | null; recordPda?: string | null } | null;
};

export type ApiVehicleMintRequest = {
  id: string;
  userId: string;
  workshopId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate?: string | null;
  status: string;
  auditId?: string | null;
  mintedVehicleId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiVehicleAudit = {
  id: string;
  requestId?: string | null;
  workshopId: string;
  submittedForUserId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  odometerKm: number;
  componentHealth: unknown;
  overallConditionScore: number;
  evidenceHash?: string | null;
  status: string;
  reviewedByEnterpriseId?: string | null;
  mintedVehicleId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiTrip = {
  id: string;
  vehicleId: string;
  startedAt: string;
  completedAt?: string | null;
  metrics: Record<string, unknown>;
  summaryHash?: string | null;
  recordPda?: string | null;
  points?: Array<{ lat: string | number; lng: string | number; speedKmh?: string | number | null; timestamp: string }>;
  createdAt: string;
};

export const api = {
  health: () => apiRequest<{ ok: boolean; service: string; cluster: string; idrxMint: string }>("/health"),
  solanaConfig: () => apiRequest<{
    cluster: string;
    rpcUrl: string;
    wsUrl: string;
    dasRpcUrl?: string;
    programId: string;
    idrxMint: string;
    usdcMint: string;
  }>("/solana/config"),
  authNonce: (body: { address?: string; role?: ApiAuthUser["role"] }) =>
    apiRequest<{ nonce: string; message: string }>("/auth/nonce", {
      method: "POST",
      body,
    }),
  verifyWallet: (body: { address: string; role: ApiAuthUser["role"]; message: string; signature: string }) =>
    apiRequest<{ token: string; user: ApiAuthUser }>("/auth/wallet/verify", {
      method: "POST",
      body,
    }),
  registerUser: (body: { username: string; email: string; password: string }) =>
    apiRequest<{ token: string; user: ApiAuthUser }>("/auth/register", { method: "POST", body }),
  loginUser: (body: { email: string; password: string }) =>
    apiRequest<{ token: string; user: ApiAuthUser }>("/auth/login", { method: "POST", body }),
  authMe: (token: string) => apiRequest<{ user: ApiAuthUser }>("/auth/me", { token }),
  paymentCurrencies: () => apiRequest<Record<string, unknown>>("/payments/currencies"),
  registeredUsers: (q?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiRequest<{ items: Array<ApiAuthUser & { id?: string; embeddedWalletAddress?: string | null; selfCustodyAddress?: string | null }> }>(`/users/registered${suffix}`);
  },
  vehicles: (query?: { ownerId?: string; enterpriseId?: string; transferable?: boolean }) => {
    const params = new URLSearchParams();
    if (query?.ownerId) params.set("ownerId", query.ownerId);
    if (query?.enterpriseId) params.set("enterpriseId", query.enterpriseId);
    if (query?.transferable) params.set("transferable", "true");
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiRequest<{ items: ApiVehicle[]; source: string }>(`/vehicles${suffix}`);
  },
  vehicleTimeline: (vehicleId: string) =>
    apiRequest<{ vehicleId: string; vin: string; items: Array<{ type: string; at: string; item: Record<string, unknown> }>; receipts: Array<Record<string, unknown>>; cluster: string }>(`/vehicles/${vehicleId}/timeline`),
  resolveVehicle: (query: string) =>
    apiRequest<{ vehicle: ApiVehicle; qrPayload: Record<string, unknown> }>("/vehicles/resolve", { method: "POST", body: { query } }),
  workshops: () => apiRequest<{ items: ApiWorkshop[]; source: string }>("/workshops"),
  bookings: (query?: { vehicleId?: string; workshopId?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (query?.vehicleId) params.set("vehicleId", query.vehicleId);
    if (query?.workshopId) params.set("workshopId", query.workshopId);
    if (query?.status) params.set("status", query.status);
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiRequest<{ items: ApiBooking[] }>(`/bookings${suffix}`);
  },
  createBooking: (body: {
    vehicleId: string;
    workshopId: string;
    date: string;
    time: string;
    complaint: string;
  }) => apiRequest<{ bookingId: string; status: string; booking: ApiBooking }>("/bookings", { method: "POST", body }),
  createWalkinBooking: (body: { vehicleId: string; workshopId: string; complaint: string }) =>
    apiRequest<{ bookingId: string; status: string; booking: ApiBooking }>("/bookings/walk-in", { method: "POST", body }),
  updateBookingStatus: (bookingId: string, status: ApiBooking["status"]) =>
    apiRequest<{ bookingId: string; status: ApiBooking["status"]; booking: ApiBooking }>(`/bookings/${bookingId}/status`, { method: "PATCH", body: { status } }),
  createInvoice: (body: {
    bookingId: string;
    serviceType: string;
    serviceCost: number;
    gasFee?: number;
    totalIdr: number;
    parts: Array<Record<string, unknown>>;
    mechanicNotes?: string;
  }) => apiRequest<{ invoiceId: string; status: string; invoice: ApiInvoice }>("/invoices", { method: "POST", body }),
  createPaymentIntent: (body: {
    invoiceId: string;
    bookingId: string;
    amountIdr: number;
    currency: "IDR" | "IDRX" | "USDC" | "NOC";
    payerWallet?: string;
    recipientWallet: string;
  }) => apiRequest<{
    paymentIntentId: string;
    status: string;
    currency: string;
    mint: string | null;
    amount: string;
    displayAmount: number;
    recipientWallet: string;
    cluster: string;
  }>("/payments/intents", { method: "POST", body }),
  submitSignedPayment: (paymentIntentId: string, body: { signature: string; mint?: string }) =>
    apiRequest<{ paymentIntentId: string; status: string; signature: string; onchainJobId: string }>(`/payments/${paymentIntentId}/submit-signed`, {
      method: "POST",
      body,
    }),
  confirmDevnetPayment: (paymentIntentId: string, body: { payerWallet?: string }) =>
    apiRequest<{ paymentIntentId: string; status: string; signature: string; onchainJobId: string }>(`/payments/${paymentIntentId}/devnet-confirm`, {
      method: "POST",
      body,
    }),
  mintVehicleBatch: (body: { enterpriseId?: string; feeSignature?: string; feePayer?: string; vehicles: Array<Record<string, unknown>> }) =>
    apiRequest<{ mintBatchId: string; status: string; count: number; vehicleIds: string[]; enterpriseId: string; signature: string }>("/mints/vehicle-batch", {
      method: "POST",
      body,
    }),
  vehicleMintRequests: (query?: { userId?: string; workshopId?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (query?.userId) params.set("userId", query.userId);
    if (query?.workshopId) params.set("workshopId", query.workshopId);
    if (query?.status) params.set("status", query.status);
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiRequest<{ items: ApiVehicleMintRequest[] }>(`/audits/vehicle-requests${suffix}`);
  },
  createVehicleMintRequest: (body: { userId: string; workshopId: string; vin: string; make: string; model: string; year?: number; licensePlate?: string }) =>
    apiRequest<{ requestId: string; status: string }>("/audits/vehicle-requests", { method: "POST", body }),
  auditReports: (query?: { workshopId?: string; status?: string; requestId?: string }) => {
    const params = new URLSearchParams();
    if (query?.workshopId) params.set("workshopId", query.workshopId);
    if (query?.status) params.set("status", query.status);
    if (query?.requestId) params.set("requestId", query.requestId);
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiRequest<{ items: ApiVehicleAudit[] }>(`/audits/reports${suffix}`);
  },
  createAuditReport: (body: Record<string, unknown>) =>
    apiRequest<{ auditId: string; status: string }>("/audits/reports", { method: "POST", body }),
  approveAudit: (auditId: string) =>
    apiRequest<{ auditId: string; status: string; onchainJobId: string }>(`/audits/${auditId}/approve`, { method: "POST" }),
  transferVehicle: (vehicleId: string, body: { newOwnerId?: string; newOwnerEmail?: string; newOwnerWallet?: string; enterpriseAuthorityWallet?: string; feeSignature?: string; feePayer?: string }) =>
    apiRequest<{ vehicleId: string; status: string; newOwnerId: string; newOwnerWallet: string; signature: string; explorerUrl: string; onchainJobId: string }>(`/vehicles/${vehicleId}/transfer`, { method: "POST", body }),
  anchorServiceLogDevnet: (body: { bookingId: string; odometerKm?: number; evidenceHash?: string; feeSignature?: string; feePayer?: string }) =>
    apiRequest<{ serviceLogId: string; bookingId: string; status: string; signature: string; explorerUrl: string; onchainJobId: string }>("/service-logs/anchor-devnet", {
      method: "POST",
      body,
    }),
  verifyVehicleDas: (vehicleId: string) =>
    apiRequest<{ vehicleId: string; assetId?: string; verified: boolean; reason?: string; expected?: unknown; actual?: unknown }>(`/solana/das/vehicles/${vehicleId}`),
  trips: (vehicleId: string) =>
    apiRequest<{ vehicleId: string; items: ApiTrip[] }>(`/trips/vehicles/${vehicleId}`),
  createTrip: (body: { vehicleId: string; startedAt: string; completedAt?: string; metrics: Record<string, unknown>; points: Array<Record<string, unknown>> }) =>
    apiRequest<{ tripId: string; status: string; trip: ApiTrip }>("/trips", { method: "POST", body }),
  anchorTrip: (tripId: string) =>
    apiRequest<{ tripId: string; status: string; onchainJobId: string }>(`/trips/${tripId}/anchor`, { method: "POST" }),
};
