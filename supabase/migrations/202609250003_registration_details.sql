create table public.registration_denominations(organization text not null,name text not null,primary key(organization,name));
alter table public.registration_denominations enable row level security;
revoke all on public.registration_denominations from anon,authenticated;
grant all on public.registration_denominations to service_role;
insert into public.registration_denominations values
('First Love','First Love Church'),
('First Love','Go Ye Church'),
('First Love','Go Church'),
('First Love','Jesus Gefunden'),
('First Love','Bénédiction Totale'),
('First Love','Mustard Seed Chapel International'),
('First Love','Qodesh Family Church'),
('United Denominations','1000 Micro Church Network International'),
('United Denominations','American Missionary Church'),
('United Denominations','Amour Internationale'),
('United Denominations','Anagkazo Assemblies'),
('United Denominations','Bema International Church'),
('United Denominations','Candle In The Dark Church'),
('United Denominations','Castle City Church'),
('United Denominations','Catch The Anointing Centre'),
('United Denominations','Double Mega Missionary Church'),
('United Denominations','East End City Churches'),
('United Denominations','East Mountain Churches'),
('United Denominations','Eglise Benediction Totale'),
('United Denominations','Enlargement Matrix Church'),
('United Denominations','Eschatos'),
('United Denominations','Ethiopia'),
('United Denominations','Everything By Prayer Center'),
('United Denominations','First Love Church Worldwide'),
('United Denominations','Fruitferos Internacional Guinea Bissau'),
('United Denominations','Go Church'),
('United Denominations','Good Shepherd Church Guyana'),
('United Denominations','Greater Love Church Ghana'),
('United Denominations','It Is A Great Thing To Serve The Lord'),
('United Denominations','Jesus Gefunden'),
('United Denominations','Jesus Is The Answer Church'),
('United Denominations','Jesus Is The Door'),
('United Denominations','Jesus Is The Rock Church'),
('United Denominations','Jesus Saviour Of The World Church International'),
('United Denominations','La Belle Eglise'),
('United Denominations','La Belle Eglise Gabon'),
('United Denominations','Laikos International Church'),
('United Denominations','Lighthouse Chapel International'),
('United Denominations','Lighthouse City Churches'),
('United Denominations','Living Waters International'),
('United Denominations','Loyalty House International'),
('United Denominations','Makarios City Church'),
('United Denominations','Makarios Western North'),
('United Denominations','Malawi'),
('United Denominations','Miracle Matrix Church'),
('United Denominations','Morning Star City Churches'),
('United Denominations','Mustard Seed Chapel International'),
('United Denominations','Onction Internationale Benin'),
('United Denominations','Others International Church'),
('United Denominations','Pleasant Surprise'),
('United Denominations','Poimano Internacional Nicaragua'),
('United Denominations','Poimen Church Senegal-Gambia'),
('United Denominations','Precious Souls Namibia'),
('United Denominations','Precious Souls Swaziland'),
('United Denominations','Premiero Amor'),
('United Denominations','Primeiras Obras'),
('United Denominations','Qodesh City Churches'),
('United Denominations','Qodesh Family Churches'),
('United Denominations','Reasonable Service'),
('United Denominations','Rejoice Greatly'),
('United Denominations','Rencontre Prophetique Internationale'),
('United Denominations','Revelation Church Of Asia'),
('United Denominations','Revival International'),
('United Denominations','Sagesse Internationale Guinea'),
('United Denominations','Savior Of Men International'),
('United Denominations','Saviours Of Men International'),
('United Denominations','Serious Christian Church'),
('United Denominations','Shepherd House International'),
('United Denominations','Strait Gate Church Liberia'),
('United Denominations','Strong Christian Church'),
('United Denominations','Talanta International Tanzania'),
('United Denominations','The Glorious Church'),
('United Denominations','The Machaneh Church International'),
('United Denominations','The Makarios Church'),
('United Denominations','The Mega Church'),
('United Denominations','United Cities'),
('United Denominations','Victoire Internationale'),
('United Denominations','West End City Churches');
create or replace function public.registration_action(action_name text,payload jsonb default '{}') returns void language plpgsql security definer set search_path='' as $$
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
  d:=jsonb_build_object('role',role_name,'firstName',trim(coalesce(payload->>'firstName','')),'lastName',trim(coalesce(payload->>'lastName','')),'name',concat_ws(' ',nullif(trim(payload->>'firstName'),''),nullif(trim(payload->>'lastName'),'')),'denomination',case when payload->>'organization' in ('First Love','United Denominations') then coalesce(payload->>'denomination','') else '' end,'country',trim(coalesce(payload->>'country','')),'city',trim(coalesce(payload->>'city','')),'photoConfirmed',coalesce((payload->>'photoConfirmed')::boolean,false),'email',email_address,'phone',trim(coalesce(payload->>'phone','')),'dob',coalesce(payload->>'dob',''),'church',trim(coalesce(payload->>'church','')),'organization',coalesce(payload->>'organization',''),'photo',coalesce(payload->>'photo',''),'bishopId',case when role_name='pastor' then coalesce(payload->>'bishopId','') else '' end,'bishopName',case when role_name='pastor' then trim(coalesce(payload->>'bishopName','')) else '' end);
  if is_submit then
   if d->>'firstName'='' or d->>'lastName'='' or length(d->>'name') not between 1 and 160 then raise exception 'Enter your full name.'; end if;
   if length(public.registration_phone(d->>'phone')) not between 7 and 15 then raise exception 'Enter a phone number with its country code.'; end if;
   if d->>'dob' !~ '^\d{4}-\d{2}-\d{2}$' or (d->>'dob')::date >= current_date or (d->>'dob')::date < date '1900-01-01' then raise exception 'Enter a valid date of birth in the past.'; end if;
   if d->>'country'='' or d->>'city'='' then raise exception 'Enter your country and city.'; end if;
   if d->>'organization' in ('First Love','United Denominations') and not exists(select 1 from public.registration_denominations where organization=d->>'organization' and name=d->>'denomination') then raise exception 'Select a denomination listed under your organization.'; end if;
   if not coalesce((d->>'photoConfirmed')::boolean,false) then raise exception 'Confirm your photo and required official attire before submitting.'; end if;
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
