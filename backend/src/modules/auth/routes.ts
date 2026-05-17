import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createEmbeddedWallet } from "../../lib/embeddedWallet.js";
import { sha256Hex } from "../../lib/hash.js";
import { prisma } from "../../lib/prisma.js";
import { verifySolanaMessageSignature } from "../../lib/solanaSignature.js";

const walletVerifySchema = z.object({
  address: z.string().min(32),
  role: z.enum(["user", "workshop_owner", "enterprise_admin", "admin"]),
  message: z.string().min(1),
  signature: z.string().min(1)
});

const authUserSelect = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  phone: true,
  role: true,
  walletState: true,
  embeddedWalletAddress: true,
  selfCustodyAddress: true,
  workshopId: true,
  enterpriseId: true,
  createdAt: true
} as const;

function serializeAuthUser(user: {
  id: string;
  username?: string | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  role: "user" | "workshop_owner" | "enterprise_admin" | "admin";
  walletState?: "none" | "embedded" | "self_custody";
  embeddedWalletAddress?: string | null;
  selfCustodyAddress?: string | null;
  workshopId?: string | null;
  enterpriseId?: string | null;
  createdAt?: Date;
}) {
  return {
    userId: user.id,
    username: user.username ?? undefined,
    role: user.role,
    walletState: user.walletState ?? "none",
    walletAddress: user.embeddedWalletAddress ?? user.selfCustodyAddress ?? undefined,
    embeddedWalletAddress: user.embeddedWalletAddress ?? undefined,
    selfCustodyAddress: user.selfCustodyAddress ?? undefined,
    displayName: user.displayName,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    workshopId: user.workshopId ?? undefined,
    enterpriseId: user.enterpriseId ?? undefined,
    createdAt: user.createdAt?.toISOString()
  };
}

async function createSession(app: Parameters<FastifyPluginAsync>[0], user: { id: string; role: string; embeddedWalletAddress?: string | null; selfCustodyAddress?: string | null }) {
  const token = app.jwt.sign({
    sub: user.id,
    role: user.role,
    walletAddress: user.embeddedWalletAddress ?? user.selfCustodyAddress ?? undefined
  });
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: sha256Hex(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });
  return token;
}

export const registerAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request) => {
    const body = z.object({
      username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
      email: z.string().trim().email().transform((value) => value.toLowerCase()),
      password: z.string().min(8).max(128)
    }).parse(request.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] }
    });
    if (existing) {
      throw app.httpErrors.conflict("Username atau email sudah terdaftar.");
    }

    const wallet = createEmbeddedWallet();
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        username: body.username,
        displayName: body.username,
        email: body.email,
        passwordHash,
        role: "user",
        walletState: "embedded",
        embeddedWalletAddress: wallet.address,
        embeddedWalletEncryptedSecret: wallet.encryptedSecret,
        embeddedWalletNonce: wallet.nonce,
        embeddedWalletTag: wallet.tag,
        wallets: {
          create: {
            address: wallet.address,
            role: "user",
            status: "active",
            entityName: body.username
          }
        }
      },
      select: authUserSelect
    });
    const token = await createSession(app, user);
    return { token, user: serializeAuthUser(user) };
  });

  app.post("/login", async (request) => {
    const body = z.object({
      email: z.string().trim().email().transform((value) => value.toLowerCase()),
      password: z.string().min(1)
    }).parse(request.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { ...authUserSelect, passwordHash: true }
    });
    if (!user?.passwordHash || user.role !== "user") {
      throw app.httpErrors.unauthorized("Email atau password salah.");
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw app.httpErrors.unauthorized("Email atau password salah.");
    }
    const token = await createSession(app, user);
    return { token, user: serializeAuthUser(user) };
  });

  app.get("/me", async (request) => {
    try {
      const payload = await request.jwtVerify<{ sub: string }>();
      const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: authUserSelect });
      if (!user) throw app.httpErrors.notFound("User not found.");
      return { user: serializeAuthUser(user) };
    } catch {
      throw app.httpErrors.unauthorized("Session tidak valid.");
    }
  });

  app.post("/nonce", async (request) => {
    const body = z.object({
      address: z.string().min(32).optional(),
      role: z.enum(["user", "workshop_owner", "enterprise_admin", "admin"]).optional()
    }).partial().parse(request.body ?? {});
    const nonce = randomUUID();
    const lines = ["NOC ID wallet login"];
    if (body.role) lines.push(`Role: ${body.role}`);
    if (body.address) lines.push(`Address: ${body.address}`);
    lines.push(`Nonce: ${nonce}`, `Issued At: ${new Date().toISOString()}`);
    return {
      nonce,
      message: lines.join("\n")
    };
  });

  app.post("/wallet/verify", async (request) => {
    const body = walletVerifySchema.parse(request.body);
    if (!body.message.includes("NOC ID wallet login") || !body.message.includes(`Address: ${body.address}`) || !body.message.includes(`Role: ${body.role}`)) {
      throw app.httpErrors.badRequest("Wallet message does not match requested address and role.");
    }
    const issuedAtMatch = body.message.match(/^Issued At:\s*(.+)$/m);
    const issuedAt = issuedAtMatch ? Date.parse(issuedAtMatch[1]) : Number.NaN;
    if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > 1000 * 60 * 10) {
      throw app.httpErrors.badRequest("Wallet login message is expired or malformed.");
    }
    let signatureValid = false;
    try {
      signatureValid = verifySolanaMessageSignature(body.address, body.message, body.signature);
    } catch (error) {
      throw app.httpErrors.badRequest(error instanceof Error ? error.message : "Invalid wallet signature.");
    }
    if (!signatureValid) {
      throw app.httpErrors.unauthorized("Wallet signature verification failed.");
    }
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ embeddedWalletAddress: body.address }, { selfCustodyAddress: body.address }] }
    });
    const user = existingUser
      ? await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: body.role, walletState: "self_custody", selfCustodyAddress: body.address }
      })
      : await prisma.user.create({
        data: {
        displayName: `NOC ${body.role.replace("_", " ")}`,
        role: body.role,
        walletState: "self_custody",
        embeddedWalletAddress: body.address,
        selfCustodyAddress: body.address
      }
      });

    await prisma.wallet.upsert({
      where: { address: body.address },
      update: { role: body.role, userId: user.id, status: "active" },
      create: { address: body.address, role: body.role, userId: user.id, status: "active" }
    });

    const token = await createSession(app, user);

    return {
      token,
      user: serializeAuthUser(user)
    };
  });

  app.post("/otp/request", async (request) => {
    const body = z.object({ channel: z.enum(["phone", "email"]), destination: z.string().min(3) }).parse(request.body);
    return { ok: true, channel: body.channel, destination: body.destination, devOtp: "123456" };
  });

  app.post("/otp/verify", async (request) => {
    const body = z.object({ destination: z.string().min(3), otp: z.string().regex(/^\d{6}$/) }).parse(request.body);
    const isEmail = body.destination.includes("@");
    const user = await prisma.user.upsert({
      where: isEmail ? { email: body.destination } : { phone: body.destination },
      update: {},
      create: {
        displayName: "NOC Owner",
        role: "user",
        walletState: "none",
        email: isEmail ? body.destination : undefined,
        phone: isEmail ? undefined : body.destination
      }
    });
    const token = await createSession(app, user);
    return { token, user: serializeAuthUser(user) };
  });

  app.post("/logout", async () => ({ ok: true }));
};
