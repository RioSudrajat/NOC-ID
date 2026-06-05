import { Connection, PublicKey, Transaction as Web3Transaction, VersionedTransaction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { findLeafAssetIdPda, mintV2, mplBubblegum, parseLeafFromMintV2Transaction, TokenStandard, updateMetadataV2 } from "@metaplex-foundation/mpl-bubblegum";
import { none, publicKey, signerIdentity, some, type Signer, type Transaction as UmiTransaction } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { fromWeb3JsPublicKey, fromWeb3JsTransaction, toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { apiRequest } from "@/lib/api/client";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array } | Uint8Array>;
  signTransaction: (transaction: VersionedTransaction | Web3Transaction) => Promise<VersionedTransaction | Web3Transaction>;
  signAndSendTransaction?: (
    transaction: VersionedTransaction | Web3Transaction,
    options?: { skipPreflight?: boolean; preflightCommitment?: string; maxRetries?: number }
  ) => Promise<{ signature: string } | string>;
  signAllTransactions?: (transactions: Array<VersionedTransaction | Web3Transaction>) => Promise<Array<VersionedTransaction | Web3Transaction>>;
};

type MintInput = {
  name: string;
  uri: string;
  merkleTree: string;
  coreCollection?: string | null;
};

type TransferProofInput = {
  leafOwner: string;
  leafDelegate: string;
  merkleTree: string;
  root: number[];
  dataHash: number[];
  creatorHash: number[];
  assetDataHash: number[] | null;
  flags: number;
  nonce: number;
  index: number;
  proof: string[];
};

type PassportMetadataUpdateInput = {
  collectionAddress?: string | null;
  currentMetadata: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    primarySaleHappened: boolean;
    isMutable: boolean;
    tokenStandard?: number | null;
    creators: Array<{ address: string; verified: boolean; share: number }>;
    collection: string | null;
  };
  updateArgs: {
    uri: string;
  };
  proof: {
    leafOwner: string;
    leafDelegate: string;
    treeConfig?: string | null;
    merkleTree: string;
    root: number[];
    assetDataHash: number[] | null;
    flags?: number | null;
    nonce: number;
    index: number;
    proof: string[];
  };
};

function getPhantomProvider() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { solana?: PhantomProvider }).solana ?? null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransactionTooLarge(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /transaction too large|too large|max: encoded\/raw|encoded.*bytes/i.test(message);
}

function bytes32(value: number[]) {
  if (value.length !== 32) {
    throw new Error(`Invalid 32-byte proof hash length: ${value.length}`);
  }
  return new Uint8Array(value);
}

function signatureToString(signature: Uint8Array | string) {
  return typeof signature === "string" ? signature : base58.deserialize(signature)[0] as string;
}

async function retry<T>(reader: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      return await reader();
    } catch (error) {
      lastError = error;
      await sleep(Math.min(500 * attempt, 3000));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function getTransactionDetailsOrNull(connection: Connection, signature: string) {
  try {
    return await retry(() => connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }).then((tx) => {
      if (!tx) throw new Error("Transaction detail belum tersedia di RPC.");
      return tx;
    }));
  } catch (error) {
    console.warn("Transaction detail belum tersedia setelah transaksi terkonfirmasi:", error);
    return null;
  }
}

async function waitForConfirmedSignature(connection: Connection, signature: string) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const status = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
    const value = status.value[0];
    if (value?.err) {
      throw new Error(`Transaksi gagal on-chain: ${JSON.stringify(value.err)}`);
    }
    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      return value;
    }
    await sleep(Math.min(500 * attempt, 2500));
  }
  throw new Error("Transaksi belum terkonfirmasi di RPC setelah wallet sign.");
}

async function createPhantomSigner(provider: PhantomProvider): Promise<Signer> {
  const connected = provider.publicKey ? { publicKey: provider.publicKey } : await provider.connect();
  const signerPublicKey = fromWeb3JsPublicKey(connected.publicKey);
  return {
    publicKey: signerPublicKey,
    signMessage: async (message: Uint8Array) => {
      if (!provider.signMessage) {
        throw new Error("Phantom wallet tidak mendukung signMessage.");
      }
      const result = await provider.signMessage(message);
      return result instanceof Uint8Array ? result : result.signature;
    },
    signTransaction: async (transaction: UmiTransaction) => {
      const web3Transaction = toWeb3JsTransaction(transaction);
      const signed = await provider.signTransaction(web3Transaction);
      return fromWeb3JsTransaction(signed as VersionedTransaction);
    },
    signAllTransactions: async (transactions: UmiTransaction[]) => {
      if (!provider.signAllTransactions) {
        const signed = [];
        for (const transaction of transactions) signed.push(await provider.signTransaction(toWeb3JsTransaction(transaction)));
        return signed.map((transaction) => fromWeb3JsTransaction(transaction as VersionedTransaction));
      }
      const signed = await provider.signAllTransactions(transactions.map((transaction) => toWeb3JsTransaction(transaction)));
      return signed.map((transaction) => fromWeb3JsTransaction(transaction as VersionedTransaction));
    },
  };
}

