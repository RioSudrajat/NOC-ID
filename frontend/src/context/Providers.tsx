"use client";

import { ReactNode, useEffect } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { BookingProvider } from "@/context/BookingContext";
import { EnterpriseProvider } from "@/context/EnterpriseContext";
import { AdminProvider } from "@/context/AdminContext";
import { PartCatalogProvider } from "@/context/PartCatalogContext";
import { useTripStore } from "@/store/useTripStore";
import { useUserStore } from "@/store/useUserStore";
import { useBookingStore } from "@/store/useBookingStore";
import { useEnterpriseAuditStore } from "@/store/useEnterpriseStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";

function TripStoreHydration({ children }: { children: ReactNode }) {
  const hydrate = useTripStore((state) => state.hydrate);
  const hydrateUser = useUserStore((state) => state.hydrate);
  const refreshSessionUser = useUserStore((state) => state.refreshSessionUser);
  const hydrateVehicleRegistry = useVehicleRegistryStore((state) => state.hydrate);
  const syncVehicles = useVehicleRegistryStore((state) => state.syncFromBackend);
  const syncBookings = useBookingStore((state) => state.syncFromBackend);
  const syncMintRequests = useVehicleMintingStore((state) => state.syncFromBackend);
  const syncAudits = useEnterpriseAuditStore((state) => state.syncFromBackend);
  const syncTrips = useTripStore((state) => state.syncFromBackend);

  useEffect(() => {
    hydrateUser();
    hydrateVehicleRegistry();
    hydrate();
    void refreshSessionUser().finally(() => syncVehicles(useUserStore.getState().currentUser?.userId)).then(() => {
      const vehicleIds = useVehicleRegistryStore.getState().vehicles.map((vehicle) => vehicle.vehicleId);
      return Promise.all([syncBookings(), syncMintRequests(), syncAudits(), ...vehicleIds.map((vehicleId) => syncTrips(vehicleId))]);
    });
  }, [hydrate, hydrateUser, refreshSessionUser, hydrateVehicleRegistry, syncVehicles, syncBookings, syncMintRequests, syncAudits, syncTrips]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminProvider>
        <PartCatalogProvider>
          <BookingProvider>
            <EnterpriseProvider>
              <TripStoreHydration>{children}</TripStoreHydration>
            </EnterpriseProvider>
          </BookingProvider>
        </PartCatalogProvider>
      </AdminProvider>
    </ToastProvider>
  );
}
