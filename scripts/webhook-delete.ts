import "dotenv/config";

async function main() {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteWebhook`
  );
  const data = await res.json();
  console.log(data.ok ? "✅ Webhook deleted. Bot is now in polling mode." : `❌ Failed: ${JSON.stringify(data)}`);
}

main();
