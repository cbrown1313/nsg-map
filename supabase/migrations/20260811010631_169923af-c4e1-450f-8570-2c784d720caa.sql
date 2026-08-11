CREATE OR REPLACE FUNCTION public.log_unauthorized_access(_reason text, _path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_email text;
  v_reason text;
  v_path text;
BEGIN
  v_user_id := auth.uid();

  -- Only allow a fixed set of reason codes
  v_reason := CASE _reason
    WHEN 'Not signed in' THEN 'Not signed in'
    WHEN 'Signed in but missing admin role' THEN 'Signed in but missing admin role'
    ELSE 'Unknown'
  END;

  -- Sanitize path: strip control chars, allow safe URL path chars only, cap length
  v_path := regexp_replace(COALESCE(_path, ''), '[^a-zA-Z0-9/_\-\.]', '', 'g');
  v_path := left(v_path, 128);
  IF v_path = '' THEN
    v_path := 'unknown';
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  END IF;

  INSERT INTO public.audit_log (
    table_name, action, record_id, old_data, new_data, changed_by, changed_by_email
  ) VALUES (
    'unauthorized_access',
    'DENIED',
    v_path,
    NULL,
    jsonb_build_object('reason', v_reason, 'path', v_path),
    v_user_id,
    v_email
  );
END;
$function$;