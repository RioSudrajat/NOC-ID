import { create } from "zustand";
import { STORAGE_KEYS } from "@/constants/storage";
import type { WorkshopRegistrationData } from "@/types/admin";

const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 7;

interface WorkshopRegistrationStore {
  draft: Partial<WorkshopRegistrationData> | null;
  saveDraft: (step: WorkshopRegistrationData["draftStep"], data: Partial<WorkshopRegistrationData>) => void;
  loadDraft: () => Partial<WorkshopRegistrationData> | null;
  clearDraft: () => void;
}

function readDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.workshopDraft);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkshopRegistrationData>;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(STORAGE_KEYS.workshopDraft);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(draft: Partial<WorkshopRegistrationData>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.workshopDraft, JSON.stringify(draft));
}

export const useWorkshopRegistrationStore = create<WorkshopRegistrationStore>((set, get) => ({
  draft: null,
  saveDraft: (draftStep, data) => {
    const draft = { ...(get().draft ?? readDraft() ?? {}), ...data, draftStep, savedAt: Date.now() };
    writeDraft(draft);
    set({ draft });
  },
  loadDraft: () => {
    const draft = readDraft();
    set({ draft });
    return draft;
  },
  clearDraft: () => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEYS.workshopDraft);
    set({ draft: null });
  },
}));

