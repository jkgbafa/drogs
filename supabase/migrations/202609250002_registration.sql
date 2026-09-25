-- Independent annual registration tables. Legacy DROGS tables and records remain unchanged.
create table public.registration_settings (id boolean primary key default true check(id), current_year integer not null check(current_year between 2027 and 2200));
insert into public.registration_settings values(true,2027);
create table public.registration_office (user_id uuid primary key references auth.users(id));
create table public.registration_references (id text primary key, name text not null, title text not null default 'Bishop', organization text not null default '', image text);
create table public.registration_profiles (
 id uuid primary key references auth.users(id), role text not null check(role in ('bishop','pastor')),
 name text not null, email text not null, organization text not null default '',
 bishop_approved boolean not null default false, reference_id text unique references public.registration_references(id),
 check(not bishop_approved or role='bishop')
);
create table public.registration_annual (
 user_id uuid not null references public.registration_profiles(id), cycle_year integer not null,
 data jsonb not null, status text not null check(status in ('draft','pending','unclaimed','confirmed','removed')),
 amount integer not null check(amount in (50,100)), payment text not null default 'unpaid' check(payment in ('unpaid','pending','verified','rejected')),
 proof text, payment_note text, nonrefundable_at timestamptz, payment_submitted_at timestamptz, payment_reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), submitted_at timestamptz,
 primary key(user_id,cycle_year)
);
create table public.registration_rosters (
 id uuid primary key default gen_random_uuid(), bishop_id uuid not null references public.registration_profiles(id), cycle_year integer not null,
 name text not null, email text not null default '', phone text not null default '', church text not null default '',
 status text not null default 'active' check(status in ('active','removed')), pastor_id uuid references public.registration_profiles(id),
 reason text, note text, created_at timestamptz not null default now(), confirmed_by uuid references auth.users(id), confirmed_at timestamptz, removed_at timestamptz,
 unique(cycle_year,pastor_id)
);
create table public.registration_audit (
 id uuid primary key default gen_random_uuid(), actor uuid not null references auth.users(id), action text not null, cycle_year integer not null,
 target text not null, at timestamptz not null default now(), detail jsonb not null default '{}'
);
create index registration_annual_year_status on public.registration_annual(cycle_year,status);
create index registration_rosters_bishop_year on public.registration_rosters(bishop_id,cycle_year);
create index registration_annual_bishop on public.registration_annual((data->>'bishopId'));
alter table public.registration_settings enable row level security;
alter table public.registration_office enable row level security;
alter table public.registration_references enable row level security;
alter table public.registration_profiles enable row level security;
alter table public.registration_annual enable row level security;
alter table public.registration_rosters enable row level security;
alter table public.registration_audit enable row level security;
revoke all on public.registration_settings,public.registration_office,public.registration_references,public.registration_profiles,public.registration_annual,public.registration_rosters,public.registration_audit from anon,authenticated;
grant all on public.registration_settings,public.registration_office,public.registration_references,public.registration_profiles,public.registration_annual,public.registration_rosters,public.registration_audit to service_role;
create function public.registration_is_office() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.registration_office where user_id=auth.uid())$$;
create function public.registration_name(value text) returns text language sql immutable set search_path='' as $$
 select trim(regexp_replace(regexp_replace(lower(regexp_replace(normalize(coalesce(value,''),NFKD),U&'[\0300-\036f]','','g')),'[^a-z0-9 ]',' ','g'),'\s+',' ','g'))
