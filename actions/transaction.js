"use server"
import { GoogleGenAI } from "@google/genai";
import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

//Arcjet we will use to add rate limiting to the api
const serializeAmount = (obj) => ({
    ...obj,
    amount: obj.amount.toNumber(),
})


export async function createTransaction(data) { //yaha pe error tha usko dhundo JALDI
    try{
        const {userId} = await auth();
        console.log("BEFORE ARCJET");
        if(!userId) throw new Error("Unauthorized");

        //arcjet for rate limiting
//get data for acrjet
const req = await request();
//check rate limit
const decision = await aj.protect(req,
    {
        userId,
        requested:1,  //how many tokens to consume

    });  
    console.log("DECISION:", {
  id: decision.id,
  conclusion: decision.conclusion,
  errored: decision.isErrored(),
  denied: decision.isDenied(),
  reason: decision.reason,
  results: decision.results,
});

    console.log("AFTER ARCJET");
    console.log("ARCJET DECISION:", decision);

    if (decision.isDenied()){
        if(decision.reason.isRateLimit()){
            const {remaining, reset} = decision.reason;
            console.error({
                code: "RATE_LIMIT_EXCEEDED",
                details: {
                    remaining, 
                    resetInSeconds: reset,
                },
            });

             throw new Error("Too many requests, Please try again later.");
        }
         throw new Error("Request Blocked.");
    }

        const user = await db.user.findUnique({
            where:{
                clerkUserId: userId
            },
        });

        if(!user){
            throw new Error("User not found");
        }

        const account = await db.account.findUnique({
            where:{
                id:data.accountId,
                userId:user.id,
            },
        });

        if(!account) {
            throw new Error("Account not found");
        } 

        const balanceChange = data.type === "EXPENSE"? -data.amount:data.amount;
        const newBalance = account.balance.toNumber() + balanceChange;

        const transaction = await db.$transaction(async(tx)=> {
            const newTransaction = await tx.transaction.create({
                data:{
                    ...data,
                    userId:user.id,
                    nextRecurringDate: data.isRecurring && data.recurringInterval?calculateNextRecurringDate(data.date, data.recurringInterval):null,
                    
                },
            });

            await tx.account.update({
                where:{
                    id:data.accountId
                },
                data:{
                    balance: newBalance
                },
            });
            return newTransaction;
        });

         revalidatePath("/dashboard");
         revalidatePath(`/account/${transaction.accountId}`);

         return{
            success:true,
            data:serializeAmount(transaction),
         }
    } catch(error){
        throw new Error(error.message);
    }
}

function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

export async function scanReceipt(file) {
    try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing, transportation, groceries, utilities, entertainment, food, shopping, healthcare, education, personal, travel, insurance, gifts, bills, other-expense)

      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If it's not a receipt, return an empty object.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: base64String,
            mimeType: file.type,
          },
        },
        {
          text: prompt,
        },
      ],
    });

    const text = response.text;

    const cleanedText = text
      .replace(/```(?:json)?\n?/g, "")
      .trim();

    try {
      const data = JSON.parse(cleanedText);

      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

export async function getTransaction(id){
    const {userId} = await auth();
    if(!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where:{
            clerkUserId:userId,
        },
    });

    if(!user) throw new Error("User not found");

    const transaction = await db.transaction.findUnique({
        where:{
            id, userId: user.id,
        }
    });

    if(!transaction) throw new Error("Transaction not found");

    return serializeAmount(transaction);
}

export async function updateTransaction(id,data){
    try {
         const {userId} = await auth();
    if(!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where:{
            clerkUserId:userId,
        },
    });

    if(!user) throw new Error("User not found");

    const originalTransaction = await db.transaction.findUnique({
        where:{
            id,
            userId: user.id,
        },
        include: {
            account:true,
        },
        
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    //Calculate the balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;
     

     // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return{success:true, data:serializeAmount(transaction)};

    } catch (error) {
        
    }
}