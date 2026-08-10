REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_unauthorized_access(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_unauthorized_access(text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_audit_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_change() TO service_role;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;