$$;
create function public.registration_phone(value text) returns text language sql immutable set search_path='' as $$select regexp_replace(coalesce(value,''),'\D','','g')$$;
create function public.registration_bishop(key text) returns uuid language sql stable security definer set search_path='' as $$select id from public.registration_profiles where bishop_approved and coalesce(reference_id,id::text)=key$$;
create function public.registration_reconcile() returns void language plpgsql security definer set search_path='' as $$
declare r record; candidate uuid; candidates integer; selected_bishop uuid; assigned record;
begin
 for r in select a.* from public.registration_annual a where a.status<>'draft' and a.cycle_year=(select current_year from public.registration_settings where id) order by a.created_at loop
  if r.data->>'role'='bishop' then
   update public.registration_annual set status=case when (select bishop_approved from public.registration_profiles where id=r.user_id) then 'confirmed' else 'pending' end where user_id=r.user_id and cycle_year=r.cycle_year;
  else
   select * into assigned from public.registration_rosters where cycle_year=r.cycle_year and pastor_id=r.user_id;
   if found then
    update public.registration_annual set status=case when assigned.status='active' then 'confirmed' else 'removed' end where user_id=r.user_id and cycle_year=r.cycle_year;
   else
    selected_bishop:=public.registration_bishop(r.data->>'bishopId');
    select count(*),min(id::text)::uuid into candidates,candidate from public.registration_rosters x
    where x.cycle_year=r.cycle_year and x.bishop_id=selected_bishop and x.status='active' and x.pastor_id is null
      and public.registration_name(x.name)=public.registration_name(r.data->>'name')
      and ((x.email<>'' and lower(trim(x.email))=lower(trim(r.data->>'email'))) or (public.registration_phone(x.phone)<>'' and public.registration_phone(x.phone)=public.registration_phone(r.data->>'phone')));
    if candidates=1 then
     update public.registration_rosters set pastor_id=r.user_id,confirmed_at=now() where id=candidate;
     update public.registration_annual set status='confirmed' where user_id=r.user_id and cycle_year=r.cycle_year;
    else update public.registration_annual set status='unclaimed' where user_id=r.user_id and cycle_year=r.cycle_year;
    end if;
   end if;
  end if;
 end loop;
end$$;
create function public.registration_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); office boolean:=public.registration_is_office(); result jsonb;
begin
 if uid is null then raise exception 'Sign in first.'; end if;
 select jsonb_build_object('version',1,'year',(select current_year from public.registration_settings where id),'office',office,
 'profiles',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'role',p.role,'name',p.name,'email',p.email,'organization',p.organization,'bishopApproved',p.bishop_approved,'referenceId',p.reference_id)),'[]') from public.registration_profiles p where office or p.id=uid),
 'directory',(select coalesce(jsonb_agg(x order by x->>'name'),'[]') from (
  select jsonb_build_object('id',r.id,'name',r.name,'title',r.title,'organization',r.organization,'image',r.image,'accountId',p.id) x from public.registration_references r left join public.registration_profiles p on p.reference_id=r.id and p.bishop_approved
  union all select jsonb_build_object('id',p.id,'name',p.name,'title','Bishop','organization',p.organization,'accountId',p.id) from public.registration_profiles p where p.bishop_approved and p.reference_id is null
 ) entries),
 'registrations',(select coalesce(jsonb_agg(jsonb_build_object('userId',a.user_id,'year',a.cycle_year,'data',a.data,'status',a.status,'amount',a.amount,'payment',a.payment,'proof',a.proof,'paymentNote',a.payment_note,'createdAt',a.created_at,'updatedAt',a.updated_at,'submittedAt',a.submitted_at,'nonrefundableAt',a.nonrefundable_at,'paymentSubmittedAt',a.payment_submitted_at,'paymentReviewedAt',a.payment_reviewed_at)),'[]') from public.registration_annual a where office or a.user_id=uid or (a.status<>'draft' and a.data->>'role'='pastor' and public.registration_bishop(a.data->>'bishopId')=uid)),
 'rosters',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'bishopId',r.bishop_id,'year',r.cycle_year,'name',r.name,'email',r.email,'phone',r.phone,'church',r.church,'status',r.status,'pastorId',r.pastor_id,'reason',r.reason,'note',r.note,'createdAt',r.created_at,'confirmedBy',r.confirmed_by,'confirmedAt',r.confirmed_at,'removedAt',r.removed_at)),'[]') from public.registration_rosters r where office or r.bishop_id=uid),
 'audit',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'actor',a.actor,'action',a.action,'year',a.cycle_year,'target',a.target,'at',a.at)),'[]') from public.registration_audit a where office or a.actor=uid)
 ) into result;
 return result;
