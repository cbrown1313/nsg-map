REVOKE ALL ON FUNCTION public.log_unauthorized_access(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_unauthorized_access(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_unauthorized_access(text, text) TO authenticated;