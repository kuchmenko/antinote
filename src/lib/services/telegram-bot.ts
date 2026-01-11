import { Telegraf, Markup, Context } from "telegraf";
import { message } from "telegraf/filters";
import { db } from "@/db";
import { connectTokens, telegramUsers, entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { OpenAIIntelligenceService } from "./openai-intelligence";
import { OpenAITranscriptionService } from "./openai-transcription";
import { StructuredData } from "./types";

// Define a custom context type including the match property for regex handlers
interface BotContext extends Context {
    match?: RegExpExecArray;
}

export class TelegramBotService {
    private bot: Telegraf<BotContext>;
    private intelligence: OpenAIIntelligenceService;
    private transcription: OpenAITranscriptionService;

    constructor(token: string) {
        this.bot = new Telegraf<BotContext>(token);
        this.intelligence = new OpenAIIntelligenceService();
        this.transcription = new OpenAITranscriptionService();

        this.initializeHandlers();
    }

    private initializeHandlers() {
        // Auth flow
        this.bot.start(async (ctx) => {
            const token = ctx.payload; // /start <token>
            if (!token) {
                return ctx.reply("Welcome to Antinote! Please connect your account via the web app.");
            }

            try {
                // Find token in DB
                const tokenRecord = await db.query.connectTokens.findFirst({
                    where: eq(connectTokens.token, token),
                });

                if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
                    return ctx.reply("Invalid or expired connection token. Please generate a new one from the web app.");
                }

                // Check if user already connected
                const existingUser = await db.query.telegramUsers.findFirst({
                    where: eq(telegramUsers.telegramChatId, ctx.chat.id.toString()),
                });

                if (existingUser) {
                    // Update user ID if re-connecting
                    await db
                        .update(telegramUsers)
                        .set({ userId: tokenRecord.userId, connectedAt: new Date() })
                        .where(eq(telegramUsers.telegramChatId, ctx.chat.id.toString()));
                } else {
                    // Create new connection
                    await db.insert(telegramUsers).values({
                        userId: tokenRecord.userId,
                        telegramChatId: ctx.chat.id.toString(),
                        username: ctx.from.username,
                        firstName: ctx.from.first_name,
                    });
                }

                // Delete used token
                await db.delete(connectTokens).where(eq(connectTokens.token, token));

                ctx.reply("Connected! You can now send me text or voice notes.");
            } catch (error) {
                console.error("Connection error:", error);
                ctx.reply("An error occurred while connecting your account.");
            }
        });

        // Commands
        this.bot.command("help", (ctx) => {
            ctx.reply(
                "Antinote Bot Help:\n" +
                "/summary - Generate a summary of today's notes\n" +
                "/recent - List the last 5 entries\n" +
                "Send any text or voice message to create a new note."
            );
        });

        this.bot.command("recent", async (ctx) => {
            const userId = await this.getUserId(ctx.chat.id.toString());
            if (!userId) return ctx.reply("Please connect your account first.");

            const recentEntries = await db
                .select()
                .from(entries)
                .where(eq(entries.userId, userId))
                .orderBy(desc(entries.createdAt))
                .limit(5);

            if (recentEntries.length === 0) {
                return ctx.reply("No notes found.");
            }

            const message = recentEntries
                .map((e) => {
                    const data = e.structuredData as unknown as StructuredData;
                    const icon = data.type === 'task' ? '✅' : data.type === 'idea' ? '💡' : '📝';
                    return `${icon} ${data.content}`;
                })
                .join("\n\n");

            ctx.reply(message);
        });

        this.bot.command("summary", async (ctx) => {
            // Note: In a real app, you might want to filter by "today" in local time.
            // For now we'll just grab recent entries to demo.
            const userId = await this.getUserId(ctx.chat.id.toString());
            if (!userId) return ctx.reply("Please connect your account first.");

            ctx.sendChatAction("typing");

            const recentEntries = await db
                .select()
                .from(entries)
                .where(eq(entries.userId, userId))
                .orderBy(desc(entries.createdAt))
                .limit(10); // Synthesize last 10 notes

            if (recentEntries.length === 0) {
                return ctx.reply("No notes found to summarize.");
            }

            const transcripts = recentEntries.map(e => e.transcript);
            const synthesis = await this.intelligence.synthesize(transcripts);

            ctx.reply(synthesis, { parse_mode: "Markdown" });
        });


        // Text messages
        this.bot.on(message("text"), async (ctx) => {
            const userId = await this.getUserId(ctx.chat.id.toString());
            if (!userId) {
                return ctx.reply("Please connect your account first by using the link in the Antinote web app.");
            }

            const text = ctx.message.text;
            await this.processNote(ctx, userId, text);
        });

        // Voice messages
        this.bot.on(message("voice"), async (ctx) => {
            const userId = await this.getUserId(ctx.chat.id.toString());
            if (!userId) {
                return ctx.reply("Please connect your account first.");
            }

            const fileId = ctx.message.voice.file_id;
            const fileLink = await ctx.telegram.getFileLink(fileId);

            ctx.sendChatAction("typing");

            try {
                // Fetch audio file
                const response = await fetch(fileLink.toString());
                const audioBlob = await response.blob();

                // Transcribe
                const transcript = await this.transcription.transcribe(audioBlob);

                // Process as note
                await this.processNote(ctx, userId, transcript, true);

            } catch (error) {
                console.error("Voice processing error:", error);
                ctx.reply("Sorry, I couldn't process that voice note.");
            }
        });

        // Action Handlers (Callbacks)
        this.bot.action(/^delete:(.+)$/, async (ctx) => {
            try {
                const userId = await this.getUserId(ctx.chat?.id.toString() || "");
                if (!userId) return;

                const match = ctx.match as RegExpExecArray;
                const entryId = match[1];

                await db.delete(entries).where(eq(entries.id, entryId));
                await ctx.deleteMessage();
                await ctx.answerCbQuery("Note deleted.");
            } catch (error) {
                console.error("Delete action error:", error);
                await ctx.answerCbQuery("Failed to delete note.");
            }
        });
    }

    private async getUserId(telegramChatId: string): Promise<string | null> {
        const user = await db.query.telegramUsers.findFirst({
            where: eq(telegramUsers.telegramChatId, telegramChatId),
        });
        return user?.userId || null;
    }

    private async processNote(ctx: BotContext, userId: string, text: string, isVoice = false) {
        try {
            // Structure data
            const structure = await this.intelligence.structure(text);

            // Save to DB
            const [newEntry] = await db
                .insert(entries)
                .values({
                    userId,
                    transcript: text,
                    structuredData: structure,
                    // rawAudioUrl: isVoice ? ... : null // Need storage solution (e.g. S3) for voice files
                })
                .returning();

            // Reply with confirmation
            const icon = structure.type === 'task' ? '✅' : structure.type === 'idea' ? '💡' : '📝';
            const actionText = structure.type === 'task' ? 'Task saved' : 'Note saved';

            await ctx.reply(
                `${icon} ${actionText}: "${structure.content}"`,
                Markup.inlineKeyboard([
                    Markup.button.callback("Delete", `delete:${newEntry.id}`),
                ])
            );

        } catch (error) {
            console.error("Note processing error:", error);
            ctx.reply("Saved, but failed to structure the note.");
            // Fallback save raw
            await db.insert(entries).values({
                userId,
                transcript: text,
                structuredData: { type: 'unknown', content: text, tags: [] },
            });
        }
    }

    public async handleUpdate(update: any) {
        return this.bot.handleUpdate(update);
    }
}
