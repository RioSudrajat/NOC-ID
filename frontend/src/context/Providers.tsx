"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { AdminProvider } from "@/context/AdminContext";
import { BookingProvider } from "@/context/BookingContext";
import { EnterpriseProvider } from "@/context/EnterpriseContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminProvider>
        <EnterpriseProvider>
          <BookingProvider>
            {children}
          </BookingProvider>
        </EnterpriseProvider>
      </AdminProvider>
    </ToastProvider>
  );
}
