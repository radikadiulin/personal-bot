import { getSettings, updateSettings } from "@/lib/supabase";
import { sendMessage } from "@/lib/telegram";
import { triggerScraper } from "@/lib/github";
import { JobSearchSettings } from "@/lib/jobs/types";

const SETUP_USAGE = [
  "Job Search Setup",
  "",
  "/jobs_setup keywords <value>",
  "/jobs_setup countries <US,DE,GB>",
  "/jobs_setup remote <true|false>",
  "/jobs_setup seniority <mid,senior>",
  "/jobs_setup freshness <N>",
  "/jobs_setup batch <N>",
  "/jobs_setup style <per_job|digest>",
].join("\n");

function formatStatus(settings: JobSearchSettings): string {
  return [
    "<b>Job Search Status</b>",
    "",
    `🔍 Keywords: ${settings.keywords}`,
    `🌍 Countries: ${settings.countries.join(", ")}`,
    `🏠 Remote: ${settings.remote ? "yes" : "no"}`,
    `📊 Seniority: ${settings.seniority.join(", ")}`,
    `📅 Freshness: last ${settings.freshness_days} days`,
    `📦 Batch size: ${settings.batch_size} jobs/run`,
    `💬 Notifications: ${settings.notification_style}`,
    `⏱ Schedule: every ${settings.schedule_interval_days} day(s)`,
    `⏸ Paused: ${settings.schedule_paused ? "yes" : "no"}`,
    `🕐 Last run: ${settings.last_run_at ?? "never"}`,
  ].join("\n");
}

async function handleSetup(chatId: string, parts: string[]): Promise<void> {
  const sub = parts[1];
  const value = parts.slice(2).join(" ");

  if (!sub) {
    await sendMessage(chatId, SETUP_USAGE);
    return;
  }

  switch (sub) {
    case "keywords":
      await updateSettings({ keywords: value });
      await sendMessage(chatId, `✅ Keywords set to: ${value}`);
      return;
    case "countries":
      await updateSettings({
        countries: value.split(",").map((c) => c.trim()).filter(Boolean),
      });
      await sendMessage(chatId, `✅ Countries updated.`);
      return;
    case "remote":
      await updateSettings({ remote: value.trim().toLowerCase() === "true" });
      await sendMessage(chatId, `✅ Remote set to: ${value.trim().toLowerCase() === "true"}`);
      return;
    case "seniority":
      await updateSettings({
        seniority: value.split(",").map((s) => s.trim()).filter(Boolean),
      });
      await sendMessage(chatId, `✅ Seniority updated.`);
      return;
    case "freshness":
      await updateSettings({ freshness_days: parseInt(value, 10) });
      await sendMessage(chatId, `✅ Freshness set to ${parseInt(value, 10)} days.`);
      return;
    case "batch":
      await updateSettings({ batch_size: parseInt(value, 10) });
      await sendMessage(chatId, `✅ Batch size set to ${parseInt(value, 10)}.`);
      return;
    case "style": {
      const style = value.trim();
      if (style === "per_job" || style === "digest") {
        await updateSettings({ notification_style: style });
        await sendMessage(chatId, `✅ Notification style set to ${style}.`);
      } else {
        await sendMessage(chatId, "Usage: /jobs_setup style <per_job|digest>");
      }
      return;
    }
    default:
      await sendMessage(chatId, SETUP_USAGE);
  }
}

async function handleSchedule(chatId: string, parts: string[]): Promise<void> {
  const mode = parts[1];
  let interval: number | null = null;

  if (mode === "daily") {
    interval = 1;
  } else if (mode === "weekly") {
    interval = 7;
  } else if (mode === "every") {
    const n = parseInt(parts[2], 10);
    if (!Number.isNaN(n)) {
      interval = n;
    }
  }

  if (interval === null) {
    await sendMessage(chatId, "Usage: /jobs_schedule <daily|weekly|every N>");
    return;
  }

  await updateSettings({ schedule_interval_days: interval });
  await sendMessage(chatId, `✅ Schedule set to every ${interval} day(s).`);
}

export async function handleMessage(text: string, chatId: string): Promise<void> {
  const parts = text.trim().split(/\s+/);
  const command = parts[0].split("@")[0]; // strip @botname suffix if present

  switch (command) {
    case "/jobs":
      await triggerScraper();
      await sendMessage(chatId, "🔄 Job search started. Results will arrive shortly.");
      break;
    case "/jobs_status":
      await sendMessage(chatId, formatStatus(await getSettings()), "HTML");
      break;
    case "/jobs_pause":
      await updateSettings({ schedule_paused: true });
      await sendMessage(chatId, "⏸ Job search paused.");
      break;
    case "/jobs_resume":
      await updateSettings({ schedule_paused: false });
      await sendMessage(chatId, "▶️ Job search resumed.");
      break;
    case "/jobs_setup":
      await handleSetup(chatId, parts);
      break;
    case "/jobs_schedule":
      await handleSchedule(chatId, parts);
      break;
    default:
      break;
  }
}
