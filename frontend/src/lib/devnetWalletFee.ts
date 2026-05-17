import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
};

function getPhantomProvider() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { solana?: PhantomProvider }).solana ?? null;
}

export async function requestDevnetNetworkFeeSignature(label: string) {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error("Phantom wallet belum terdeteksi. Hubungkan Phantom untuk approval fee devnet.");
  }

  const connected = provider.publicKey ? { publicKey: provider.publicKey } : await provider.connect();
  const payer = connected.publicKey;
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
  const latest = await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    feePayer: payer,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: payer,
      lamports: 0,
    }),
  );

  let signature: string;
  if (provider.signAndSendTransaction) {
    const result = await provider.signAndSendTransaction(transaction);
    signature = result.signature;
  } else if (provider.signTransaction) {
    const signed = await provider.signTransaction(transaction);
    signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  } else {
    throw new Error("Phantom wallet tidak mendukung signAndSendTransaction.");
  }

  await connection.confirmTransaction({
    signature,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  }, "confirmed");

  return {
    signature,
    feePayer: payer.toBase58(),
    estimatedNetworkFeeSol: 0.000005,
  };
}
