import { JobSearchSettings } from "@/lib/jobs/types";

export function shouldRun(settings: JobSearchSettings, now: Date): boolean {
  if (settings.schedule_paused) {
    return false;
  }
  if (settings.last_run_at === null) {
    return true;
  }
  const elapsed = now.getTime() - new Date(settings.last_run_at).getTime();
  const interval = settings.schedule_interval_days * 24 * 60 * 60 * 1000;
  return elapsed >= interval;
}
