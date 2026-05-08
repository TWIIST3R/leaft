-- RDV scheduling v1: proposed time slots + richer state machine

-- 1) meeting_request_slots: stores proposed slots for a meeting request group
create table if not exists public.meeting_request_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  group_id uuid not null,
  proposed_by text not null check (proposed_by in ('talent', 'admin')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'proposed' check (status in ('proposed', 'chosen', 'superseded', 'rejected')),
  created_at timestamptz not null default now(),
  constraint meeting_request_slots_time_check check (ends_at > starts_at)
);

create index if not exists meeting_request_slots_org_group_idx
  on public.meeting_request_slots (organization_id, group_id);

create index if not exists meeting_request_slots_group_status_idx
  on public.meeting_request_slots (group_id, status);

-- 2) meeting_requests: add state tracking + confirmed slot pointer
alter table public.meeting_requests
  add column if not exists state text;

alter table public.meeting_requests
  add column if not exists confirmed_slot_id uuid;

-- Optional: constrain values when column exists
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meeting_requests'
      and column_name = 'state'
  ) then
    begin
      alter table public.meeting_requests
        add constraint meeting_requests_state_check
        check (state is null or state in ('awaiting_admin_choice', 'awaiting_talent_confirmation', 'confirmed', 'closed'));
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

create index if not exists meeting_requests_org_group_idx
  on public.meeting_requests (organization_id, group_id);

