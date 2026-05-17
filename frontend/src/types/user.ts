export type WalletState = "none" | "embedded" | "self_custody";

export type UserRole = "user" | "workshop_owner" | "enterprise_admin" | "admin";

export interface UserAccount {
  userId: string;
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  walletState: WalletState;
  embeddedWalletAddress?: string;
  selfCustodyAddress?: string;
  ownedVehicleIds: string[];
  escrowVehicleIds: string[];
  role: UserRole;
  workshopId?: string;
  enterpriseId?: string;
  workshopStatus?: import("@/types/admin").WorkshopStatus;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  expiresAt: number;
  loginMethod: "phone" | "email" | "demo" | "wallet";
  token?: string;
}

export interface RegisteredNocUser {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  walletAddress: string;
  nik?: string;
}
