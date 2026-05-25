create table if not exists job_search_settings (
  id integer primary key default 1,
  keywords text not null default 'product manager',
  countries text[] not null default array['US'],
  remote boolean not null default true,
  seniority text[] not null default array['mid', 'senior'],
  freshness_days integer not null default 7,
  batch_size integer not null default 10,
  notification_style text not null default 'per_job',
  schedule_interval_days integer not null default 1,
  schedule_paused boolean not null default false,
  last_run_at timestamptz
);

-- seed default row
insert into job_search_settings (id) values (1) on conflict (id) do nothing;

create table if not exists jobs_seen (
  id serial primary key,
  source text not null,
  job_id text not null,
  seen_at timestamptz not null default now(),
  unique (source, job_id)
);
