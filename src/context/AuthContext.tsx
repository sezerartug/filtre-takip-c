import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'user';

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  company_id: string | null;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPasswordRequest: (email: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

function mapSessionToUser(session: Session): User {
  const { user } = session;
  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  const roleFromMeta = (meta.role as string | undefined) ?? 'user';
  const normalizedRole: UserRole =
    roleFromMeta === 'admin' ? 'admin' : 'user';

  return {
    id: user.id,
    email: user.email ?? '',
    full_name: (meta.full_name as string | undefined) ?? null,
    role: normalizedRole,
    company_id: (meta.company_id as string | undefined) ?? null,
  };
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setUserFromSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      localStorage.removeItem('auth_user');
      setUser(null);
      return;
    }
    if (!session?.user) {
      setUser(null);
      return;
    }
    const mapped = mapSessionToUser(session);
    setUser(mapped);
    localStorage.setItem('auth_user', JSON.stringify(mapped));
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await setUserFromSession();
      } catch (e) {
        console.error('Oturum kontrolü hatası:', e);
        setUser(null);
        localStorage.removeItem('auth_user');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' && session) {
          const mapped = mapSessionToUser(session);
          setUser(mapped);
          localStorage.setItem('auth_user', JSON.stringify(mapped));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-posta veya şifre hatalı.');
        }
        throw new Error(error.message);
      }

      if (!data.session?.user) {
        throw new Error('Oturum oluşturulamadı.');
      }

      const mapped = mapSessionToUser(data.session);
      setUser(mapped);
      localStorage.setItem('auth_user', JSON.stringify(mapped));
      toast.success('Giriş başarılı');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Giriş yapılamadı';
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('auth_user');
      toast.success('Çıkış yapıldı');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordRequest = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız.';
      toast.error(msg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        resetPasswordRequest,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
