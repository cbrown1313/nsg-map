CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Privileged implementations live in a schema that is not exposed via the API
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.log_unauthorized_access(_reason text, _path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_reason text;
  v_path text;
BEGIN
  v_user_id := auth.uid();

  v_reason := CASE _reason
    WHEN 'Not signed in' THEN 'Not signed in'
    WHEN 'Signed in but missing admin role' THEN 'Signed in but missing admin role'
    ELSE 'Unknown'
  END;

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
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.log_unauthorized_access(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.log_unauthorized_access(text, text) TO authenticated, service_role;

-- Public API surface becomes SECURITY INVOKER thin wrappers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT private.has_role(_user_id, _role)
$$;

CREATE OR REPLACE FUNCTION public.log_unauthorized_access(_reason text, _path text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT private.log_unauthorized_access(_reason, _path)
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.log_unauthorized_access(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_unauthorized_access(text, text) TO authenticated, service_role;