
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type User = {
  id: string;
  username: string;
  role: 'admin' | 'user';
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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

// Demo kullanıcılar - gerçek uygulamada bir backend/API'den alınmalı
const DEMO_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin' as const,
  },
  {
    id: '2',
    username: 'teknisyen',
    password: '123456',
    role: 'user' as const,
  }
];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Başlangıçta oturum kontrolü
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        // Önce mevcut oturum bilgisini kontrol et
        const savedUser = localStorage.getItem('auth_user');
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Supabase ile oturum açın
          const { error } = await supabase.auth.signInWithPassword({
            email: `${parsedUser.username}@example.com`,
            password: parsedUser.id + "secret",
          });
          
          if (error) {
            console.error("Supabase oturum hatası:", error);
            localStorage.removeItem('auth_user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Oturum verisi okunamadı:', error);
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    // Demo giriş işlemi
    try {
      const foundUser = DEMO_USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        
        // Supabase ile oturum açın (demo kullanıcı için)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username}@example.com`,
          password: foundUser.id + "secret",
        });
        
        if (error) {
          // Kullanıcı yoksa kayıt olun
          if (error.message.includes("Invalid login credentials")) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: `${username}@example.com`,
              password: foundUser.id + "secret",
            });
            
            if (signUpError) {
              throw new Error('Supabase kayıt hatası: ' + signUpError.message);
            }
            
            // Yeniden giriş yapın
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: `${username}@example.com`,
              password: foundUser.id + "secret",
            });
            
            if (signInError) {
              throw new Error('Supabase giriş hatası: ' + signInError.message);
            }
          } else {
            throw new Error('Supabase giriş hatası: ' + error.message);
          }
        }
        
        // Kullanıcı bilgilerini saklayın
        setUser(userWithoutPassword);
        localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
        
        // Ana sayfaya yönlendirin
        navigate('/');
        toast.success("Giriş başarılı");
      } else {
        throw new Error('Kullanıcı adı veya şifre hatalı');
      }
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      toast.error(error.message || 'Giriş yapılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Supabase oturumunu sonlandır
      await supabase.auth.signOut();
      
      // Yerel oturumu temizle
      setUser(null);
      localStorage.removeItem('auth_user');
      
      // Login sayfasına yönlendir
      navigate('/login');
      toast.success("Çıkış yapıldı");
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
