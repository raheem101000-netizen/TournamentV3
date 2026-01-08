
import { db } from "./server/db";
import { chatMessages, matches } from "@shared/schema";
import { eq } from "drizzle-orm";

async function testChat() {
    try {
        console.log("Testing Tournament Chat...");

        // 1. Get a match
        const activeMatches = await db.select().from(matches);
        if (activeMatches.length === 0) {
            console.error("No matches found.");
            process.exit(1);
        }
        const match = activeMatches[0];

        // 2. Post a message
        const messageContent = "Hello from automated test!";
        const userId = "system"; // or a valid user ID if needed, strict schema might require uuid
        // Schema: userId is varchar, optional in insert schema?
        // Let's check insertChatMessageSchema. userId is optional.

        console.log(`Posting message to match ${match.id}...`);

        await db.insert(chatMessages).values({
            matchId: match.id,
            message: messageContent,
            userId: "test-user-system", // dummy
            isSystem: 0
        });

        // 3. Verify message appears
        const messages = await db.select().from(chatMessages).where(eq(chatMessages.matchId, match.id));
        const postedMsg = messages.find(m => m.message === messageContent);

        if (postedMsg) {
            console.log(`Success: Message found! ID: ${postedMsg.id}, Content: "${postedMsg.message}"`);
            process.exit(0);
        } else {
            console.error("Failure: Message not found.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Error testing chat:", error);
        process.exit(1);
    }
}

testChat();
