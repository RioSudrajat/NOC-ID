import type { Prisma } from "@prisma/client";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const onchainQueue = new Queue("noc-onchain", { connection });

export async function enqueueOnchainJob(name: string, payload: Record<string, unknown>) {
  const jobRecord = await prisma.onchainJob.create({
    data: {
      name,
      payload: payload as Prisma.InputJsonValue
    }
  });

  await onchainQueue.add(name, { onchainJobId: jobRecord.id, ...payload }, { attempts: 5, backoff: { type: "exponential", delay: 5000 } });

  return jobRecord;
}
