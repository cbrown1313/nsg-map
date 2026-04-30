import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  const unauthorized = !loading && (!user || !isAdmin);
  const reason = !user
    ? 'Please sign in to access the admin dashboard.'
    : "You're signed in, but this account doesn't have admin access.";

  useEffect(() => {
    if (unauthorized) {
      toast.error(reason);
    }
  }, [unauthorized, reason]);

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
        state={{ from: location.pathname, reason }}
      />
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
