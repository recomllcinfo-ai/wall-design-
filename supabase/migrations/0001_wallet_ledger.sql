-- Apex Vault — simulated multi-account ledger
-- All balances here are simulated demo funds; nothing touches a real blockchain.
--
-- Security model:
--   * Users can READ only their own accounts, balances and transactions (RLS).
--   * Users can CREATE accounts for themselves, but never write balances or
--     transactions directly. All money movement goes through the SECURITY DEFINER
--     functions below, which check ownership and balances atomically.

create extension if not exists pgcrypto with schema extensions;

-- ── Tables ───────────────────────────────────────────────────────────────────
create table if not exists public.wallet_accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 60),
  address          text not null unique,
  solana_address   text unique,
  bitcoin_address  text unique,
  derivation_path  text not null,
  is_demo          boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists wallet_accounts_user_idx on public.wallet_accounts(user_id);

create table if not exists public.balances (
  account_id  uuid not null references public.wallet_accounts(id) on delete cascade,
  symbol      text not null,
  amount      numeric(38, 18) not null default 0 check (amount >= 0),
  primary key (account_id, symbol)
);

create table if not exists public.transactions (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.wallet_accounts(id) on delete cascade,
  hash              text not null,
  type              text not null check (type in ('send', 'receive', 'swap', 'offramp')),
  status            text not null default 'confirmed' check (status in ('pending', 'confirmed', 'failed')),
  from_address      text not null,
  to_address        text not null,
  amount            numeric(38, 18) not null,
  token_symbol      text not null,
  fiat_value_usd    numeric not null default 0,
  network_id        text not null,
  gas_fee_eth       numeric not null default 0,
  gas_fee_usd       numeric not null default 0,
  memo              text,
  to_resolved_name  text,
  created_at        timestamptz not null default now()
);
create index if not exists transactions_account_idx on public.transactions(account_id, created_at desc);

-- ── Row level security ───────────────────────────────────────────────────────
alter table public.wallet_accounts enable row level security;
alter table public.balances        enable row level security;
alter table public.transactions    enable row level security;

drop policy if exists "read own accounts" on public.wallet_accounts;
create policy "read own accounts" on public.wallet_accounts
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "create own accounts" on public.wallet_accounts;
create policy "create own accounts" on public.wallet_accounts
  for insert to authenticated with check (user_id = auth.uid() and is_demo = false);

drop policy if exists "read own balances" on public.balances;
create policy "read own balances" on public.balances
  for select to authenticated using (
    exists (select 1 from public.wallet_accounts a where a.id = account_id and a.user_id = auth.uid())
  );

drop policy if exists "read own transactions" on public.transactions;
create policy "read own transactions" on public.transactions
  for select to authenticated using (
    exists (select 1 from public.wallet_accounts a where a.id = account_id and a.user_id = auth.uid())
  );

-- No insert/update/delete policies on balances or transactions: clients cannot write them.

-- ── Internal helpers (not callable by clients) ───────────────────────────────
create or replace function public._owned_account(p_account uuid)
returns public.wallet_accounts
language plpgsql security definer set search_path = public as $$
declare r public.wallet_accounts;
begin
  select * into r from public.wallet_accounts where id = p_account and user_id = auth.uid();
  if not found then raise exception 'Account not found'; end if;
  return r;
end $$;

create or replace function public._debit(p_account uuid, p_symbol text, p_amount numeric)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.balances set amount = amount - p_amount
   where account_id = p_account and symbol = p_symbol and amount >= p_amount;
  if not found then raise exception 'Insufficient % balance', p_symbol; end if;
end $$;

create or replace function public._credit(p_account uuid, p_symbol text, p_amount numeric)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.balances (account_id, symbol, amount) values (p_account, p_symbol, p_amount)
  on conflict (account_id, symbol) do update set amount = public.balances.amount + excluded.amount;
end $$;

