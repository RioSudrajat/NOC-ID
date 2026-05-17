import type { WalletSession } from "@solana/client";
import { api, type ApiAuthUser } from "@/lib/api/client";

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export async function verifyWalletLogin(session: WalletSession, role: ApiAuthUser["role"]) {
  if (!session.signMessage) {
    throw new Error("Wallet does not support message signing.");
  }

  const address = session.account.address.toString();
  const nonce = await api.authNonce({ address, role });
  const message = new TextEncoder().encode(nonce.message);

  const signature = await session.signMessage(message);
  if (!signature?.length) {
    throw new Error("Wallet signature was not completed.");
  }

  const verified = await api.verifyWallet({
    address,
    role,
    message: nonce.message,
    signature: bytesToBase64(signature),
  });

  return { address, ...verified };
}
