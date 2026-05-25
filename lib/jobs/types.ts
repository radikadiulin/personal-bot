export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  url: string;
  salary?: string;
  postedAt?: Date;
  description?: string;
}

export interface SearchParams {
  keywords: string;
  countries: string[];
  remote: boolean;
  seniority: string[];
  freshnessdays: number;
  batchSize: number;
}

export interface JobSearchSettings {
  keywords: string;
  countries: string[];
  remote: boolean;
  seniority: string[];
  freshness_days: number;
  batch_size: number;
  notification_style: 'per_job' | 'digest';
  schedule_interval_days: number;
  schedule_paused: boolean;
  last_run_at: string | null;
}
