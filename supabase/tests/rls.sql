-- Run ONLY against a disposable local Supabase database after applying migration.
-- All fixtures are transaction-scoped and rolled back, even after success.
begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000001','customer-a@example.test'),
 ('00000000-0000-4000-8000-000000000002','customer-b@example.test'),
 ('00000000-0000-4000-8000-000000000003','admin@example.test');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000000003';
insert into public.leads(id,customer_id,name,email,service,location,budget,message) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Customer A','customer-a@example.test','Architecture','Test city','To be discussed','Transaction-scoped test brief for customer A.'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','Customer B','customer-b@example.test','Interior design','Test city','To be discussed','Transaction-scoped test brief for customer B.');

set local role anon;
do $$ begin
  begin perform * from public.leads; raise exception 'FAIL: anon can read leads'; exception when insufficient_privilege then null; end;
  begin perform public.submit_consultation('{}',null,repeat('a',64),repeat('b',64)); raise exception 'FAIL: anon can call intake'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ declare affected integer; begin
  if (select count(*) from public.leads)<>1 then raise exception 'FAIL: customer isolation'; end if;
  if (select count(*) from public.audit_logs)<>0 then raise exception 'FAIL: customer sees audit log'; end if;
  if exists(select 1 from public.notifications where user_id<>auth.uid()) then raise exception 'FAIL: notification isolation'; end if;
  update public.leads set status='won'; get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL: customer can mutate lead'; end if;
  begin update public.profiles set role='admin' where id=auth.uid(); raise exception 'FAIL: self promotion'; exception when insufficient_privilege then null; end;
  begin update public.leads set customer_id=auth.uid(); raise exception 'FAIL: ownership override'; exception when insufficient_privilege then null; end;
  begin perform public.assign_lead_customer('10000000-0000-4000-8000-000000000002',auth.uid()); raise exception 'FAIL: customer can link lead'; exception when insufficient_privilege then null; end;
  update public.notifications set read_at=now() where user_id=auth.uid();
end $$;

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.leads)<>2 then raise exception 'FAIL: admin cannot see leads'; end if;
  update public.leads set status='qualified' where id='10000000-0000-4000-8000-000000000001';
  if not exists(select 1 from public.audit_logs where action='lead.status_changed' and metadata->>'to'='qualified') then raise exception 'FAIL: audit missing'; end if;
  begin update public.leads set email='changed@example.test'; raise exception 'FAIL: admin has excessive column access'; exception when insufficient_privilege then null; end;
  begin delete from public.audit_logs; raise exception 'FAIL: audit can be deleted'; exception when insufficient_privilege then null; end;
  perform public.assign_lead_customer('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
end $$;

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.leads) then raise exception 'FAIL: previous owner retains access'; end if;
  if exists(select 1 from public.notifications where lead_id='10000000-0000-4000-8000-000000000001') then raise exception 'FAIL: stale owner notification'; end if;
end $$;
reset role;

set local role service_role;
do $$ declare payload jsonb; begin
  payload='{"name":"Rate test","email":"rate@example.test","service":"Architecture","location":"Test city","budget":"To be discussed","message":"A transaction-scoped rate limit test brief."}';
  for i in 1..3 loop perform public.submit_consultation(payload,null,repeat('a',64),repeat('b',64)); end loop;
  begin
    perform public.submit_consultation(payload,null,repeat('a',64),repeat('b',64));
    raise exception 'FAIL: rate limit missing';
  exception when raise_exception then if sqlerrm<>'rate_limit' then raise; end if; end;
end $$;
reset role;
rollback;
