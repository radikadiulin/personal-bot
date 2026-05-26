import "dotenv/config";

async function main() {
  const url = process.env.VERCEL_URL;
  if (!url) {
    console.error("❌ VERCEL_URL not set in .env");
    process.exit(1);
  }
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: `${url}/api/telegram` }),
    }
  );
  const data = await res.json();
  console.log(data.ok ? `✅ Webhook set to ${url}/api/telegram` : `❌ Failed: ${JSON.stringify(data)}`);
}

main();
