export async function sendMessage(
  chatId: string,
  text: string,
  parseMode?: "Markdown" | "HTML"
): Promise<void> {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode ?? "Markdown",
        disable_web_page_preview: false,
      }),
    }
  );
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Telegram sendMessage failed: ${res.status} ${detail}`);
  }
}
