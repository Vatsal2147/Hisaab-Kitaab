import { PrismaClient } from "@prisma/client";
//--legacy-peer-deps se bas install bina kuchh chhue

//prismaclient vo hai jo nextJS ko PosteGre db se connect karta hai


export const db = globalThis.prisma || new PrismaClient();

if(process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}