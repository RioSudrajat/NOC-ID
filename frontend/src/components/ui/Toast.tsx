"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#22C55E" }} />,
    error: <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />,
    info: <Info className="w-5 h-5 shrink-0" style={{ color: "var(--solana-cyan)" }} />,
  };

  const borderColorMap = {
    success: "rgba(34,197,94,0.35)",
    error: "rgba(239,68,68,0.35)",
    info: "rgba(0,209,255,0.35)",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.exiting ? "toast-exit" : ""}`}
            style={{
              background: "rgba(20,20,40,0.92)",
              border: `1px solid ${borderColorMap[toast.type]}`,
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              minWidth: 300,
              maxWidth: 420,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {iconMap[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{toast.title}</p>
              {toast.message && (
                <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>{toast.message}</p>
              )}
            </div>
            <button onClick={() => dismiss(toast.id)} className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
