create table people (
  id bigint generated always as identity primary key,
  role text not null check (role in ('bishop', 'pastor')),
  access_code integer not null,
  full_name text not null,
  organization text,
  country text,
  branch text,
  portrait_url text,
  active boolean not null default true,
  unique (role, access_code)
);

create table renewal_cycles (
  id bigint generated always as identity primary key,
  renewal_year integer not null unique,
  bishop_fee numeric(10,2) not null,
  pastor_fee numeric(10,2) not null,
  opens_at timestamptz,
  closes_at timestamptz
);

create table renewals (
  id bigint generated always as identity primary key,
  person_id bigint not null references people(id),
  cycle_id bigint not null references renewal_cycles(id),
  status text not null default 'not_started' check (status in ('not_started', 'draft', 'submitted')),
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (person_id, cycle_id)
);

create table payments (
  id bigint generated always as identity primary key,
  renewal_id bigint not null references renewals(id),
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  method text,
  provider_reference text,
  receipt_number text unique,
  paid_at timestamptz
);

create table reviews (
  id bigint generated always as identity primary key,
  renewal_id bigint not null references renewals(id),
  status text not null default 'awaiting_submission',
  internal_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index people_role_org_idx on people(role, organization);
create index renewals_status_idx on renewals(cycle_id, status);
create index payments_paid_at_idx on payments(paid_at);
