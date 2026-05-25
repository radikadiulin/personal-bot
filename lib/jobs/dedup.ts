import { Job } from "@/lib/jobs/types";

export async function filterUnseen(jobs: Job[]): Promise<Job[]> {
  return jobs;
}

export async function markSeen(jobs: Job[]): Promise<void> {}
