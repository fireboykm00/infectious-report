-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create enum types
create type user_role as enum ('admin', 'health_worker', 'lab_technician', 'epidemiologist');

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";
create type case_status as enum ('draft', 'submitted', 'processing', 'confirmed', 'rejected');
create type notification_type as enum ('email', 'sms', 'push');
create type outbreak_status as enum ('monitoring', 'active', 'contained', 'resolved');

-- Create tables
-- Users table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  role user_role not null default 'health_worker',
  facility_id uuid,
  full_name text,
  phone_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Facilities table
create table public.facilities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  location geometry(Point, 4326),
  address text,
  contact_person text,
  contact_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Case reports table
create table public.case_reports (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null,
  reported_by uuid references public.users(id),
  facility_id uuid references public.facilities(id),
  disease_code text not null,
  symptoms text[],
  onset_date date,
  report_date timestamptz default now(),
  location geometry(Point, 4326),
  status case_status default 'draft',
  lab_result_id uuid,
  severity_level int check (severity_level between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Lab results table
create table public.lab_results (
  id uuid primary key default uuid_generate_v4(),
  case_report_id uuid references public.case_reports(id),
  technician_id uuid references public.users(id),
  test_type text not null,
  result text not null,
  test_date timestamptz not null,
  attachment_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications table
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  type notification_type not null,
  title text not null,
  message text not null,
  status text default 'pending',
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Outbreaks table
create table public.outbreaks (
  id uuid primary key default uuid_generate_v4(),
  disease_code text not null,
  status outbreak_status default 'monitoring',
  start_date timestamptz not null,
  end_date timestamptz,
  affected_area geometry(Polygon, 4326),
  case_count int default 0,
  severity_level int check (severity_level between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create functions
-- Function to update case report status
create or replace function update_case_report_status(
  report_id uuid,
  new_status case_status
) returns void as $$
begin
  update public.case_reports
  set status = new_status,
      updated_at = now()
  where id = report_id;
end;
$$ language plpgsql security definer;

-- Function to create notification
create or replace function create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text
) returns uuid as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (user_id, type, title, message)
  values (p_user_id, p_type, p_title, p_message)
  returning id into notification_id;
  
  return notification_id;
end;
$$ language plpgsql security definer;

-- RLS Policies
-- Users can only read their own data
alter table public.users enable row level security;
create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

-- Health workers can create case reports
alter table public.case_reports enable row level security;
create policy "Health workers can create reports" on public.case_reports
  for insert with check (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'health_worker'
    )
  );

-- Lab technicians can update lab results
alter table public.lab_results enable row level security;
create policy "Lab technicians can update results" on public.lab_results
  for update using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'lab_technician'
    )
  );

-- Triggers
-- Update timestamp trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_timestamp
  before update on public.users
  for each row execute function update_updated_at();

create trigger update_case_reports_timestamp
  before update on public.case_reports
  for each row execute function update_updated_at();

-- Notify on case report status change
create or replace function notify_case_report_update()
returns trigger as $$
begin
  if new.status != old.status then
    perform create_notification(
      new.reported_by,
      'email',
      'Case Report Status Updated',
      format('Case report %s status changed to %s', new.id, new.status)
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger case_report_status_notification
  after update on public.case_reports
  for each row
  when (old.status is distinct from new.status)
  execute function notify_case_report_update();