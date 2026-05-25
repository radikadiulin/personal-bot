import { Job } from "@/lib/jobs/types";
import { createClient } from "@/lib/supabase";

export async function filterUnseen(jobs: Job[]): Promise<Job[]> {
  if (jobs.length === 0) {
    return [];
  }
  const supabase = createClient();
  const sources = Array.from(new Set(jobs.map((job) => job.source)));
  const jobIds = jobs.map((job) => job.id);
  const { data, error } = await supabase
    .from("jobs_seen")
    .select("source, job_id")
    .in("source", sources)
    .in("job_id", jobIds);
  if (error) {
    throw error;
  }
  const seen = new Set((data ?? []).map((row) => `${row.source}::${row.job_id}`));
  return jobs.filter((job) => !seen.has(`${job.source}::${job.id}`));
}

export async function markSeen(jobs: Job[]): Promise<void> {
  if (jobs.length === 0) {
    return;
  }
  const supabase = createClient();
  const rows = jobs.map((job) => ({ source: job.source, job_id: job.id }));
  const { error } = await supabase
    .from("jobs_seen")
    .upsert(rows, { onConflict: "source,job_id", ignoreDuplicates: true });
  if (error) {
    throw error;
  }
}
