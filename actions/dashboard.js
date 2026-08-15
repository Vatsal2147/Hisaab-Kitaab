"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) =>{ //we are receiving objects in Prisma datatype, so need to convert that into dafe, javascript data types and obejcts thats why we are serializing it.
    const serialized = {...obj};
//serializing the balance in case its a float
    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    }

    if(obj.amount){
        serialized.amount = obj.amount.toNumber();
    }

    return serialized;
}

export async function createAccount(data){ //this is a server action, that ACTUALLY creates the account. Press Create Account, lekin create toh backend pe hoga, toh frontend se backend ke liye ek server action chahiye hota hai aur ye vo hi hai
    try{
        //checking agar user hai ya nahi
        const {userId} = await auth();
       

        const user = await db.user.findUnique({
            where:{
                clerkUserId:userId
            },
        });

         if(!user) {
            throw new Error("Unauthorized");
        }
        //convert balance to float before saving
        const balanceFloat = parseFloat(data.balance);
        if(isNaN(balanceFloat)){
            throw new Error("Invalid balance amount");
        }

        //check if its user's first account
        const existingAccounts = await db.account.findMany({
            where: {userId: user.id},
        });

        const shouldBeDefault = existingAccounts.len==0?true:data.isDefault;

        //if this is true we make all the other accounts as NOT DEFAULT

        if(shouldBeDefault){
            await db.account.updateMany({
                where: {userId: user.id, isDefault:true},
                data: {isDefault:false}, 
            })
        }

        const account = await db.account.create({
            data:{
                ...data,
                balance:balanceFloat,
                userId:user.id,
                isDefault: shouldBeDefault,
            },
        });

        const serializedAccount =  serializeTransaction(account);

        revalidatePath("/dashboard");
        return {sucess:true, data:serializedAccount};

    } catch(error){
        throw new Error(error.message);
    }
}

export async function getUserAccounts(){
    const {userId} = await auth();
       

        const user = await db.user.findUnique({
            where:{
                clerkUserId:userId
            },
        });

         if(!user) {
            throw new Error("Unauthorized");
        }

        const accounts = await db.account.findMany({
            where:{userId:user.id},
            orderBy: {createdAt: "desc"},
            include:{
                _count:{
                    select:{
                        transactions:true,
                    }
                }
            }
        });

        const serializedAccount =  accounts.map(serializeTransaction);
        return serializedAccount;

}