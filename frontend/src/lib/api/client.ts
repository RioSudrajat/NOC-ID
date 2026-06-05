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

export type ApiTxReceipt = {
  id: string;
  signature: string;
  cluster: string;
  programId?: string | null;
  slot?: string | number | null;
  confirmationStatus: string;
  explorerUrl: string;
  raw?: Record<string, unknown> | null;
  createdAt: string;
};

export type ApiVehicleQrPayload = {
  type: "noc_vehicle_qr";
  version: 1;
  token: string;
  vehicleId: string;
  expiresAt: string;
};

export type ApiVehicleQrToken = {
  qrTokenId: string;
  qrPayload: ApiVehicleQrPayload;
  expiresAt: string;
  expirySeconds: number;
  vehicle: Pick<ApiVehicle, "id" | "vin" | "make" | "model" | "year" | "cnftAssetId" | "treeAddress" | "vehicleRecordPda">;
};

export type ApiVehicleQrVerification = {
  scanSessionId: string;
  verifiedAt: string;
  workshop: { id: string; name: string };
  includeServiceHistory: boolean;
  vehicle: ApiVehicle & {
    currentOwner?: ApiAuthUser | null;
    enterprise?: Record<string, unknown> | null;
    serviceLogs?: Array<Record<string, unknown>>;
  };
  serviceHistory: Array<Record<string, unknown>>;
};

