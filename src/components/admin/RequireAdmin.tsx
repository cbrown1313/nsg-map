import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const loggedRef = useRef<string | null>(null);

  const unauthorized = !loading && (!user || !isAdmin);
  const reasonCode = !user ? 'Not signed in' : 'Signed in but missing admin role';
  const friendlyReason = !user
    ? 'Please sign in to access the admin dashboard.'
    : "You're signed in, but this account doesn't have admin access.";

  useEffect(() => {
    if (!unauthorized) return;
    const key = `${user?.id ?? 'anon'}:${location.pathname}`;
    if (loggedRef.current === key) return;
    loggedRef.current = key;

    toast.error(friendlyReason);
    supabase.rpc('log_unauthorized_access', {
      _reason: reasonCode,
      _path: location.pathname,
    }).then(({ error }) => {
      if (error) console.warn('Failed to log unauthorized access:', error.message);
    });
  }, [unauthorized, friendlyReason, reasonCode, user?.id, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <Navigate
        to="/admin"
        replace
        state={{ from: location.pathname, reason: friendlyReason }}
      />
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
