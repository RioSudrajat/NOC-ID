"use client";

import type { ReactNode, ComponentType } from "react";
import dynamic from "next/dynamic";
import { AppSidebar, type AppSidebarProps } from "./AppSidebar";

const GlobalCopilotSidebar = dynamic(
  () =>
    import("@/components/ui/GlobalCopilotSidebar").then((m) => ({
      default: m.GlobalCopilotSidebar,
    })),
  { ssr: false }
);
const ConnectWalletButton = dynamic(
  () =>
    import("@/components/ui/ConnectWalletButton").then((m) => ({
      default: m.ConnectWalletButton,
    })),
  { ssr: false }
);

type PortalVariant = "dapp" | "workshop" | "enterprise" | "admin";

export interface PortalLayoutProps extends AppSidebarProps {
  /** Variant passed to ConnectWalletButton */
  variant: PortalVariant;
  /**
   * "wrapped" (default) — header + children each inside a max-w-7xl container (dapp, workshop style)
   * "flat" — header + children directly in main with padding (enterprise, admin style)
   */
  mainLayout?: "wrapped" | "flat";
  children: ReactNode;
}

export function PortalLayout({
  variant,
  mainLayout = "wrapped",
  children,
  ...sidebarProps
}: PortalLayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--solana-dark)" }}>
      <AppSidebar {...sidebarProps} />

      {mainLayout === "wrapped" ? (
        <main
          className="flex-1 overflow-y-auto flex flex-col"
          style={{ maxHeight: "100dvh" }}
        >
          <header className="hidden md:flex justify-end p-6 pb-0 max-w-7xl mx-auto w-full">
            <ConnectWalletButton variant={variant} />
          </header>
          <div className="max-w-7xl mx-auto w-full flex-1 p-6 md:p-12 pt-24 md:pt-6">
            {children}
          </div>
        </main>
      ) : (
        <main
          className="flex-1 p-6 md:p-12 pt-24 md:pt-12 overflow-y-auto"
          style={{ maxHeight: "100dvh" }}
        >
          <header className="hidden md:flex justify-end mb-0 -mt-4 pb-4">
            <ConnectWalletButton variant={variant} />
          </header>
          {children}
        </main>
      )}

      <GlobalCopilotSidebar />
    </div>
  );
}