export type ApiComponentOriginDraft = {
  status: string;
  bookingId: string;
  transactionBase64: string;
  componentOriginRecordPda: string;
  serviceIdHash: string;
  invoiceHash: string;
  partsHash: string;
  catalogHash: string;
  verifiedPartCount: number;
  parts: Array<Record<string, unknown>>;
  costEstimate?: {
    networkFeeSol: number;
    storageRentSol: number;
    totalSol: number;
    storageAccountBytes?: number;
  };
  accounts: Record<string, string>;
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
  transactions: (query?: { action?: string; programId?: string; take?: number }) => {
    const params = new URLSearchParams();
    if (query?.action) params.set("action", query.action);
    if (query?.programId) params.set("programId", query.programId);
    if (query?.take) params.set("take", String(query.take));
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiRequest<{ items: ApiTxReceipt[]; cluster: string }>(`/solana/transactions${suffix}`);
  },
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
  createVehicleQrToken: (vehicleId: string, body: { includeServiceHistory?: boolean }, token?: string | null) =>
    apiRequest<ApiVehicleQrToken>(`/vehicles/${vehicleId}/qr-tokens`, { method: "POST", body, token }),
  verifyVehicleQr: (body: { payload: string | ApiVehicleQrPayload; workshopId?: string }, token?: string | null) =>
    apiRequest<ApiVehicleQrVerification>("/vehicles/qr/verify", { method: "POST", body, token }),
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
  createWalkinBooking: (body: { vehicleId: string; workshopId: string; scanSessionId: string; complaint: string }, token?: string | null) =>
    apiRequest<{ bookingId: string; status: string; booking: ApiBooking }>("/bookings/walk-in", { method: "POST", body, token }),
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
  resolveComponentOrigin: (body: { vehicleId: string; partNumber: string; manufacturer?: string; componentId?: string }) =>
    apiRequest<{ eligible: boolean; reason: string; catalogItem: Record<string, unknown> | null }>("/components/origin/resolve", {
      method: "POST",
      body,
    }),
  createComponentOriginDraft: (body: { bookingId: string; workshopWallet: string; parts: Array<Record<string, unknown>> }) =>
    apiRequest<ApiComponentOriginDraft>("/components/origin/draft", {
      method: "POST",
      body,
    }),
  confirmComponentOrigin: (body: {
    bookingId: string;
    signature: string;
    signerWallet: string;
    componentOriginRecordPda: string;
    invoiceHash: string;
    partsHash: string;
    catalogHash: string;
  }) =>
    apiRequest<{ status: string; bookingId: string; signature: string; explorerUrl: string; componentOriginRecordPda: string; onchainJobId: string }>("/components/origin/confirm", {
      method: "POST",
      body,
    }),
  mintVehicleBatch: (body: { enterpriseId?: string; feeSignature?: string; feePayer?: string; vehicles: Array<Record<string, unknown>> }) =>
    apiRequest<{ mintBatchId: string; status: string; count: number; vehicleIds: string[]; enterpriseId: string; signature: string }>("/mints/vehicle-batch", {
      method: "POST",
      body,
    }),
  createVehicleMintDraft: (body: { enterpriseId?: string; minterWallet: string; vehicles: Array<Record<string, unknown>> }) =>
    apiRequest<{
      status: string;
      enterpriseId: string;
      treeAddress: string | null;
      collectionAddress: string | null;
      vehicles: Array<{ vehicleId: string; vin: string; name: string; uri: string | null; metadataHash: string | null }>;
    }>("/mints/vehicle-batch/draft", { method: "POST", body }),
  confirmVehicleMintBatch: (body: {
    enterpriseId: string;
    minterWallet: string;
    minted: Array<{ vehicleId: string; cnftAssetId: string; treeAddress: string; leafIndex: number; mintSignature: string; feeLamports?: number | null }>;
  }) =>
    apiRequest<{ status: string; count: number; vehicleIds: string[]; signature: string; confirmed: Array<Record<string, unknown>> }>("/mints/vehicle-batch/confirm", {
      method: "POST",
      body,
    }),
  createPartCatalogDraft: (body: {
    enterpriseId: string;
    minterWallet: string;
    parts: Array<{ name: string; partNumber: string; category: string; manufacturer: string; compatibleModels: string[]; priceIdr: number }>;
  }) =>
    apiRequest<{
      status: string;
      enterpriseId: string;
      treeAddress: string | null;
      collectionAddress: string | null;
      parts: Array<{ partId: string; name: string; uri: string | null; metadataHash: string | null }>;
    }>("/mints/part-catalog/draft", { method: "POST", body }),
  confirmPartCatalogMint: (body: {
    enterpriseId: string;
    minterWallet: string;
    minted: Array<{ partId: string; cnftAssetId: string; treeAddress: string; leafIndex: number; mintSignature: string; feeLamports?: number | null }>;
  }) =>
    apiRequest<{ status: string; count: number; partIds: string[]; signature: string; confirmed: Array<Record<string, unknown>> }>("/mints/part-catalog/confirm", {
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
  createTransferDraft: (vehicleId: string, body: { newOwnerId?: string; newOwnerEmail?: string; newOwnerWallet?: string; enterpriseAuthorityWallet: string }) =>
    apiRequest<{
      status: string;
      vehicleId: string;
      assetId: string;
      newOwnerId: string;
      newOwnerWallet: string;
      authorityWallet: string;
      collectionAddress: string | null;
      transferProof: {
        leafOwner: string;
        leafDelegate: string;
        merkleTree: string;
        root: number[];
        dataHash: number[];
        creatorHash: number[];
        assetDataHash: number[] | null;
        flags: number;
        nonce: number;
        index: number;
        proof: string[];
      };
      registryTransactionBase64: string;
    }>(`/vehicles/${vehicleId}/transfer/draft`, { method: "POST", body }),
  confirmTransferVehicle: (vehicleId: string, body: { newOwnerId: string; newOwnerWallet: string; enterpriseAuthorityWallet: string; cnftTransferSignature: string; registrySignature: string }) =>
    apiRequest<{ vehicleId: string; status: string; newOwnerId: string; newOwnerWallet: string; signature: string; cnftTransferSignature: string; explorerUrl: string; onchainJobId: string }>(`/vehicles/${vehicleId}/transfer/confirm`, {
      method: "POST",
      body,
    }),
  transferVehicle: (vehicleId: string, body: { newOwnerId?: string; newOwnerEmail?: string; newOwnerWallet?: string; enterpriseAuthorityWallet?: string; feeSignature?: string; feePayer?: string }) =>
    apiRequest<{ vehicleId: string; status: string; newOwnerId: string; newOwnerWallet: string; signature: string; explorerUrl: string; onchainJobId: string }>(`/vehicles/${vehicleId}/transfer`, { method: "POST", body }),
  createServiceLogAnchorDraft: (body: { bookingId: string; odometerKm?: number; evidenceHash?: string; workshopAuthorityWallet: string }) =>
    apiRequest<{ serviceLogId: string; bookingId: string; transactionBase64: string; summary: Record<string, unknown>; accounts: Record<string, string>; costEstimate?: { networkFeeSol: number; storageRentSol: number; totalSol: number; storageAccountBytes?: number; note?: string } }>("/service-logs/anchor-devnet/draft", {
      method: "POST",
      body,
    }),
  confirmServiceLogAnchor: (serviceLogId: string, body: { signature: string; signerWallet: string }) =>
    apiRequest<{ serviceLogId: string; bookingId: string | null; status: string; signature: string; explorerUrl: string; onchainJobId: string }>(`/service-logs/${serviceLogId}/confirm-signed`, {
      method: "POST",
      body,
    }),
  createPassportUpdateDraft: (serviceLogId: string, body: { authorityWallet: string }) =>
    apiRequest<{
      status: string;
      serviceLogId: string;
      vehicleId: string;
      assetId: string;
      metadataHash: string;
      metadataUri: string;
      authorityWallet: string;
      collectionAddress: string | null;
      currentMetadata: {
        name: string;
        symbol: string;
        uri: string;
        sellerFeeBasisPoints: number;
        primarySaleHappened: boolean;
        isMutable: boolean;
        creators: Array<{ address: string; verified: boolean; share: number }>;
        collection: string | null;
      };
      updateArgs: { uri: string; name?: string };
      proof: {
        leafOwner: string;
        leafDelegate: string;
        treeConfig?: string | null;
        merkleTree: string;
        root: number[];
        assetDataHash: number[] | null;
        flags?: number | null;
        nonce: number;
        index: number;
        proof: string[];
      };
      costEstimate?: { networkFeeSol: number; storageRentSol: number; totalSol: number; note?: string };
      summary: Record<string, unknown>;
    }>(`/service-logs/${serviceLogId}/passport-update/draft`, { method: "POST", body }),
  confirmPassportUpdate: (serviceLogId: string, body: { signature: string; signerWallet: string; metadataHash: string; metadataUri: string }) =>
    apiRequest<{ serviceLogId: string; vehicleId: string; status: string; signature: string; explorerUrl: string; metadataHash: string; metadataUri: string; onchainJobId: string }>(`/service-logs/${serviceLogId}/passport-update/confirm`, {
      method: "POST",
      body,
    }),
  anchorServiceLogDevnet: (body: { bookingId: string; odometerKm?: number; evidenceHash?: string; feeSignature?: string; feePayer?: string }) =>
    apiRequest<{ serviceLogId: string; bookingId: string; status: string; signature: string; explorerUrl: string; onchainJobId: string }>("/service-logs/anchor-devnet", {
      method: "POST",
      body,
    }),
  createCredentialGrantDraft: (body: { workshopId: string; credential: "verified_signer" | "oem_certified" | "manufacturer_audit_partner" | "recall_executor"; issuedBy: string; issuerWallet: string; enterpriseId?: string; validUntil?: string }) =>
    apiRequest<{ status: string; workshopId: string; credential: string; transactionBase64: string; credentialRecordPda: string; summary: Record<string, unknown> }>("/credentials/grant/draft", {
      method: "POST",
      body,
    }),
  confirmCredentialGrant: (body: { workshopId: string; credential: "verified_signer" | "oem_certified" | "manufacturer_audit_partner" | "recall_executor"; issuedBy: string; issuerWallet: string; signature: string; credentialRecordPda: string; enterpriseId?: string; validUntil?: string }) =>
    apiRequest<{ credentialId: string; status: string; signature: string; onchainJobId: string }>("/credentials/grant/confirm", {
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
