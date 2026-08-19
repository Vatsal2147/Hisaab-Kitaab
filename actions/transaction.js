"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

//Arcjet we will use to add rate limiting to the api

export async function createTransaction(data) {
    try{
        const {userId} = await auth();
        if(!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where:{
                clerkUserId: user.id
            },
        });

        if(!user){
            throw new Error("User not found");
        }

        const account = await db.accout.findUnique({
            where:{
                id:data.accountId,
                userId:user.id,
            },
        });

        if(!account) {
            throw new Error("Account not found");
        } 

        const balanceChange = data.type === "EXPENSE"? -data.amount:data.amount;
        const newBalance = account.balance.toNumber() + balanceChange
    } catch(error){

    }
}