CREATE OR REPLACE FUNCTION public.log_unauthorized_access(_reason text, _path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  END IF;

  INSERT INTO public.audit_log (
    table_name, action, record_id, old_data, new_data, changed_by, changed_by_email
  ) VALUES (
    'unauthorized_access',
    'DENIED',
    COALESCE(_path, 'unknown'),
    NULL,
    jsonb_build_object('reason', _reason, 'path', _path),
    v_user_id,
    v_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_unauthorized_access(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_unauthorized_access(text, text) TO anon, authenticated;