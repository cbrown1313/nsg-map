-- Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_by_email text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_changed_at ON public.audit_log (changed_at DESC);
CREATE INDEX idx_audit_log_table_name ON public.audit_log (table_name);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "Admins can read audit log"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No direct writes — all entries come from triggers (which run as table owner)
-- Intentionally no INSERT/UPDATE/DELETE policies.

-- Trigger function to capture changes
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_record_id text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    v_record_id := COALESCE(OLD.id::text, OLD.state_code::text);
  ELSE
    v_record_id := COALESCE(NEW.id::text, NEW.state_code::text);
  END IF;

  INSERT INTO public.audit_log (
    table_name, action, record_id, old_data, new_data, changed_by, changed_by_email
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    v_record_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    v_user_id,
    v_email
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach triggers to both data tables
CREATE TRIGGER audit_clinic_locations
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_locations
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_state_configs
  AFTER INSERT OR UPDATE OR DELETE ON public.state_configs
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();