import { create } from "zustand";
import { STORAGE_KEYS } from "@/constants/storage";
import { LEGACY_VEHICLE_ID_MAP } from "@/types/vehicle";
import { api, type ApiAuthUser } from "@/lib/api/client";
import type { RegisteredNocUser, UserAccount, UserSession, UserRole } from "@/types/user";

interface StoredUserState {
  currentUser: UserAccount | null;
  session: UserSession | null;
}

interface UserState extends StoredUserState {
  isLoading: boolean;
  hydrated: boolean;
  registeredUsers: RegisteredNocUser[];
}

interface UserActions {
  hydrate: () => void;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  loginWithEmail: (email: string, otp: string) => Promise<boolean>;
  registerWithPassword: (input: { username: string; email: string; password: string }) => Promise<boolean>;
  loginWithPassword: (input: { email: string; password: string }) => Promise<boolean>;
  refreshSessionUser: () => Promise<void>;
  loginWithWallet: (address: string, role: UserRole, verified?: { token: string; user: ApiAuthUser }) => void;
  loginDemo: (role?: UserRole) => void;
  logout: () => void;
  generateEmbeddedWallet: () => string;
  claimVehicle: (vehicleId: string) => void;
  setWorkshopStatus: (status: UserAccount["workshopStatus"], workshopId?: string) => void;
  findRegisteredUser: (query: string) => RegisteredNocUser | undefined;
  syncRegisteredUsers: (query?: string) => Promise<void>;
}

export type UserStore = UserState & UserActions;

function createMockUuid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function createSession(userId: string, loginMethod: UserSession["loginMethod"], token?: string): UserSession {
  return {
    sessionId: createMockUuid("sess"),
    userId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    loginMethod,
    token,
  };
}

function mapApiUser(user: ApiAuthUser): UserAccount {
  const now = new Date().toISOString();
  return {
    userId: user.userId,
    displayName: user.displayName ?? user.username ?? user.email ?? "NOC User",
    email: user.email,
    phone: user.phone,
    walletState: user.walletState ?? (user.embeddedWalletAddress ? "embedded" : user.selfCustodyAddress ? "self_custody" : "none"),
    embeddedWalletAddress: user.embeddedWalletAddress,
    selfCustodyAddress: user.selfCustodyAddress,
    ownedVehicleIds: [],
    escrowVehicleIds: [],
    role: user.role,
    workshopId: user.workshopId ?? undefined,
    enterpriseId: user.enterpriseId ?? undefined,
    workshopStatus: user.role === "workshop_owner" ? "approved" : undefined,
    createdAt: user.createdAt ?? now,
    lastLoginAt: now,
  };
}

function createDemoUser(role: UserRole = "user"): UserAccount {
  const now = new Date().toISOString();
  const roleName: Record<UserRole, string> = {
    user: "Demo User",
    workshop_owner: "Hendra Workshop",
    enterprise_admin: "Astra Admin",
    admin: "NOC Admin",
  };
  return {
    userId: `usr-demo-${role}`,
    displayName: roleName[role],
    email: role === "user" ? "demo@nocid.id" : `${role}@nocid.id`,
    phone: role === "user" ? "08xx-demo" : undefined,
    walletState: "embedded",
    embeddedWalletAddress: createMockUuid("wallet"),
    ownedVehicleIds:
      role === "user"
        ? Object.values(LEGACY_VEHICLE_ID_MAP)
        : [],
    escrowVehicleIds: [],
    role,
    workshopId: role === "workshop_owner" ? "ws-3" : undefined,
    enterpriseId: role === "enterprise_admin" ? "ent-astra" : undefined,
    workshopStatus: role === "workshop_owner" ? "approved" : undefined,
    createdAt: now,
    lastLoginAt: now,
  };
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

function saveJSON(value: StoredUserState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.userAccount, JSON.stringify(value));
  } catch {
    // Ignore storage failures; state remains in memory.
  }
}

function validOtp(otp: string) {
  return /^\d{6}$/.test(otp);
}

