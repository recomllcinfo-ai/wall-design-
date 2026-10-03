-- Fix: when sending non-EVM tokens, the sender's from_address was incorrectly stored
-- as the EVM address. Pick the network-correct address based on p_network.
--
-- Also backfill existing rows that were saved with the wrong from_address.

-- Internal helper: derive the correct "from" address for a given account + network.
create or replace function public._from_address_for(p_acc public.wallet_accounts, p_network text)
returns text
language sql stable as $$
  select case
    when p_network = 'bitcoin' then coalesce(p_acc.bitcoin_address, p_acc.address)
    when p_network = 'solana'  then coalesce(p_acc.solana_address,  p_acc.address)
    else p_acc.address
  end
$$;

-- Replace transfer() with the network-correct from_address on both the send and the
-- (when the recipient is the sender's own account) receive side.
create or replace function public.transfer(
  p_from     uuid,
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
  src_from_addr text;
  dest text := trim(p_to);
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be greater than 0'; end if;
  if coalesce(p_gas_eth, 0) < 0 then raise exception 'Invalid gas fee'; end if;

  src := public._owned_account(p_from);
  src_from_addr := public._from_address_for(src, p_network);

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
    (src.id, h, 'send', src_from_addr, dest, p_amount, p_symbol,
     coalesce(p_fiat_usd, 0), p_network, coalesce(p_gas_eth, 0), coalesce(p_gas_usd, 0), p_memo,
     -- only reveal the recipient account's name when it is the sender's own account
     coalesce(p_to_name, case when dst.user_id = src.user_id then dst.name end));

  if dst.id is not null then
    perform public._credit(dst.id, p_symbol, p_amount);
    insert into public.transactions
      (account_id, hash, type, from_address, to_address, amount, token_symbol,
       fiat_value_usd, network_id, memo)
    values
      (dst.id, h, 'receive', src_from_addr, dest, p_amount, p_symbol,
       coalesce(p_fiat_usd, 0), p_network,
       coalesce(p_memo, case when dst.user_id = src.user_id then 'From ' || src.name end));
  end if;

  return h;
end $$;

-- Backfill: rewrite from_address on existing non-EVM transaction rows whose sender's
-- address was incorrectly recorded as the EVM address. Use the network_id on the row
-- to pick the right one. This is idempotent and safe to re-run.
update public.transactions t
   set from_address = case
       when t.network_id = 'bitcoin' then coalesce(a.bitcoin_address, a.address)
       when t.network_id = 'solana'  then coalesce(a.solana_address,  a.address)
       else t.from_address
     end
  from public.wallet_accounts a
 where a.id = t.account_id
   and t.network_id in ('bitcoin', 'solana')
   and t.from_address = a.address;