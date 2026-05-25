import { Job, SearchParams } from "@/lib/jobs/types";

interface AdzunaItem {
  id: string | number;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
}

interface AdzunaResponse {
  results?: AdzunaItem[];
}

const SUPPORTED_COUNTRIES = new Set(["us", "gb", "ca", "de", "fr", "nl", "au"]);

const SENIORITY_TERMS: Record<string, string[]> = {
  mid: ["mid", "middle"],
  senior: ["senior", "sr."],
};

function matchesSeniority(title: string, seniority: string[]): boolean {
  if (seniority.length === 0) {
    return true;
  }
  const lower = title.toLowerCase();
  return seniority.some((level) => {
    const terms = SENIORITY_TERMS[level] ?? [level];
    return terms.some((term) => lower.includes(term));
  });
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (min !== undefined && max !== undefined) {
    return `$${Math.round(min)}–$${Math.round(max)}`;
  }
  return undefined;
}

async function searchCountry(country: string, params: SearchParams): Promise<Job[]> {
  const code = country.toLowerCase();
  if (!SUPPORTED_COUNTRIES.has(code)) {
    return [];
  }
  const query = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: params.keywords,
    results_per_page: "20",
    max_days_old: String(params.freshnessdays),
    "content-type": "application/json",
  });
  const url = `https://api.adzuna.com/v1/api/jobs/${code}/search/1?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  const body = (await res.json()) as AdzunaResponse;
  const results = body.results ?? [];
  return results
    .filter((item) => matchesSeniority(item.title, params.seniority))
    .map((item) => {
      const description = item.description;
      const remote =
        item.title.toLowerCase().includes("remote") ||
        description?.toLowerCase().includes("remote") ||
        false;
      return {
        id: String(item.id),
        source: "adzuna",
        title: item.title,
        company: item.company?.display_name ?? "",
        location: item.location?.display_name ?? "",
        remote,
        url: item.redirect_url,
        salary: formatSalary(item.salary_min, item.salary_max),
        postedAt: new Date(item.created),
        description,
      };
    });
}

export async function search(params: SearchParams): Promise<Job[]> {
  const perCountry = await Promise.all(
    params.countries.map((country) => searchCountry(country, params))
  );
  const all = perCountry.flat();
  const seen = new Set<string>();
  const deduped: Job[] = [];
  for (const job of all) {
    if (seen.has(job.id)) {
      continue;
    }
    seen.add(job.id);
    deduped.push(job);
  }
  return deduped;
}
