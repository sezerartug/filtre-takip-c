
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
          console.log("Kaydedilmiş kullanıcı bulundu:", savedUser);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Supabase ile oturum kontrolü
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.error("Supabase oturum hatası veya oturum yok:", error);
            // Supabase oturumu yoksa, yeniden giriş yapmayı dene
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: `${parsedUser.username}@example.com`,
              password: parsedUser.id + "secret",
            });
            
            if (signInError) {
              console.error("Supabase yeniden giriş hatası:", signInError);
              localStorage.removeItem('auth_user');
              setUser(null);
              navigate('/login');
            } else {
              console.log("Supabase oturumu başarıyla yenilendi");
            }
          } else {
            console.log("Supabase oturumu aktif:", session);
          }
        } else {
          console.log("Kaydedilmiş kullanıcı bulunamadı");
          setUser(null);
        }
      } catch (error) {
        console.error('Oturum verisi okunamadı:', error);
        localStorage.removeItem('auth_user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    console.log("Giriş yapılıyor:", username);
    
    try {
      const foundUser = DEMO_USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        
        console.log("Kullanıcı bulundu, Supabase ile giriş yapılıyor");
        // Supabase ile oturum açın (demo kullanıcı için)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username}@example.com`,
          password: foundUser.id + "secret",
        });
        
        if (error) {
          console.log("Supabase giriş hatası:", error);
          // Kullanıcı yoksa kayıt olun
          if (error.message.includes("Invalid login credentials")) {
            console.log("Kullanıcı bulunamadı, kayıt yapılıyor");
            const { error: signUpError } = await supabase.auth.signUp({
              email: `${username}@example.com`,
              password: foundUser.id + "secret",
            });
            
            if (signUpError) {
              throw new Error('Supabase kayıt hatası: ' + signUpError.message);
            }
            
            console.log("Kullanıcı kaydedildi, yeniden giriş yapılıyor");
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
        
        console.log("Giriş başarılı, kullanıcı bilgileri saklanıyor");
        // Kullanıcı bilgilerini saklayın
        setUser(userWithoutPassword);
        localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
        
        // Ana sayfaya yönlendirin
        toast.success("Giriş başarılı");
        navigate('/');
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
      console.log("Çıkış yapılıyor");
      // Supabase oturumunu sonlandır
      await supabase.auth.signOut();
      
      // Yerel oturumu temizle
      setUser(null);
      localStorage.removeItem('auth_user');
      
      // Login sayfasına yönlendir
      toast.success("Çıkış yapıldı");
      navigate('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  console.log("AuthProvider mevcut durum:", { user, isAuthenticated: !!user, isLoading });

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
