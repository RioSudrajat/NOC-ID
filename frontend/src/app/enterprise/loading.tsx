export default function EnterpriseLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--solana-dark)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