create or replace function public._new_hash()
returns text
language sql volatile set search_path = public, extensions as $$
  select '0x' || encode(extensions.gen_random_bytes(32), 'hex');
$$;

-- ── Client-callable operations ───────────────────────────────────────────────

-- Send. If the recipient address belongs to any wallet account in this app, it is
-- credited and gets a matching "receive" entry; otherwise the funds leave the ledger.
create or replace function public.transfer(
  p_from      uuid,
  p_to        text,
  p_symbol    text,
  p_amount    numeric,
  p_network   text,
  p_gas_eth   numeric default 0,
  p_gas_usd   numeric default 0,
  p_fiat_usd  numeric default 0,
  p_memo      text default null,
  p_to_name   text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  src public.wallet_accounts;
  dst public.wallet_accounts;
  h   text := public._new_hash();
  dest text := trim(p_to);
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be greater than 0'; end if;
  if coalesce(p_gas_eth, 0) < 0 then raise exception 'Invalid gas fee'; end if;

  src := public._owned_account(p_from);
  perform public._debit(src.id, p_symbol, p_amount);
  if coalesce(p_gas_eth, 0) > 0 and p_symbol <> 'ETH' then
    perform public._debit(src.id, 'ETH', p_gas_eth);
  end if;

  select * into dst from public.wallet_accounts
   where id <> src.id
     and (lower(address) = lower(dest) or solana_address = dest or bitcoin_address = dest)
   limit 1;

  insert into public.transactions
    (account_id, hash, type, from_address, to_address, amount, token_symbol,
     fiat_value_usd, network_id, gas_fee_eth, gas_fee_usd, memo, to_resolved_name)
  values
    (src.id, h, 'send', src.address, dest, p_amount, p_symbol,
     coalesce(p_fiat_usd, 0), p_network, coalesce(p_gas_eth, 0), coalesce(p_gas_usd, 0), p_memo,
     -- only reveal the recipient account's name when it is the sender's own account
     coalesce(p_to_name, case when dst.user_id = src.user_id then dst.name end));

  if dst.id is not null then
    perform public._credit(dst.id, p_symbol, p_amount);
    insert into public.transactions
      (account_id, hash, type, from_address, to_address, amount, token_symbol,
       fiat_value_usd, network_id, memo)
    values
      (dst.id, h, 'receive', src.address, dest, p_amount, p_symbol,
       coalesce(p_fiat_usd, 0), p_network,
       coalesce(p_memo, case when dst.user_id = src.user_id then 'From ' || src.name end));
  end if;

  return h;
end $$;

-- Swap between two tokens of the same account.
-- NOTE: the output amount is supplied by the client from live prices; a production
-- system would price swaps server-side.
create or replace function public.swap_tokens(
  p_account     uuid,
  p_from_symbol text,
  p_to_symbol   text,
  p_from_amount numeric,
  p_to_amount   numeric,
  p_network     text,
  p_gas_usd     numeric default 0,
  p_fiat_usd    numeric default 0
) returns text
language plpgsql security definer set search_path = public as $$
declare
  acc public.wallet_accounts;
  h   text := public._new_hash();
begin
  if p_from_amount is null or p_from_amount <= 0 or p_to_amount is null or p_to_amount <= 0 then
    raise exception 'Amounts must be greater than 0';
  end if;
  if p_from_symbol = p_to_symbol then raise exception 'Cannot swap a token for itself'; end if;

  acc := public._owned_account(p_account);
  perform public._debit(acc.id, p_from_symbol, p_from_amount);
  perform public._credit(acc.id, p_to_symbol, p_to_amount);

  insert into public.transactions
    (account_id, hash, type, from_address, to_address, amount, token_symbol,
     fiat_value_usd, network_id, gas_fee_eth, gas_fee_usd)
  values
    (acc.id, h, 'swap', acc.address, '0x1111111254fb6c44bac0bed2854e76f90643097d', p_from_amount,
     p_from_symbol || ' → ' || p_to_symbol, coalesce(p_fiat_usd, 0), p_network, 0.00075, coalesce(p_gas_usd, 0));
  return h;
end $$;

-- Cash out to a (simulated) bank account or card.
create or replace function public.fiat_offramp(
  p_account   uuid,
  p_symbol    text,
  p_amount    numeric,
  p_fiat_usd  numeric,
  p_payout    text,
  p_network   text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  acc public.wallet_accounts;
  h   text := public._new_hash();
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be greater than 0'; end if;
  acc := public._owned_account(p_account);
  perform public._debit(acc.id, p_symbol, p_amount);

  insert into public.transactions
    (account_id, hash, type, from_address, to_address, amount, token_symbol,
     fiat_value_usd, network_id, gas_fee_eth, gas_fee_usd, memo)
  values
    (acc.id, h, 'offramp', acc.address, 'Fiat Custody Bridge', p_amount, p_symbol,
     coalesce(p_fiat_usd, 0), p_network, 0.00035, 1.20, 'Payout to ' || p_payout);
  return h;
end $$;

-- Admin only (run from the SQL editor): give a user's first account the demo
-- funds (~$3M at the time of writing). Safe to re-run; balances are set, not added.
create or replace function public.fund_demo_account(p_email text)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid;
  acc public.wallet_accounts;
  alloc jsonb := '{"BTC": 14.18, "ETH": 335, "USDC": 600000, "USDT": 300000}';
  k text;
begin
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'No user with email %', p_email; end if;

  select * into acc from public.wallet_accounts where user_id = uid order by created_at limit 1;
  if not found then
    insert into public.wallet_accounts (user_id, name, address, derivation_path, is_demo)
    values (uid, 'Master Account', '0x' || encode(extensions.gen_random_bytes(20), 'hex'),
            'm/44''/60''/0''/0/0', true)
    returning * into acc;
  else
    update public.wallet_accounts set name = 'Master Account', is_demo = true
     where id = acc.id returning * into acc;
  end if;

  for k in select jsonb_object_keys(alloc) loop
    insert into public.balances (account_id, symbol, amount) values (acc.id, k, (alloc ->> k)::numeric)
    on conflict (account_id, symbol) do update set amount = excluded.amount;
  end loop;

  insert into public.transactions
    (account_id, hash, type, from_address, to_address, amount, token_symbol, network_id, memo)
  values
    (acc.id, public._new_hash(), 'receive', 'Funding', acc.address, 600000, 'USDC', 'ethereum',
     'Initial funding');
  return acc.id;
end $$;

-- ── Permissions ──────────────────────────────────────────────────────────────
revoke all on function public._owned_account(uuid)                  from public, anon, authenticated;
revoke all on function public._debit(uuid, text, numeric)           from public, anon, authenticated;
revoke all on function public._credit(uuid, text, numeric)          from public, anon, authenticated;
revoke all on function public._new_hash()                           from public, anon, authenticated;
revoke all on function public.fund_demo_account(text)               from public, anon, authenticated;

revoke all on function public.transfer(uuid, text, text, numeric, text, numeric, numeric, numeric, text, text) from public, anon;
revoke all on function public.swap_tokens(uuid, text, text, numeric, numeric, text, numeric, numeric)          from public, anon;
revoke all on function public.fiat_offramp(uuid, text, numeric, numeric, text, text)                         from public, anon;
grant execute on function public.transfer(uuid, text, text, numeric, text, numeric, numeric, numeric, text, text) to authenticated;
grant execute on function public.swap_tokens(uuid, text, text, numeric, numeric, text, numeric, numeric)          to authenticated;
grant execute on function public.fiat_offramp(uuid, text, numeric, numeric, text, text)                         to authenticated;

-- ── Realtime: push new transactions to the owner's open tabs ─────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;
end $$;
