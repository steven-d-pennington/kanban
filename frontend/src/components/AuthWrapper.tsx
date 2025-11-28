import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { LoginPage, SignUpPage, ResetPasswordPage } from '../pages';
import { Loader2 } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'reset';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading, initialize } = useAuthStore();
  const [authView, setAuthView] = useState<AuthView>('login');

  useEffect(() => {
    initialize();
  }, [initialize]);

  // If Supabase is not configured, show demo mode
  if (!isSupabaseConfigured()) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not logged in
  if (!user) {
    switch (authView) {
      case 'signup':
        return <SignUpPage onSwitchToLogin={() => setAuthView('login')} />;
      case 'reset':
        return <ResetPasswordPage onSwitchToLogin={() => setAuthView('login')} />;
      default:
        return (
          <LoginPage
            onSwitchToSignUp={() => setAuthView('signup')}
            onSwitchToReset={() => setAuthView('reset')}
          />
        );
    }
  }

  // User is authenticated, show the app
  return <>{children}</>;
}