end$$;
create function public.registration_action(action_name text,payload jsonb default '{}') returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); office boolean:=public.registration_is_office(); yr integer; email_address text; p public.registration_profiles; a public.registration_annual; r public.registration_rosters; target uuid; bishop uuid; d jsonb; item jsonb; role_name text; path text; is_submit boolean:=action_name='submit';
begin
 if uid is null then raise exception 'Sign in first.'; end if;
 -- Serialize mutations within a cycle: duplicate claims and stale approvals cannot race.
 select current_year into yr from public.registration_settings where id for update;
 select lower(email) into email_address from auth.users where id=uid and email_confirmed_at is not null;
 if email_address is null then raise exception 'Verify your email before continuing.'; end if;
 select * into p from public.registration_profiles where id=uid;
 target:=coalesce(nullif(payload->>'userId','')::uuid,uid);
 if action_name in ('approveBishop','assignBishop','reviewPayment','openYear') and not office then raise exception 'Office access required.'; end if;
 if action_name in ('addRoster','carryRoster') and not coalesce(p.bishop_approved,false) then raise exception 'Your bishop account must be approved by the office.'; end if;
 if action_name in ('save','submit') then
  role_name:=payload->>'role';
  if role_name not in ('pastor','bishop') or role_name is null then raise exception 'Choose Bishop or Pastor.'; end if;
  if p.id is not null and p.role<>role_name then raise exception 'Contact the office to change your account role.'; end if;
  select * into a from public.registration_annual where user_id=uid and cycle_year=yr;
  if found and a.status<>'draft' then raise exception 'This year’s registration has already been submitted. Contact the office for corrections.'; end if;
  d:=jsonb_build_object('role',role_name,'name',trim(coalesce(payload->>'name','')),'email',email_address,'phone',trim(coalesce(payload->>'phone','')),'dob',coalesce(payload->>'dob',''),'church',trim(coalesce(payload->>'church','')),'organization',coalesce(payload->>'organization',''),'photo',coalesce(payload->>'photo',''),'bishopId',case when role_name='pastor' then coalesce(payload->>'bishopId','') else '' end,'bishopName',case when role_name='pastor' then trim(coalesce(payload->>'bishopName','')) else '' end);
  if is_submit then
   if length(d->>'name') not between 1 and 160 then raise exception 'Enter your full name.'; end if;
   if length(public.registration_phone(d->>'phone')) not between 7 and 15 then raise exception 'Enter a phone number with its country code.'; end if;
   if d->>'dob' !~ '^\d{4}-\d{2}-\d{2}$' or (d->>'dob')::date >= current_date or (d->>'dob')::date < date '1900-01-01' then raise exception 'Enter a valid date of birth in the past.'; end if;
   if d->>'church'='' then raise exception 'Enter your church.'; end if;
   if d->>'organization' not in ('First Love','United Denominations','DHMM','FLOW','Healing Jesus Campaign') then raise exception 'Choose your organization.'; end if;
   if role_name='pastor' and (d->>'bishopId'='' or (d->>'bishopId'='missing' and d->>'bishopName'='')) then raise exception 'Select your bishop, or enter the name of an unlisted bishop.'; end if;
   if role_name='pastor' and d->>'bishopId'<>'missing' and not exists(select 1 from public.registration_references where id=d->>'bishopId') and public.registration_bishop(d->>'bishopId') is null then raise exception 'Select a valid bishop.'; end if;
  end if;
  path:=d->>'photo';
  if path<>'' then
   if path not like uid::text||'/portrait/%' or not exists(select 1 from storage.objects where bucket_id='registration-media' and name=path) then raise exception 'Upload your own official-attire photo.'; end if;
  elsif is_submit then raise exception 'Upload your official-attire photo.';
  end if;
  insert into public.registration_profiles(id,role,name,email,organization) values(uid,role_name,d->>'name',email_address,d->>'organization') on conflict(id) do update set name=excluded.name,organization=excluded.organization;
  insert into public.registration_annual(user_id,cycle_year,data,status,amount,submitted_at) values(uid,yr,d,case when not is_submit then 'draft' when role_name='bishop' then 'pending' else 'unclaimed' end,case when role_name='bishop' then 100 else 50 end,case when is_submit then now() end)
  on conflict(user_id,cycle_year) do update set data=excluded.data,status=excluded.status,submitted_at=excluded.submitted_at,updated_at=now();
 elsif action_name='approveBishop' then
  select * into a from public.registration_annual where user_id=target and cycle_year=yr;
  if a.user_id is null or a.data->>'role'<>'bishop' or a.status<>'pending' then raise exception 'Select a bishop awaiting approval.'; end if;
  if nullif(payload->>'referenceId','') is not null and exists(select 1 from public.registration_profiles where reference_id=payload->>'referenceId' and id<>target) then raise exception 'That reference is already linked to another bishop.'; end if;
  update public.registration_profiles set bishop_approved=true,reference_id=nullif(payload->>'referenceId','') where id=target and role='bishop';
 elsif action_name='addRoster' then
  if jsonb_typeof(payload->'rows')<>'array' or coalesce(jsonb_array_length(payload->'rows'),0) not between 1 and 500 then raise exception 'Add between 1 and 500 pastors at a time.'; end if;
  for item in select value from jsonb_array_elements(payload->'rows') loop
   if trim(coalesce(item->>'name',''))='' or (coalesce(item->>'email','') !~ '^\S+@\S+\.\S+$' and length(public.registration_phone(item->>'phone'))<7) then raise exception 'Each pastor needs a name and a valid email or phone number.'; end if;
   if exists(select 1 from public.registration_rosters x where x.bishop_id=uid and x.cycle_year=yr and public.registration_name(x.name)=public.registration_name(item->>'name') and ((x.email<>'' and lower(trim(x.email))=lower(trim(item->>'email'))) or (public.registration_phone(x.phone)<>'' and public.registration_phone(x.phone)=public.registration_phone(item->>'phone')))) then raise exception 'A pastor in this import already exists in this year’s list.'; end if;
   insert into public.registration_rosters(bishop_id,cycle_year,name,email,phone,church) values(uid,yr,trim(item->>'name'),lower(trim(coalesce(item->>'email',''))),trim(coalesce(item->>'phone','')),trim(coalesce(item->>'church','')));
  end loop;
 elsif action_name='claim' then
  select * into a from public.registration_annual where user_id=target and cycle_year=yr;
  if a.user_id is null or a.status<>'unclaimed' or a.data->>'role'<>'pastor' then raise exception 'This registration is no longer Unclaimed. Refresh the page.'; end if;
  bishop:=public.registration_bishop(a.data->>'bishopId');
  if bishop is null then raise exception 'Assign an approved bishop first.'; end if;
  if not office and bishop<>uid then raise exception 'Only the selected bishop or office can confirm this pastor.'; end if;
  if nullif(payload->>'rosterId','') is not null then
   update public.registration_rosters set pastor_id=target,confirmed_by=uid,confirmed_at=now() where id=(payload->>'rosterId')::uuid and bishop_id=bishop and cycle_year=yr and status='active' and pastor_id is null;
   if not found then raise exception 'That roster entry is no longer available.'; end if;
  else insert into public.registration_rosters(bishop_id,cycle_year,name,email,phone,church,pastor_id,confirmed_by,confirmed_at) values(bishop,yr,a.data->>'name',a.data->>'email',a.data->>'phone',a.data->>'church',target,uid,now());
  end if;
 elsif action_name='assignBishop' then
  if public.registration_bishop(payload->>'bishopId') is null then raise exception 'Select an approved bishop.'; end if;
  update public.registration_annual set data=data||jsonb_build_object('bishopId',payload->>'bishopId','bishopName',''),updated_at=now() where user_id=target and cycle_year=yr and status='unclaimed' and data->>'role'='pastor';
  if not found then raise exception 'Select an Unclaimed pastor.'; end if;
 elsif action_name='removeRoster' then
  select * into r from public.registration_rosters where id=(payload->>'id')::uuid and cycle_year=yr and status='active';
  if r.id is null then raise exception 'This roster entry is not active.'; end if;
  if not office and r.bishop_id<>uid then raise exception 'Only the supervising bishop or office can update this entry.'; end if;
  if coalesce(payload->>'reason','') not in ('Transferred','Resigned','Dismissed','Other') then raise exception 'Choose a reason.'; end if;
  if payload->>'reason'='Other' and trim(coalesce(payload->>'note',''))='' then raise exception 'Explain the removal reason.'; end if;
  update public.registration_rosters set status='removed',reason=payload->>'reason',note=payload->>'note',removed_at=now() where id=r.id;
 elsif action_name='carryRoster' then
  insert into public.registration_rosters(bishop_id,cycle_year,name,email,phone,church)
  select uid,yr,r.name,r.email,r.phone,r.church from public.registration_rosters r where r.bishop_id=uid and r.cycle_year=yr-1 and r.status='active' and not exists(select 1 from public.registration_rosters x where x.bishop_id=uid and x.cycle_year=yr and public.registration_name(x.name)=public.registration_name(r.name) and lower(trim(x.email))=lower(trim(r.email)) and public.registration_phone(x.phone)=public.registration_phone(r.phone));
 elsif action_name='payment' then
  select * into a from public.registration_annual where user_id=uid and cycle_year=yr;
  if a.user_id is null or a.status<>'confirmed' then raise exception 'Payment unlocks after confirmation.'; end if;
  if a.payment='verified' then raise exception 'This payment has already been verified.'; end if;
  if not coalesce((payload->>'nonrefundable')::boolean,false) then raise exception 'Acknowledge the non-refundable commitment.'; end if;
  path:=coalesce(payload->>'proof','');
  if path not like uid::text||'/receipt/%' or not exists(select 1 from storage.objects where bucket_id='registration-media' and name=path) then raise exception 'Upload your payment proof.'; end if;
  update public.registration_annual set proof=path,payment='pending',nonrefundable_at=now(),payment_submitted_at=now(),updated_at=now() where user_id=uid and cycle_year=yr;
 elsif action_name='reviewPayment' then
  if coalesce(payload->>'result','') not in ('verified','rejected') then raise exception 'Choose a payment decision.'; end if;
  if payload->>'result'='rejected' and trim(coalesce(payload->>'note',''))='' then raise exception 'Explain why replacement proof is needed.'; end if;
  update public.registration_annual set payment=payload->>'result',payment_note=payload->>'note',payment_reviewed_at=now() where user_id=target and cycle_year=yr and payment='pending';
  if not found then raise exception 'Select a payment awaiting verification.'; end if;
 elsif action_name='openYear' then
  if (payload->>'year')::integer is distinct from yr+1 then raise exception 'The next cycle must be the following year.'; end if;
  yr:=yr+1;update public.registration_settings set current_year=yr where id;
 else raise exception 'Unknown action.';
 end if;
 perform public.registration_reconcile();
 insert into public.registration_audit(actor,action,cycle_year,target,detail) values(uid,action_name,yr,coalesce(payload->>'userId',payload->>'id',uid::text),jsonb_build_object('reason',payload->>'reason','note',payload->>'note','referenceId',payload->>'referenceId','bishopId',payload->>'bishopId'));
