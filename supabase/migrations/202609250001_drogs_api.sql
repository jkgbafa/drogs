create table public.drogs_people (
  id text primary key check (id ~ '^[BP][1-9][0-9]*$'),
  role text not null check (role in ('bishop', 'pastor')),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table public.drogs_records (
  person_id text primary key references public.drogs_people(id),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.drogs_api_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  key_hash text unique not null check (key_hash ~ '^[a-f0-9]{64}$'),
  scopes text[] not null check (scopes <@ array['directory:read','profiles:read','contacts:read','applications:read','application-answers:read','payments:read','payment-proofs:read','reviews:read','review-notes:read']),
  roles text[] not null default '{}' check (roles <@ array['bishop','pastor']),
  organizations text[] not null default '{}' check (organizations <@ array['UD-OLGC','UO-FLC190']),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  quota_window timestamptz not null default now(),
  quota_count integer not null default 0
);
create table public.drogs_api_audit (
  id bigint generated always as identity primary key,
  key_id uuid references public.drogs_api_keys(id),
  request_id uuid not null,
  method text not null,
  path text not null,
  status integer not null,
  created_at timestamptz not null default now()
);
alter table public.drogs_people enable row level security;
alter table public.drogs_records enable row level security;
alter table public.drogs_api_keys enable row level security;
alter table public.drogs_api_audit enable row level security;
revoke all on public.drogs_people, public.drogs_records, public.drogs_api_keys, public.drogs_api_audit from anon, authenticated;
grant all on public.drogs_people, public.drogs_records, public.drogs_api_keys, public.drogs_api_audit to service_role;
grant usage, select on sequence public.drogs_api_audit_id_seq to service_role;

create or replace function public.drogs_consume_api_quota(target_key uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare accepted uuid;
begin
  update public.drogs_api_keys
  set quota_count = case when quota_window <= now() - interval '1 minute' then 1 else quota_count + 1 end,
      quota_window = case when quota_window <= now() - interval '1 minute' then now() else quota_window end
  where id = target_key and revoked_at is null and expires_at > now()
    and (quota_window <= now() - interval '1 minute' or quota_count < 60)
  returning id into accepted;
  return accepted is not null;
end;
$$;
revoke all on function public.drogs_consume_api_quota(uuid) from public, anon, authenticated;
grant execute on function public.drogs_consume_api_quota(uuid) to service_role;
create index drogs_people_org on public.drogs_people ((data->>'organization'));
create index drogs_api_audit_key_date on public.drogs_api_audit (key_id, created_at);
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false) on conflict (id) do nothing;
