import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminLogin = () => {
  const { signIn, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  if (!loading && isAdmin) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage('Account created! Ask an admin to assign your role, then log in.');
        setMode('login');
      }
      setSubmitting(false);
      return;
    }

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }
    setTimeout(() => {
      navigate('/admin/dashboard', { replace: true });
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === 'login' ? 'Admin Login' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}
            <Button type="submit" className="w-full" disabled={submitting || loading}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          <button
            type="button"
            className="mt-3 w-full text-sm text-muted-foreground hover:underline"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
