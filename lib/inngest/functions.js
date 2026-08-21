// src/inngest/functions.ts
import { gte, lte } from "zod";
import { db } from "../prisma";
import { inngest } from "./client";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { GoogleGenAI } from "@google/genai";

//npx inngest-cli@latest dev --no-discovery -u http://localhost:3000/api/inngest
//npx --ignore-scripts=false inngest-cli@latest dev --no-discovery -u http://localhost:3000/api/inngest
//start with this



export const checkBudgetAlert = inngest.createFunction(
  {
    id: "check-budget-alert",
    name: "Check Budget Alerts",
    triggers: { cron: "0 */6 * * *" },
  },
  async ({ step }) => {
    const budgets = await step.run("fetch-budget", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });
    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; //skip if no default accounts

      await step.run(`check-budget-${budget.id}`, async () => {
        const currentDate = new Date();
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );

        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        );

        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        console.log("Percentage used:", percentageUsed);
        console.log("Last alert sent:", budget.lastAlertSent);

        if (
          percentageUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          console.log("ENTERED EMAIL CONDITION");
          //send email
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          //update LastAlertSent in db
          await db.budget.update({
            where: {
              id: budget.id,
            },
            data: {
              lastAlertSent: new Date(),
            },
          });
        }
      });
    }
  },
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",

    triggers: {
      cron: "0 0 1 * *",
    },
  },

  async ({ step }) => {
    const users = await step.run("fetch-user", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();

        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);

        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        const insights = await generateFinancialInsights(
          stats,
          monthName
        );

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report for ${monthName}`,

          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return {
      processed: users.length,
    };
  }
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateFinancialInsights(stats, month) {
  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.

    Focus on:
    - Spending patterns
    - Areas where the user can save
    - Practical financial advice

    Keep the insights friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,

      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating insights:", error);

    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }

}

const getMonthlyStats = async (userId, month) => {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transactions.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    },
  );
};
