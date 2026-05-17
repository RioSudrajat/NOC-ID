"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useWalletConnection } from "@solana/react-hooks";
import type { UserAccount } from "@/types/user";
import type { WorkshopStatus } from "@/types/admin";

interface PortalGuardProps {
  requiredRole?: UserAccount["role"];
  requiredWorkshopStatus?: WorkshopStatus;
  fallbackPath?: string;
  children: React.ReactNode;
}

export function PortalGuard({
  requiredRole,
  requiredWorkshopStatus,
  fallbackPath = "/login",
  children,
}: PortalGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useUserStore((state) => state.hydrate);
  const hydrated = useUserStore((state) => state.hydrated);
  const session = useUserStore((state) => state.session);
  const currentUser = useUserStore((state) => state.currentUser);
  const logout = useUserStore((state) => state.logout);
  const { connected, isReady, wallet } = useWalletConnection();
  const isWalletSession = session?.loginMethod === "wallet" && currentUser?.walletState === "self_custody";
  const connectedAddress = wallet?.account?.address?.toString();
  const isWalletSessionValid =
    !isWalletSession ||
    (isReady && connected && connectedAddress === currentUser?.selfCustodyAddress);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session || !currentUser) {
      router.replace(fallbackPath);
      return;
    }

    if (isWalletSession && isReady) {
      if (!isWalletSessionValid) {
        logout();
        router.replace(fallbackPath);
        return;
      }
    }

    if (requiredRole && currentUser.role !== requiredRole) {
      router.replace("/");
      return;
    }
    if (requiredRole === "workshop_owner") {
      const status = currentUser.workshopStatus ?? "unregistered";
      const isRegisterRoute = pathname.startsWith("/workshop/register");
      const isPendingRoute = pathname.startsWith("/workshop/pending");
      if ((status === "unregistered" || status === "draft") && !isRegisterRoute) {
        router.replace("/workshop/register");
        return;
      }
      if ((status === "pending_kyc" || status === "rejected") && !isPendingRoute && !isRegisterRoute) {
        router.replace("/workshop/pending");
        return;
      }
      if (status === "suspended") {
        router.replace("/");
        return;
      }
    }
    if (
      requiredWorkshopStatus &&
      currentUser.workshopStatus &&
      currentUser.workshopStatus !== requiredWorkshopStatus
    ) {
      router.replace(currentUser.workshopStatus === "approved" ? pathname : "/workshop/pending");
    }
  }, [
    connected,
    connectedAddress,
    currentUser,
    fallbackPath,
    hydrated,
    isReady,
    isWalletSession,
    isWalletSessionValid,
    logout,
    pathname,
    requiredRole,
    requiredWorkshopStatus,
    router,
    session,
    wallet,
  ]);

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--solana-dark)" }}>
        <div className="glass-card px-5 py-4 text-sm" style={{ color: "var(--solana-text-muted)" }}>
          Loading session...
        </div>
      </div>
    );
  }

  if (!session || !currentUser) return null;
  if (isWalletSession && !isWalletSessionValid) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--solana-dark)" }}>
        <div className="glass-card px-5 py-4 text-sm" style={{ color: "var(--solana-text-muted)" }}>
          Verifying wallet session...
        </div>
      </div>
    );
  }
  if (requiredRole && currentUser.role !== requiredRole) return null;

  return <>{children}</>;
}
