
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import App from '../App';

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);

        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryMode(true);
          setMessage('Enter your new password below.');
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) return;

    setBusy(true);

    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });

        if (authError) throw authError;

        if (data.session) {
          setMessage('Account created successfully.');
        } else {
          setMessage(
            'Account created. Please check your email and confirm your account before logging in.',
          );
          setMode('login');
        }
      } else if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) throw authError;
        setMessage('Login successful.');
      } else {
        const { error: authError } =
          await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin,
          });

        if (authError) throw authError;
        setMessage('Password reset link sent. Check your email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) return;
    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setRecoveryMode(false);
      setNewPassword('');
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (!supabase) return;
    setError('');

    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError(logoutError.message);
  }
  if (import.meta.env.MODE === 'e2e') {
  return <App />;
}
  if (!isSupabaseConfigured) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-logo">EF</div>
          <h1>Supabase setup required</h1>
          <p>
            Add your Supabase Project URL and publishable/anon key to
            <code> .env.local </code>, then restart the development server.
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="auth-page">
        <div className="auth-card">Checking your session...</div>
      </main>
    );
  }

  if (session && !recoveryMode) {
    return (
      <>
        <div className="auth-session-bar">
          <span>
            Signed in as <strong>{session.user.email}</strong>
          </span>
          <button type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
        <App />
      </>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">EF</div>
        <p className="auth-eyebrow">EDUFORGE FINANCIAL LEARNING</p>

        {recoveryMode ? (
          <>
            <h1>Set a new password</h1>
            <p className="auth-subtitle">Choose a secure password for your account.</p>
            <form onSubmit={handlePasswordUpdate}>
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
              <button className="auth-submit" disabled={busy}>
                {busy ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1>
              {mode === 'signup'
                ? 'Create your account'
                : mode === 'reset'
                  ? 'Reset your password'
                  : 'Welcome back'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'signup'
                ? 'Create an account to build financial learning modules.'
                : mode === 'reset'
                  ? 'We will email you a password reset link.'
                  : 'Sign in to continue building your modules.'}
            </p>

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <>
                  <label htmlFor="full-name">Full name</label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </>
              )}

              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {mode !== 'reset' && (
                <>
                  <label htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    autoComplete={
                      mode === 'signup' ? 'new-password' : 'current-password'
                    }
                    required
                  />
                  {mode === 'login' && (
                    <button
                      className="auth-text-button"
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setError('');
                        setMessage('');
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </>
              )}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy
                  ? 'Please wait...'
                  : mode === 'signup'
                    ? 'Create account'
                    : mode === 'reset'
                      ? 'Send reset link'
                      : 'Sign in'}
              </button>
            </form>

            <div className="auth-switch">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')}>Sign up</button>
                </>
              ) : (
                <>
                  Remembered your password?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setMessage('');
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </section>
    </main>
  );
}
