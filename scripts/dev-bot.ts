import "dotenv/config";
import { handleMessage } from "@/lib/bot/handler";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
let offset = 0;

async function poll(): Promise<void> {
  const res = await fetch(
    `https://api.telegram.org/bot${TOKEN}/getUpdates?timeout=30&offset=${offset}`
  );
  const data = await res.json();

  for (const update of data.result ?? []) {
    offset = update.update_id + 1;
    const text: string = update.message?.text ?? "";
    const chatId: string = String(update.message?.chat?.id);
    if (text) {
      console.log(`[${chatId}] ${text}`);
      await handleMessage(text, chatId).catch((err) =>
        console.error("Handler error:", err)
      );
    }
  }
}

async function main(): Promise<void> {
  console.log("🤖 Bot polling started. Ctrl+C to stop.");
  while (true) {
    await poll().catch((err) => console.error("Poll error:", err));
  }
}

main();
