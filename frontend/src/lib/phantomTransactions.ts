import { Connection, Transaction } from "@solana/web3.js";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toBase58: () => string };
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58: () => string } }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
};

function getProvider() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { solana?: PhantomProvider }).solana ?? null;
}

export async function getConnectedPhantomAddress() {
  const provider = getProvider();
  if (!provider) throw new Error("Phantom wallet belum terdeteksi.");
  const connected = await provider.connect({ onlyIfTrusted: false });
  return connected.publicKey.toBase58();
}

export async function signAndSendSerializedTransaction(transactionBase64: string) {
  const provider = getProvider();
  if (!provider) throw new Error("Phantom wallet belum terdeteksi.");
  if (typeof provider.signTransaction !== "function") {
    throw new Error("Provider wallet tidak mendukung signTransaction.");
  }
  await provider.connect({ onlyIfTrusted: false });
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const tx = Transaction.from(Buffer.from(transactionBase64, "base64"));
  const signed = await provider.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  const latest = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction({ signature, ...latest }, "confirmed");
  const details = await connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }).catch(() => null);
  return {
    signature,
    feeLamports: details?.meta?.fee ?? null,
    feeSol: details?.meta?.fee ? details.meta.fee / 1_000_000_000 : null,
  };
}
