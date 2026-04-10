"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { BookingProvider } from "@/context/BookingContext";
import { EnterpriseProvider } from "@/context/EnterpriseContext";
import { AdminProvider } from "@/context/AdminContext";
import { PartCatalogProvider } from "@/context/PartCatalogContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminProvider>
        <PartCatalogProvider>
          <BookingProvider>
            <EnterpriseProvider>
              {children}
            </EnterpriseProvider>
          </BookingProvider>
        </PartCatalogProvider>
      </AdminProvider>
    </ToastProvider>
  );
}