end$$;
-- Only authenticated RPCs can mutate registration records. No client can self-assign office or bishop privileges.
revoke all on function public.registration_is_office(),public.registration_name(text),public.registration_phone(text),public.registration_bishop(text),public.registration_reconcile(),public.registration_snapshot(),public.registration_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.registration_snapshot(),public.registration_action(text,jsonb) to authenticated;
-- Private uploads, served only by expiring signed URLs to the owner, selected bishop or office.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('registration-media','registration-media',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create function public.registration_can_read_media(path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (split_part(path,'/',1)=auth.uid()::text or public.registration_is_office() or exists(select 1 from public.registration_annual a where a.data->>'photo'=path and a.status<>'draft' and a.data->>'role'='pastor' and public.registration_bishop(a.data->>'bishopId')=auth.uid()))
$$;
revoke all on function public.registration_can_read_media(text) from public,anon,authenticated;
grant execute on function public.registration_can_read_media(text) to authenticated;
create policy registration_upload on storage.objects for insert to authenticated with check(bucket_id='registration-media' and (storage.foldername(name))[1]=auth.uid()::text and (storage.foldername(name))[2] in ('portrait','receipt'));
create policy registration_read_upload on storage.objects for select to authenticated using(bucket_id='registration-media' and public.registration_can_read_media(name));
