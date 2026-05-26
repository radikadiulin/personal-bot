import "dotenv/config";

const commands = [
  { command: "jobs", description: "Run job search now" },
  { command: "jobs_status", description: "Show current search settings" },
  { command: "jobs_setup", description: "Configure keywords, countries, seniority, etc." },
  { command: "jobs_schedule", description: "Set schedule interval (daily, weekly, every N)" },
  { command: "jobs_pause", description: "Pause scheduled job search" },
  { command: "jobs_resume", description: "Resume scheduled job search" },
];

const res = await fetch(
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setMyCommands`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands }),
  }
);

const data = await res.json();
console.log(data.ok ? "✅ Commands set." : `❌ Failed: ${JSON.stringify(data)}`);
