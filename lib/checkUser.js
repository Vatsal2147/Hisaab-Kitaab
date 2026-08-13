import { currentUser } from "@clerk/nextjs/server"
import { db } from "./prisma";

export const checkUser = async () => {
    const user = await currentUser();

    console.log("CLERK USER:", user);

    if (!user) {
        console.log("NO USER");
        return null;
    }

    try {
        const loggedInUser = await db.user.findUnique({
            where: {
                clerkUserId: user.id,
            },
        });

        console.log("DATABASE USER:", loggedInUser);

        if (loggedInUser) {
            return loggedInUser;
        }

        const newUser = await db.user.create({
            data: {
                clerkUserId: user.id,
                imageUrl: user.imageUrl,
                email: user.emailAddresses[0].emailAddress,
            },
        });

        console.log("CREATED USER:", newUser);

        return newUser;
    } catch (error) {
        console.log("DATABASE ERROR:", error);
    }
};