async function waitForLutActivation(connection: Connection, recentSlot: number) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slot = await connection.getSlot("confirmed");
    if (slot > recentSlot) return;
    await sleep(500);
  }
}

async function getStableRecentSlotForLut(connection: Connection) {
  const finalizedSlot = await connection.getSlot("finalized");
  return Math.max(0, finalizedSlot - 8);
}

function extractLookupTableAddresses(
  umi: ReturnType<typeof createUmi>,
  builder: ReturnType<typeof updateMetadataV2>
) {
  const signerAddresses = new Set<string>([
    String(builder.getFeePayer(umi).publicKey),
    ...builder.items.flatMap(({ instruction }) =>
      instruction.keys.filter((meta) => meta.isSigner).map((meta) => String(meta.pubkey))
    ),
  ]);
  return Array.from(new Set(
    builder.items.flatMap(({ instruction }) => [
      String(instruction.programId),
      ...instruction.keys.map((meta) => String(meta.pubkey)),
    ])
  )).filter((address) => !signerAddresses.has(address));
}

async function sendBuilderAndConfirmWithSignature(
  umi: ReturnType<typeof createUmi>,
  provider: PhantomProvider,
  connection: Connection,
  builder: ReturnType<typeof updateMetadataV2>
) {
  const preparedBuilder = builder.getBlockhash()
    ? builder
    : await builder.setLatestBlockhash(umi, { commitment: "confirmed" });
  const transaction = toWeb3JsTransaction(preparedBuilder.build(umi));
  let signature: string;

  if (provider.signAndSendTransaction) {
    const result = await provider.signAndSendTransaction(transaction);
    signature = typeof result === "string" ? result : result.signature;
  } else {
    const signed = await provider.signTransaction(transaction);
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      preflightCommitment: "confirmed",
      maxRetries: 5,
    });
  }

  await waitForConfirmedSignature(connection, signature);
  return { signature };
}

async function sendBubblegumBuilderWithLutFallback(
  umi: ReturnType<typeof createUmi>,
  provider: PhantomProvider,
  connection: Connection,
  builder: ReturnType<typeof updateMetadataV2>
) {
  const sendWithBackendLookupTable = async () => {
    const addresses = extractLookupTableAddresses(umi, builder);
    const lookupTable = await apiRequest<{ lookupTableAddress: string; addresses: string[]; cached?: boolean }>("/solana/address-lookup-table", {
      method: "POST",
      body: { addresses },
    });
    if (!lookupTable.cached) {
      await sleep(8000);
    }
    return await builder
      .useV0()
      .setAddressLookupTables([{
        publicKey: publicKey(lookupTable.lookupTableAddress),
        addresses: lookupTable.addresses.map((address) => publicKey(address)),
      }])
      .setLatestBlockhash(umi, { commitment: "confirmed" })
      .then((transactionBuilder) => sendBuilderAndConfirmWithSignature(umi, provider, connection, transactionBuilder));
  };

  let fitsLegacyTransaction = true;
  try {
    fitsLegacyTransaction = builder.fitsInOneTransaction(umi);
  } catch {
    fitsLegacyTransaction = true;
  }

  if (!fitsLegacyTransaction) {
    return sendWithBackendLookupTable();
  }

  try {
    return await sendBuilderAndConfirmWithSignature(umi, provider, connection, builder);
  } catch (error) {
    if (!isTransactionTooLarge(error)) throw error;
    return sendWithBackendLookupTable();
  }
}

export async function mintCompressedVehicleWithPhantom(input: MintInput) {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error("Phantom wallet belum terdeteksi. Hubungkan Phantom untuk mint cNFT.");
  }

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const umi = createUmi(rpcUrl).use(mplBubblegum());
  const signer = await createPhantomSigner(provider);
  umi.use(signerIdentity(signer, true));

  const collection = input.coreCollection ? publicKey(input.coreCollection) : undefined;
  const result = await mintV2(umi, {
    collectionAuthority: collection ? umi.identity : undefined,
    leafOwner: umi.identity.publicKey,
    merkleTree: publicKey(input.merkleTree),
    coreCollection: collection,
    metadata: {
      name: input.name,
      uri: input.uri,
      sellerFeeBasisPoints: 0,
      collection: collection ? some(collection) : null,
      creators: [{ address: umi.identity.publicKey, verified: false, share: 100 }],
    },
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(result.signature)[0] as string;
  const leaf = await retry(() => parseLeafFromMintV2Transaction(umi, result.signature));
  const assetId = leaf.id ? String(leaf.id) : String(findLeafAssetIdPda(umi, {
    merkleTree: publicKey(input.merkleTree),
    leafIndex: leaf.nonce,
  })[0]);
  const connection = new Connection(rpcUrl, "confirmed");
  const transaction = await retry(() => connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }).then((tx) => {
    if (!tx) throw new Error("Transaction detail belum tersedia di RPC.");
    return tx;
  }));

  return {
    signature,
    assetId,
    treeAddress: input.merkleTree,
    leafIndex: Number(leaf.nonce),
    feeLamports: transaction?.meta?.fee ?? null,
    feeSol: transaction?.meta?.fee ? transaction.meta.fee / 1_000_000_000 : null,
    feePayer: String(umi.identity.publicKey),
  };
}

