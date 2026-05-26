import "dotenv/config";
import { getSettings, updateSettings } from "@/lib/supabase";
import { shouldRun } from "@/lib/jobs/scheduler";
import { filterUnseen, markSeen } from "@/lib/jobs/dedup";
import { formatJob } from "@/lib/jobs/formatter";
import { search } from "@/lib/jobs/sources/adzuna";
import { sendMessage } from "@/lib/telegram";

export async function main(): Promise<void> {
  const settings = await getSettings();

  const force = process.env.FORCE_RUN === "true";
  if (!force && !shouldRun(settings, new Date())) {
    console.log("Skipping: paused or interval not elapsed");
    return;
  }

  const chatId = process.env.TELEGRAM_CHAT_ID!;

  const jobs = await search({
    keywords: settings.keywords,
    countries: settings.countries,
    remote: settings.remote,
    seniority: settings.seniority,
    freshnessdays: settings.freshness_days,
    batchSize: settings.batch_size,
  });

  const unseen = await filterUnseen(jobs);
  const batch = unseen.slice(0, settings.batch_size);

  await markSeen(batch);

  if (settings.notification_style === "per_job") {
    for (const job of batch) {
      await sendMessage(chatId, formatJob(job), "HTML");
    }
  } else {
    if (batch.length > 0) {
      const digest = batch.map(formatJob).join("\n\n---\n\n");
      await sendMessage(chatId, digest, "HTML");
    }
  }

  const sent = batch.length;
  const skipped = jobs.length - unseen.length;
  await sendMessage(chatId, `✅ ${sent} new jobs sent. ${skipped} skipped (already seen).`);

  await updateSettings({ last_run_at: new Date().toISOString() });
}

if (require.main === module) {
  main();
}
