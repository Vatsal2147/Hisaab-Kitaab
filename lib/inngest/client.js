// src/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "hisaabkitaab", name: "HisaabKitaab",
    retryFunction: async (attempt) => ({
        delay: Math.pow(2,attempt)*1000,
        maxAttempts:2,
    }),
 });