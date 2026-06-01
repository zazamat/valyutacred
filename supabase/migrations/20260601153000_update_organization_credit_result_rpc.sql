-- RPC: Organization users update credit result for their own assigned matches.
-- This function intentionally does not touch:
-- - applications.status
-- - application_organization_matches visibility/status fields
-- - success fee calculations
-- - organization_balance_transactions
-- - application_commission_events

create or replace function public.update_organization_credit_result(
  p_match_id bigint,
  p_credit_result_status text,
  p_credit_disbursed_amount numeric default null,
  p_credit_disbursed_date date default null,
  p_note text default null
)
returns table (
  id bigint,
  referral_id text,
  credit_result_status text,
  credit_disbursed_amount numeric,
  credit_disbursed_date date,
  credit_result_source text,
  credit_confirmed_at timestamptz,
  credit_confirmed_by text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor profiles%rowtype;
  v_match application_organization_matches%rowtype;
  v_app_old applications%rowtype;
  v_app_new applications%rowtype;
  v_actor_label text;
  v_clean_status text;
  v_clean_note text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  v_clean_status := nullif(trim(p_credit_result_status), '');
  v_clean_note := nullif(trim(coalesce(p_note, '')), '');

  select *
    into v_actor
  from public.profiles
  where id = auth.uid()
    and status = 'active'
    and role = 'organization_user'
    and organization_id is not null;

  if not found then
    raise exception 'Active organization user profile is required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.organization_permissions op
    where op.organization_id = v_actor.organization_id
      and coalesce(op.can_update_credit_result, false) = true
  ) then
    raise exception 'Credit result update permission is required'
      using errcode = '42501';
  end if;

  if v_clean_status is null or v_clean_status not in (
    'under_review',
    'approved',
    'rejected',
    'customer_declined',
    'disbursed',
    'expired'
  ) then
    raise exception 'Invalid credit result status'
      using errcode = '22023';
  end if;

  if v_clean_status = 'disbursed' then
    if p_credit_disbursed_amount is null or p_credit_disbursed_amount <= 0 then
      raise exception 'Disbursed amount must be greater than zero'
        using errcode = '22023';
    end if;

    if p_credit_disbursed_date is null then
      raise exception 'Disbursed date is required'
        using errcode = '22023';
    end if;
  end if;

  select *
    into v_match
  from public.application_organization_matches m
  where m.id = p_match_id
    and m.organization_id = v_actor.organization_id
    and m.visibility_status = 'assigned'
    and m.source in ('only_selected', 'admin_assigned');

  if not found then
    raise exception 'Assigned application match was not found'
      using errcode = '42501';
  end if;

  select *
    into v_app_old
  from public.applications a
  where a.id = v_match.application_id
  for update;

  if not found then
    raise exception 'Application was not found'
      using errcode = 'P0002';
  end if;

  v_actor_label := coalesce(nullif(v_actor.email, ''), v_actor.id::text);

  update public.applications a
  set
    credit_result_status = v_clean_status,
    credit_result_source = 'organization_cabinet',
    credit_confirmed_at = now(),
    credit_confirmed_by = v_actor_label,
    credit_disbursed_amount = case
      when v_clean_status = 'disbursed' then p_credit_disbursed_amount
      else a.credit_disbursed_amount
    end,
    credit_disbursed_date = case
      when v_clean_status = 'disbursed' then p_credit_disbursed_date
      else a.credit_disbursed_date
    end
  where a.id = v_app_old.id
  returning *
    into v_app_new;

  insert into public.application_status_logs (
    application_id,
    referral_id,
    status_type,
    old_status,
    new_status,
    changed_by_user_id,
    changed_by_role,
    changed_by_email,
    source,
    note,
    old_values,
    new_values
  )
  values (
    v_app_new.id,
    v_app_new.referral_id,
    'credit_result_status',
    v_app_old.credit_result_status,
    v_clean_status,
    v_actor.id,
    'organization_user',
    coalesce(v_actor.email, ''),
    'organization_cabinet',
    v_clean_note,
    jsonb_build_object(
      'credit_result_status', v_app_old.credit_result_status,
      'credit_disbursed_amount', v_app_old.credit_disbursed_amount,
      'credit_disbursed_date', v_app_old.credit_disbursed_date,
      'credit_result_source', v_app_old.credit_result_source,
      'credit_confirmed_at', v_app_old.credit_confirmed_at,
      'credit_confirmed_by', v_app_old.credit_confirmed_by
    ),
    jsonb_build_object(
      'credit_result_status', v_app_new.credit_result_status,
      'credit_disbursed_amount', v_app_new.credit_disbursed_amount,
      'credit_disbursed_date', v_app_new.credit_disbursed_date,
      'credit_result_source', v_app_new.credit_result_source,
      'credit_confirmed_at', v_app_new.credit_confirmed_at,
      'credit_confirmed_by', v_app_new.credit_confirmed_by
    )
  );

  return query
  select
    v_app_new.id::bigint,
    v_app_new.referral_id::text,
    v_app_new.credit_result_status::text,
    v_app_new.credit_disbursed_amount::numeric,
    v_app_new.credit_disbursed_date::date,
    v_app_new.credit_result_source::text,
    v_app_new.credit_confirmed_at::timestamptz,
    v_app_new.credit_confirmed_by::text;
end;
$$;

revoke all on function public.update_organization_credit_result(
  bigint,
  text,
  numeric,
  date,
  text
) from public;

revoke all on function public.update_organization_credit_result(
  bigint,
  text,
  numeric,
  date,
  text
) from anon;

grant execute on function public.update_organization_credit_result(
  bigint,
  text,
  numeric,
  date,
  text
) to authenticated;

-- Optional verification after applying:
--
-- select proname, prosecdef
-- from pg_proc
-- where proname = 'update_organization_credit_result';
--
-- select
--   routine_schema,
--   routine_name,
--   privilege_type,
--   grantee
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name = 'update_organization_credit_result';
--
-- Authenticated organization_user context required:
-- select *
-- from public.update_organization_credit_result(
--   p_match_id := 1,
--   p_credit_result_status := 'under_review',
--   p_credit_disbursed_amount := null,
--   p_credit_disbursed_date := null,
--   p_note := 'Verification update'
-- );
--
-- select *
-- from public.update_organization_credit_result(
--   p_match_id := 1,
--   p_credit_result_status := 'disbursed',
--   p_credit_disbursed_amount := 15000,
--   p_credit_disbursed_date := current_date,
--   p_note := 'Verification disbursed update'
-- );

-- Rollback:
--
-- drop function if exists public.update_organization_credit_result(
--   bigint,
--   text,
--   numeric,
--   date,
--   text
-- );
