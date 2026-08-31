-- Fix: prevent_role_self_escalation() incorrectly reverted role changes made by
-- the service_role (auth.uid() is null in that context, so is_admin() was false).
-- Only guard the change when a real end-user session (auth.uid() present) is doing it.

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;
