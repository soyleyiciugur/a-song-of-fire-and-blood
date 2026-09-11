begin;
alter table public.profiles add column affinity jsonb not null default '{}'::jsonb check(jsonb_typeof(affinity)='object' and octet_length(affinity::text)<=12000);
create table public.member_wallets (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 balance bigint not null default 0 check(balance>=0 and balance<=9007199254740991)
);
insert into public.member_wallets(user_id) select id from public.profiles;
create function public.create_member_wallet() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.member_wallets(user_id) values(new.id); return new; end $$;
create trigger create_member_wallet after insert on public.profiles for each row execute function public.create_member_wallet();
alter table public.member_wallets enable row level security;
create policy wallet_read on public.member_wallets for select to authenticated using(user_id=auth.uid());
create table public.hasocash_transfers (
 id uuid primary key,
 sender_id uuid not null references public.profiles(id),
 recipient_id uuid not null references public.profiles(id),
 amount bigint not null check(amount>0 and amount<=9007199254740991),
 created_at timestamptz not null default now(),
 check(sender_id<>recipient_id)
);
alter table public.hasocash_transfers enable row level security;
create policy transfer_read on public.hasocash_transfers for select to authenticated using(auth.uid() in(sender_id,recipient_id));
create function public.grant_hasocash(recipient uuid, amount bigint, request_id uuid) returns bigint
language plpgsql security definer set search_path='' as $$
declare sender uuid:=auth.uid(); prior public.hasocash_transfers; remaining bigint;
begin
 if sender is null or recipient is null or recipient=sender or amount is null or amount<=0 or amount>9007199254740991 or request_id is null then raise exception 'invalid_transfer'; end if;
 -- Stable lock order serializes both directions and duplicate requests.
 perform user_id from public.member_wallets where user_id in(sender,recipient) order by user_id for update;
 select * into prior from public.hasocash_transfers where id=request_id;
 if found then
   if prior.sender_id<>sender or prior.recipient_id<>recipient or prior.amount<>amount then raise exception 'request_conflict'; end if;
   select balance into remaining from public.member_wallets where user_id=sender; return remaining;
 end if;
 if not exists(select 1 from public.member_wallets where user_id=recipient) then raise exception 'recipient_unavailable'; end if;
 if exists(select 1 from public.direct_raven_blocks where (blocker_id=sender and blocked_id=recipient) or (blocker_id=recipient and blocked_id=sender)) then raise exception 'transfer_unavailable'; end if;
 update public.member_wallets set balance=balance-amount where user_id=sender and balance>=amount returning balance into remaining;
 if not found then raise exception 'insufficient_hasocash'; end if;
 update public.member_wallets set balance=balance+amount where user_id=recipient;
 insert into public.hasocash_transfers(id,sender_id,recipient_id,amount) values(request_id,sender,recipient,amount);
 return remaining;
end $$;
revoke all on function public.grant_hasocash(uuid,bigint,uuid) from public;
grant execute on function public.grant_hasocash(uuid,bigint,uuid) to authenticated;
create table public.profile_guestbook (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 500),
 created_at timestamptz not null default now(),
 check(profile_id<>author_id)
);
create index guestbook_profile on public.profile_guestbook(profile_id,created_at desc);
alter table public.profile_guestbook enable row level security;
create policy guestbook_read on public.profile_guestbook for select using(true);
create policy guestbook_write on public.profile_guestbook for insert to authenticated with check(author_id=auth.uid() and not exists(select 1 from public.direct_raven_blocks b where (b.blocker_id=author_id and b.blocked_id=profile_id) or (b.blocker_id=profile_id and b.blocked_id=author_id)));
create policy guestbook_delete on public.profile_guestbook for delete to authenticated using(auth.uid() in(author_id,profile_id) or exists(select 1 from public.profiles where id=auth.uid() and role in('admin','moderator')));
notify pgrst,'reload schema';
commit;
