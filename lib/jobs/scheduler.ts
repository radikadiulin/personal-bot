import { JobSearchSettings } from "@/lib/jobs/types";

export function shouldRun(settings: JobSearchSettings, now: Date): boolean {
  return false;
}
