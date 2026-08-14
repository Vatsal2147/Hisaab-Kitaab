"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"

const serializeTransaction = (obj) =>{
    const serialized = {...obj};
//serializing the balance in case its a float
    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    }
}

export async function createAccount(data){
    try{
        const {userId} = await auth();
       

        const user = await db.user.findUnique({
            where:{
                clerkUserId:userId
            },
        });

         if(!userId) {
            throw new Error("Unauthorized");
        }
        //convert balance to float before saving
        const balanceFloat = parseFloat(data.balance);
        if(isNaN(balanceFloat)){
            throw new Error("Invalid balance amount");
        }

        //check if its user's first account
        const existingAccounts = await db.user.findMany({
            where: {userId:user.id},
        });

        const shouldBeDefault = existingAccounts.len==0?true:data.isDefault;

        //if this is true we make all the other accounts as NOT DEFAULT

        if(shouldBeDefault){
            await db.account.updateMany({
                where: {userId: user.id, isDefault:true},
                data: {isDefault:false}, 
            })
        }

        const account = await db.accout.create({
            data:{
                ...data,
                balance:balanceFloat,
                userId:user.id,
                isDefault: shouldBeDefault,
            },
        });

        const serializedAccout =  serializeTransaction(account);

        revalidatePath("/dashboard");
        return {sucess:true, data:serializedAccout};

    } catch(error){
        throw new Error(error.message);
    }
}