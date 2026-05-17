"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

/* ── Types ── */

export interface CatalogPart {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  compatibleModels: string[];
  priceIDR: number;
  isOEM: boolean;
  mintedAt: string;
  txSig: string;
  status: "active" | "recalled" | "discontinued";
}

interface PartCatalogContextType {
  catalog: CatalogPart[];
  addPart: (part: Omit<CatalogPart, "id" | "mintedAt" | "txSig" | "status">) => void;
  addBatch: (parts: Omit<CatalogPart, "id" | "mintedAt" | "txSig" | "status">[]) => void;
  recallPart: (id: string) => void;
  discontinuePart: (id: string) => void;
  verifyPart: (partNumber: string) => CatalogPart | null;
}

/* ── Storage ── */
const CATALOG_KEY = "noc-part-catalog";

const PartCatalogContext = createContext<PartCatalogContextType | undefined>(undefined);

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

/* ── Seed data ── */

const seedCatalog: CatalogPart[] = [
  { id: "PT-007", name: "Primary Chain Kit", partNumber: "40037-09", manufacturer: "Harley-Davidson Motor Co", compatibleModels: ["Sportster S", "Nightster"], priceIDR: 2800000, isOEM: true, mintedAt: "2026-02-15", txSig: "2wFx...jN5t", status: "active" },
  { id: "PT-008", name: "BMW M Performance Brake Kit", partNumber: "34-11-2-284-869", manufacturer: "BMW AG", compatibleModels: ["M4 G82", "M3 G80", "M340i"], priceIDR: 18500000, isOEM: true, mintedAt: "2026-02-20", txSig: "6cDr...hP9v", status: "active" },
];

export function PartCatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogPart[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCatalog(loadJSON(CATALOG_KEY, seedCatalog));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJSON(CATALOG_KEY, catalog);
  }, [catalog, hydrated]);

  const addPart = useCallback((part: Omit<CatalogPart, "id" | "mintedAt" | "txSig" | "status">) => {
    const entry: CatalogPart = {
      ...part,
      id: `PT-${Date.now()}`,
      mintedAt: new Date().toISOString().split("T")[0],
      txSig: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
      status: "active",
    };
    setCatalog(prev => [entry, ...prev]);
  }, []);

  const addBatch = useCallback((parts: Omit<CatalogPart, "id" | "mintedAt" | "txSig" | "status">[]) => {
    const now = new Date().toISOString().split("T")[0];
    const entries: CatalogPart[] = parts.map((p, i) => ({
      ...p,
      id: `PT-${Date.now()}-${i}`,
      mintedAt: now,
      txSig: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
      status: "active" as const,
    }));
    setCatalog(prev => [...entries, ...prev]);
  }, []);

  const recallPart = useCallback((id: string) => {
    setCatalog(prev => prev.map(p => p.id === id ? { ...p, status: "recalled" as const } : p));
  }, []);

  const discontinuePart = useCallback((id: string) => {
    setCatalog(prev => prev.map(p => p.id === id ? { ...p, status: "discontinued" as const } : p));
  }, []);

  const verifyPart = useCallback((partNumber: string): CatalogPart | null => {
    return catalog.find(p => p.partNumber.toLowerCase() === partNumber.toLowerCase()) || null;
  }, [catalog]);

  return (
    <PartCatalogContext.Provider value={{ catalog, addPart, addBatch, recallPart, discontinuePart, verifyPart }}>
      {children}
    </PartCatalogContext.Provider>
  );
}

export function usePartCatalog() {
  return useContext(PartCatalogContext);
}
