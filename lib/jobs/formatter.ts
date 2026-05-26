import { Job } from "@/lib/jobs/types";

function titleCase(source: string): string {
  return source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
}

function postedLine(postedAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - postedAt.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) {
    return "📅 Posted today";
  }
  if (days === 1) {
    return "📅 Posted yesterday";
  }
  return `📅 Posted ${days} days ago`;
}

export function formatJob(job: Job): string {
  const lines: string[] = [];
  lines.push(`<b>${job.title}</b> — ${job.company}`);
  lines.push("");
  lines.push(`📍 ${job.location} | ${titleCase(job.source)}`);
  if (job.salary) {
    lines.push(`💰 ${job.salary}`);
  }
  if (job.postedAt) {
    lines.push(postedLine(job.postedAt));
  }
  lines.push("");
  lines.push(`<a href="${job.url}">View Job →</a>`);
  return lines.join("\n");
}
