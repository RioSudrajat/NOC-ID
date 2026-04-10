"use client";

export default function EnterpriseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--solana-dark)" }}>
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">Something went wrong</h2>
        <p className="text-sm text-zinc-400">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
          style={{ background: "var(--solana-gradient)" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
