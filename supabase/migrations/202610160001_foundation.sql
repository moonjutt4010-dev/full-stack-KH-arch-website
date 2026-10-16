-- Apply to a fresh Supabase project. No seed or production data.
begin;
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text not null default '' check (char_length(phone) <= 30 and phone ~ '^[+0-9 ().-]*$'),
  service text not null check (service in ('Architecture','Interior design','Planning & consultation')),
  location text not null check (char_length(btrim(location)) between 2 and 160),
  budget text not null check (budget in ('To be discussed','Under $100k','$100k–$500k','$500k–$1m','$1m+')),
  message text not null check (char_length(btrim(message)) between 20 and 4000),
  status text not null default 'new' check (status in ('new','contacted','qualified','proposal','won','lost')),
  consent_at timestamptz not null default now(),
  privacy_version text not null default '2026-10-16',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_customer_created_idx on public.leads(customer_id,created_at desc);
create index leads_status_created_idx on public.leads(status,created_at desc);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_created_idx on public.notifications(user_id,created_at desc);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_created_idx on public.audit_logs(created_at desc);
create table app_private.intake_attempts (
  ip_hash text not null,
  email_hash text not null,
  created_at timestamptz not null default now()
);
create index intake_ip_idx on app_private.intake_attempts(ip_hash,created_at);
create index intake_email_idx on app_private.intake_attempts(email_hash,created_at);

-- Role checks cannot depend on user-controlled auth metadata.
create function app_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to authenticated;

create function app_private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,role) values(new.id,'customer');
  return new;
end;
$$;
revoke all on function app_private.create_profile() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function app_private.create_profile();
-- Existing auth users receive the least-privileged role.
insert into public.profiles(id) select id from auth.users on conflict do nothing;

create function app_private.touch_lead() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function app_private.touch_lead() from public;
create trigger lead_updated before update on public.leads for each row execute function app_private.touch_lead();

-- Changes, audit records and notifications commit together. No brief or contact
-- information is copied into audit metadata or notification messages.
create function app_private.record_lead_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs(actor_id,action,entity_id,metadata)
    values(coalesce(auth.uid(),new.customer_id),'lead.created',new.id,jsonb_build_object('status',new.status));
    insert into public.notifications(user_id,lead_id,message)
    select id,new.id,'A new consultation request has arrived.' from public.profiles where role='admin';
    if new.customer_id is not null then
      insert into public.notifications(user_id,lead_id,message) values(new.customer_id,new.id,'Your consultation request has been received.');
    end if;
  else
    if new.status is distinct from old.status then
      insert into public.audit_logs(actor_id,action,entity_id,metadata)
      values(auth.uid(),'lead.status_changed',new.id,jsonb_build_object('from',old.status,'to',new.status));
      if new.customer_id is not null then
        insert into public.notifications(user_id,lead_id,message) values(new.customer_id,new.id,'Your consultation is now in the ' || new.status || ' stage.');
      end if;
    end if;
    if new.customer_id is distinct from old.customer_id then
      insert into public.audit_logs(actor_id,action,entity_id,metadata)
      values(auth.uid(),'lead.customer_linked',new.id,jsonb_build_object('previous_customer_id',old.customer_id,'customer_id',new.customer_id));
      -- Remove notifications referring to a request no longer owned by a customer.
      delete from public.notifications where lead_id=new.id and user_id=old.customer_id;
      if new.customer_id is not null then
        insert into public.notifications(user_id,lead_id,message) values(new.customer_id,new.id,'A consultation request has been linked to your account.');
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function app_private.record_lead_event() from public;
create trigger lead_event after insert or update on public.leads for each row execute function app_private.record_lead_event();

create function app_private.record_role_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role then
    insert into public.audit_logs(actor_id,action,entity_id,metadata)
    values(auth.uid(),'profile.role_changed',new.id,jsonb_build_object('from',old.role,'to',new.role));
  end if;
  return new;
end;
$$;
revoke all on function app_private.record_role_event() from public;
create trigger profile_role_event after update on public.profiles for each row execute function app_private.record_role_event();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table app_private.intake_attempts enable row level security;
revoke all on public.profiles,public.leads,public.notifications,public.audit_logs from anon, authenticated;
grant select on public.profiles,public.leads,public.notifications,public.audit_logs to authenticated;
grant update(status) on public.leads to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (id=(select auth.uid()) or app_private.is_admin());
create policy leads_read on public.leads for select to authenticated using (customer_id=(select auth.uid()) or app_private.is_admin());
create policy leads_admin_update on public.leads for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
create policy notifications_read on public.notifications for select to authenticated using (user_id=(select auth.uid()));
create policy notifications_mark_read on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy audit_admin_read on public.audit_logs for select to authenticated using (app_private.is_admin());

-- No direct anonymous inserts or reads. This RPC is callable only by the
-- trusted server service-role client after origin, size and Zod validation.
create function public.submit_consultation(p_lead jsonb,p_customer_id uuid,p_ip_hash text,p_email_hash text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_ip_hash is null or p_email_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' or p_email_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_rate_key';
  end if;
  -- Serialize the short admission transaction so limits survive concurrent
  -- requests and multiple app instances. No in-memory rate limiter.
  perform pg_advisory_xact_lock(860016);
  delete from app_private.intake_attempts where created_at < now()-interval '24 hours';
  if (select count(*) from app_private.intake_attempts where ip_hash=p_ip_hash and created_at>now()-interval '1 hour') >= 5
    or (select count(*) from app_private.intake_attempts where email_hash=p_email_hash and created_at>now()-interval '1 hour') >= 3 then
    raise exception 'rate_limit';
  end if;
  insert into app_private.intake_attempts(ip_hash,email_hash) values(p_ip_hash,p_email_hash);
  insert into public.leads(customer_id,name,email,phone,service,location,budget,message)
  values(p_customer_id,p_lead->>'name',lower(p_lead->>'email'),coalesce(p_lead->>'phone',''),p_lead->>'service',p_lead->>'location',p_lead->>'budget',p_lead->>'message');
end;
$$;
revoke all on function public.submit_consultation(jsonb,uuid,text,text) from public,anon,authenticated;
grant execute on function public.submit_consultation(jsonb,uuid,text,text) to service_role;

-- The sole browser-accessible ownership operation verifies the admin role in
-- PostgreSQL. No arbitrary lead updates or client-controlled role provisioning.
create function public.assign_lead_customer(p_lead_id uuid,p_customer_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if not exists(select 1 from public.profiles where id=p_customer_id and role='customer') then raise exception 'customer_not_found'; end if;
  update public.leads set customer_id=p_customer_id where id=p_lead_id;
  if not found then raise exception 'lead_not_found'; end if;
end;
$$;
revoke all on function public.assign_lead_customer(uuid,uuid) from public,anon;
grant execute on function public.assign_lead_customer(uuid,uuid) to authenticated;
commit;
