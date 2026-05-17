import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("GpQrQR2pQnA7ihao7yJoCceas2x1nLor1nfB5QPPhHJU");

async function sha256Bytes(value: string): Promise<Uint8Array> {
  const msgBuffer = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return new Uint8Array(hashBuffer);
}

function hexToBytes32(hex: string | null | undefined): Uint8Array {
  const normalized = hex && /^[0-9a-f]{64}$/i.test(hex) ? hex : "0".repeat(64);
  const arr = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    arr[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

function pda(seeds: Array<Uint8Array | string>): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    seeds.map((seed) => (typeof seed === "string" ? new TextEncoder().encode(seed) : seed)),
    PROGRAM_ID
  );
}

export async function anchorServiceLogTx(params: {
  payer: PublicKey;
  workshopAuthority: PublicKey;
  workshopId: string;
  vehicleRecordPda: string;
  serviceId: string;
  odometerKm: number;
  invoiceHashHex: string;
  partsHashHex: string;
  evidenceHashHex: string;
}): Promise<Transaction> {
  const [platformConfig] = pda(["platform"]);
  const workshopHash = await sha256Bytes(params.workshopId);
  const [workshopRecord] = pda(["workshop", workshopHash]);
  
  // Credential enum value 0 = VerifiedSigner
  const credentialBytes = new Uint8Array([0]);
  const [credentialRecord] = pda(["credential", workshopRecord.toBytes(), credentialBytes]);
  const serviceHash = await sha256Bytes(params.serviceId);
  const [serviceLogRecord] = pda(["service_log", serviceHash]);

  // Discriminator for "global:anchor_service_log"
  const discriminator = new Uint8Array([0xb2, 0x06, 0x36, 0x17, 0x9c, 0xc6, 0x48, 0xdb]);

  // Arg 1: service_id_hash [u8; 32]
  const arg1 = await sha256Bytes(params.serviceId);
  
  // Arg 2: odometer_km u32 (little endian)
  const arg2 = new Uint8Array(4);
  const dataView = new DataView(arg2.buffer);
  dataView.setUint32(0, params.odometerKm, true);
  
  // Arg 3: invoice_hash [u8; 32]
  const arg3 = hexToBytes32(params.invoiceHashHex);
  // Arg 4: parts_hash [u8; 32]
  const arg4 = hexToBytes32(params.partsHashHex);
  // Arg 5: evidence_hash [u8; 32]
  const arg5 = hexToBytes32(params.evidenceHashHex);

  // concat all into data
  const data = new Uint8Array(discriminator.length + arg1.length + arg2.length + arg3.length + arg4.length + arg5.length);
  let offset = 0;
  data.set(discriminator, offset); offset += discriminator.length;
  data.set(arg1, offset); offset += arg1.length;
  data.set(arg2, offset); offset += arg2.length;
  data.set(arg3, offset); offset += arg3.length;
  data.set(arg4, offset); offset += arg4.length;
  data.set(arg5, offset);

  const keys = [
    { pubkey: params.payer, isSigner: true, isWritable: true },
    { pubkey: params.workshopAuthority, isSigner: true, isWritable: false },
    { pubkey: platformConfig, isSigner: false, isWritable: false },
    { pubkey: workshopRecord, isSigner: false, isWritable: false },
    { pubkey: credentialRecord, isSigner: false, isWritable: false },
    { pubkey: new PublicKey(params.vehicleRecordPda), isSigner: false, isWritable: false },
    { pubkey: serviceLogRecord, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: Buffer.from(data),
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = params.payer;
  return tx;
}

export async function sendAnchorServiceLog(params: Parameters<typeof anchorServiceLogTx>[0]) {
  if (typeof window === "undefined" || !(window as any).solana) {
    throw new Error("Solana wallet (Phantom) not found");
  }

  const solana = (window as any).solana;
  if (!solana.isConnected) {
    await solana.connect();
  }

  const tx = await anchorServiceLogTx(params);
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;

  const signedTx = await solana.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}