export const DEMO_REGISTERED_USERS: RegisteredNocUser[] = [
  {
    userId: "usr-demo-user",
    displayName: "Demo User",
    email: "demo@nocid.id",
    phone: "08xx-demo",
    walletAddress: "wallet-demo-user-nocid",
    nik: "3173061102950003",
  },
  {
    userId: "usr-buyer-andi",
    displayName: "Andi Pratama",
    email: "andi@nocid.id",
    phone: "0812-1100-2001",
    walletAddress: "wallet-andi-pratama-nocid",
    nik: "3201012509870001",
  },
  {
    userId: "usr-buyer-siti",
    displayName: "Siti Rahayu",
    email: "siti@nocid.id",
    phone: "0812-1100-2002",
    walletAddress: "wallet-siti-rahayu-nocid",
    nik: "3271054407900002",
  },
  {
    userId: "usr-buyer-budi",
    displayName: "Budi Wijaya",
    email: "budi@nocid.id",
    phone: "0812-1100-2003",
    walletAddress: "wallet-budi-wijaya-nocid",
    nik: "3173061102950003",
  },
];

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: null,
  session: null,
  isLoading: false,
  hydrated: false,
  registeredUsers: DEMO_REGISTERED_USERS,

  hydrate: () => {
    if (get().hydrated) return;
    const stored = loadJSON<StoredUserState>(STORAGE_KEYS.userAccount, {
      currentUser: null,
      session: null,
    });
    const isExpired = stored.session ? stored.session.expiresAt < Date.now() : false;
    const requiresFreshWalletApproval = stored.session?.loginMethod === "wallet";
    const currentUser = isExpired || requiresFreshWalletApproval ? null : stored.currentUser;
    const session = isExpired || requiresFreshWalletApproval ? null : stored.session;

    if (requiresFreshWalletApproval) {
      saveJSON({ currentUser: null, session: null });
    }

    set({
      currentUser,
      session,
      hydrated: true,
    });
  },

  loginWithPhone: async (phone, otp) => {
    if (!validOtp(otp)) return false;
    const currentUser: UserAccount = {
      userId: `usr-phone-${phone.replace(/\D/g, "") || Date.now()}`,
      displayName: "Oto Friend",
      email: undefined,
      phone,
      walletState: "embedded",
      embeddedWalletAddress: createMockUuid("wallet"),
      ownedVehicleIds: [],
      escrowVehicleIds: [],
      role: "user",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    const session = createSession(currentUser.userId, "phone");
    set({ currentUser, session });
    saveJSON({ currentUser, session });
    return true;
  },

  loginWithEmail: async (email, otp) => {
    if (!validOtp(otp)) return false;
    const currentUser: UserAccount = {
      userId: `usr-email-${email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      displayName: "Oto Friend",
      email,
      phone: undefined,
      walletState: "embedded",
      embeddedWalletAddress: createMockUuid("wallet"),
      ownedVehicleIds: [],
      escrowVehicleIds: [],
      role: "user",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    const session = createSession(currentUser.userId, "email");
    set({ currentUser, session });
    saveJSON({ currentUser, session });
    return true;
  },

  registerWithPassword: async (input) => {
    set({ isLoading: true });
    try {
      const response = await api.registerUser(input);
      const currentUser = mapApiUser(response.user);
      const session = createSession(currentUser.userId, "email", response.token);
      set({ currentUser, session, isLoading: false });
      saveJSON({ currentUser, session });
      return true;
    } catch (error) {
      console.warn("[user-store] register failed", error);
      set({ isLoading: false });
      return false;
    }
  },

  loginWithPassword: async (input) => {
    set({ isLoading: true });
    try {
      const response = await api.loginUser(input);
      const currentUser = mapApiUser(response.user);
      const session = createSession(currentUser.userId, "email", response.token);
      set({ currentUser, session, isLoading: false });
      saveJSON({ currentUser, session });
      return true;
    } catch (error) {
      console.warn("[user-store] login failed", error);
      set({ isLoading: false });
      return false;
    }
  },

  refreshSessionUser: async () => {
    const token = get().session?.token;
    if (!token) return;
    try {
      const response = await api.authMe(token);
      const currentUser = mapApiUser(response.user);
      const session = get().session;
      set({ currentUser });
      saveJSON({ currentUser, session });
    } catch (error) {
      console.warn("[user-store] auth/me failed", error);
      get().logout();
    }
  },

  loginWithWallet: (address, role, verified) => {
    const currentUser: UserAccount = {
      userId: verified?.user.userId ?? `usr-wallet-${address.slice(0, 8)}`,
      displayName: verified?.user.displayName ?? (role === "admin" ? "Admin" : role === "enterprise_admin" ? "Enterprise" : "Workshop Owner"),
      email: undefined,
      phone: undefined,
      walletState: "self_custody",
      embeddedWalletAddress: undefined,
      selfCustodyAddress: address,
      ownedVehicleIds: [],
      escrowVehicleIds: [],
      role,
      workshopId: verified?.user.workshopId ?? undefined,
      enterpriseId: verified?.user.enterpriseId ?? undefined,
      workshopStatus: role === "workshop_owner" ? "approved" : undefined, // demo mock status for now
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    const session = createSession(currentUser.userId, "wallet", verified?.token);
    set({ currentUser, session });
    saveJSON({ currentUser, session });
  },

  loginDemo: (role = "user") => {
    const currentUser = createDemoUser(role);
    const session = createSession(currentUser.userId, "demo");
    set({ currentUser, session });
    saveJSON({ currentUser, session });
  },

  logout: () => {
    set({ currentUser: null, session: null });
    saveJSON({ currentUser: null, session: null });
  },

  generateEmbeddedWallet: () => {
    const wallet = createMockUuid("wallet");
    set((state) => {
      if (!state.currentUser) return state;
      const currentUser = {
        ...state.currentUser,
        walletState: "embedded" as const,
        embeddedWalletAddress: wallet,
      };
      saveJSON({ currentUser, session: state.session });
      return { currentUser };
    });
    return wallet;
  },

  claimVehicle: (vehicleId) => {
    set((state) => {
      if (!state.currentUser) return state;
      const escrowVehicleIds = state.currentUser.escrowVehicleIds.filter((id) => id !== vehicleId);
      const ownedVehicleIds = Array.from(new Set([...state.currentUser.ownedVehicleIds, vehicleId]));
      const currentUser = { ...state.currentUser, escrowVehicleIds, ownedVehicleIds };
      saveJSON({ currentUser, session: state.session });
      return { currentUser };
    });
  },

  setWorkshopStatus: (status, workshopId) => {
    set((state) => {
      if (!state.currentUser) return state;
      const currentUser = {
        ...state.currentUser,
        workshopStatus: status,
        workshopId: workshopId ?? state.currentUser.workshopId,
      };
      saveJSON({ currentUser, session: state.session });
      return { currentUser };
    });
  },

  findRegisteredUser: (query) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return undefined;
    return get().registeredUsers.find((user) =>
      [user.userId, user.email, user.walletAddress, user.displayName, user.phone ?? ""]
        .some((value) => value.toLowerCase() === normalized),
    );
  },

  syncRegisteredUsers: async (query) => {
    try {
      const response = await api.registeredUsers(query);
      const registeredUsers = response.items
        .filter((user) => user.role === "user")
        .map((user) => ({
          userId: user.userId ?? user.id ?? "",
          displayName: user.displayName ?? user.username ?? user.email ?? "NOC User",
          email: user.email ?? "",
          phone: user.phone,
          walletAddress: user.embeddedWalletAddress ?? user.selfCustodyAddress ?? user.walletAddress ?? "",
        }))
        .filter((user) => user.userId && user.email && user.walletAddress);
      set({ registeredUsers: registeredUsers.length ? registeredUsers : get().registeredUsers });
    } catch (error) {
      console.warn("[user-store] registered user sync skipped", error);
    }
  },
}));
