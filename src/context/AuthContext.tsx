import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type User = {
  id: string;
  username: string;
  email: string;
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
    email: 'admin@deneme.com',
    password: 'admin123',
    role: 'admin' as const,
  },
  // Eğer user rolü olacaksa buraya ekleyebilirsin
];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
          
          // Supabase ile oturum kontrolü
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Supabase oturum hatası:", error);
            localStorage.removeItem('auth_user');
            setUser(null);
            return;
          }
          
          if (!session) {
            console.log("Supabase oturumu yok, yeniden giriş yapmayı dene");
            try {
              // Supabase oturumu yoksa, yeniden giriş yapmayı dene
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: `${parsedUser.username}@example.com`,
                password: parsedUser.id + "secret",
              });
              
              if (signInError) {
                console.error("Supabase yeniden giriş hatası:", signInError);
                localStorage.removeItem('auth_user');
                setUser(null);
                return;
              }
              
              if (signInData.session) {
                console.log("Supabase oturumu başarıyla yenilendi");
                setUser(parsedUser);
              }
            } catch (signInError) {
              console.error("Supabase giriş denemesi başarısız:", signInError);
              localStorage.removeItem('auth_user');
              setUser(null);
            }
          } else {
            console.log("Supabase oturumu aktif:", session);
            setUser(parsedUser);
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
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    console.log("Giriş yapılıyor:", username);
    
    try {
      const foundUser = DEMO_USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        const email = foundUser.email;
        
        console.log("Kullanıcı bulundu, Supabase ile giriş yapılıyor");
        
        try {
          // Giriş yapmayı dene
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });
          
          if (signInError) {
            // Eğer giriş başarısız olursa, kayıt olmayı dene
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: email,
              password: password,
              options: {
                data: {
                  role: foundUser.role,
                  username: foundUser.username
                }
              }
            });
            
            if (signUpError) {
              console.error("Supabase kayıt hatası:", signUpError);
              throw new Error('Giriş yapılamadı: ' + signUpError.message);
            }
            
            // Kayıt başarılı olduktan sonra tekrar giriş yapmayı dene
            const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
              email: email,
              password: password,
            });
            
            if (retrySignInError) {
              console.error("Supabase giriş hatası:", retrySignInError);
              throw new Error('Giriş yapılamadı: ' + retrySignInError.message);
            }
            
            if (!retrySignInData.session) {
              throw new Error('Oturum oluşturulamadı');
            }
          }
          
          if (!signInData?.session) {
            throw new Error('Oturum oluşturulamadı');
          }
          
          console.log("Giriş başarılı, kullanıcı bilgileri saklanıyor");
          // Kullanıcı bilgilerini saklayın
          setUser(userWithoutPassword);
          localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
          
          // Toast bildirimini göster
          toast.success("Giriş başarılı");
          return;
        } catch (authError: unknown) {
          console.error("Supabase kimlik doğrulama hatası:", authError);
          const errorMessage = (authError instanceof Error) ? authError.message : 'Giriş yapılamadı';
          throw new Error(errorMessage);
        }
      } else {
        throw new Error('Kullanıcı adı veya şifre hatalı');
      }
    } catch (error: unknown) {
      console.error('Giriş hatası:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Giriş yapılamadı';
      toast.error(errorMessage);
      throw error;
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
      
      // Toast bildirimini göster
      toast.success("Çıkış yapıldı");
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