export async function transferCompressedVehicleWithPhantom(input: {
  newLeafOwner: string;
  coreCollection?: string | null;
  transferProof: TransferProofInput;
}) {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error("Phantom wallet belum terdeteksi. Hubungkan Phantom untuk transfer cNFT.");
  }

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const umi = createUmi(rpcUrl).use(mplBubblegum());
  const signer = await createPhantomSigner(provider);
  umi.use(signerIdentity(signer, true));

  const { transferV2 } = await import("@metaplex-foundation/mpl-bubblegum");
  const collection = input.coreCollection ? publicKey(input.coreCollection) : undefined;
  const result = await transferV2(umi, {
    authority: umi.identity,
    leafOwner: publicKey(input.transferProof.leafOwner),
    leafDelegate: publicKey(input.transferProof.leafDelegate),
    newLeafOwner: publicKey(input.newLeafOwner),
    merkleTree: publicKey(input.transferProof.merkleTree),
    coreCollection: collection,
    root: bytes32(input.transferProof.root),
    dataHash: bytes32(input.transferProof.dataHash),
    creatorHash: bytes32(input.transferProof.creatorHash),
    assetDataHash: input.transferProof.assetDataHash ? bytes32(input.transferProof.assetDataHash) : null,
    flags: input.transferProof.flags,
    nonce: BigInt(input.transferProof.nonce),
    index: input.transferProof.index,
    proof: input.transferProof.proof.map((item) => publicKey(item)),
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(result.signature)[0] as string;
  const connection = new Connection(rpcUrl, "confirmed");
  const transaction = await retry(() => connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }).then((tx) => {
    if (!tx) throw new Error("Transaction detail belum tersedia di RPC.");
    return tx;
  }));
  return {
    signature,
    feeLamports: transaction?.meta?.fee ?? null,
    feeSol: transaction?.meta?.fee ? transaction.meta.fee / 1_000_000_000 : null,
    feePayer: String(umi.identity.publicKey),
  };
}

export async function updateCompressedVehicleMetadataWithPhantom(input: PassportMetadataUpdateInput) {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error("Phantom wallet belum terdeteksi. Hubungkan Phantom untuk update cNFT metadata.");
  }

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const umi = createUmi(rpcUrl).use(mplBubblegum());
  const signer = await createPhantomSigner(provider);
  umi.use(signerIdentity(signer, true));

  const connection = new Connection(rpcUrl, "confirmed");
  const builder = updateMetadataV2(umi, {
    authority: umi.identity,
    payer: umi.identity,
    treeConfig: input.proof.treeConfig ? publicKey(input.proof.treeConfig) : undefined,
    leafOwner: publicKey(input.proof.leafOwner),
    leafDelegate: publicKey(input.proof.leafDelegate),
    merkleTree: publicKey(input.proof.merkleTree),
    coreCollection: input.collectionAddress ? publicKey(input.collectionAddress) : undefined,
    root: bytes32(input.proof.root),
    assetDataHash: input.proof.assetDataHash ? some(bytes32(input.proof.assetDataHash)) : none(),
    flags: typeof input.proof.flags === "number" ? some(input.proof.flags) : none(),
    nonce: BigInt(input.proof.nonce),
    index: input.proof.index,
    proof: input.proof.proof.map((item) => publicKey(item)),
    currentMetadata: {
      name: input.currentMetadata.name,
      symbol: input.currentMetadata.symbol,
      uri: input.currentMetadata.uri,
      sellerFeeBasisPoints: input.currentMetadata.sellerFeeBasisPoints,
      primarySaleHappened: input.currentMetadata.primarySaleHappened,
      isMutable: input.currentMetadata.isMutable,
      tokenStandard: typeof input.currentMetadata.tokenStandard === "number"
        ? some(input.currentMetadata.tokenStandard as TokenStandard)
        : some(TokenStandard.NonFungible),
      creators: input.currentMetadata.creators.map((creator) => ({
        address: publicKey(creator.address),
        verified: creator.verified,
        share: creator.share,
      })),
      collection: input.currentMetadata.collection ? some(publicKey(input.currentMetadata.collection)) : none(),
    },
    updateArgs: {
      name: none(),
      uri: some(input.updateArgs.uri),
      symbol: none(),
      creators: none(),
      sellerFeeBasisPoints: none(),
      primarySaleHappened: none(),
      isMutable: none(),
    },
  });
  const result = await sendBubblegumBuilderWithLutFallback(umi, provider, connection, builder);

  const signature = signatureToString(result.signature);
  const transaction = await getTransactionDetailsOrNull(connection, signature);

  return {
    signature,
    feeLamports: transaction?.meta?.fee ?? null,
    feeSol: transaction?.meta?.fee ? transaction.meta.fee / 1_000_000_000 : null,
    feePayer: String(umi.identity.publicKey),
  };
}
