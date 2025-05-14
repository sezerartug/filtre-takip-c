
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
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: `${parsedUser.username}@example.com`,
                password: parsedUser.id + "secret",
              });
              
              if (signInError) {
                console.error("Supabase yeniden giriş hatası:", signInError);
                localStorage.removeItem('auth_user');
                setUser(null);
              } else {
                console.log("Supabase oturumu başarıyla yenilendi");
              }
            } catch (signInError) {
              console.error("Supabase giriş denemesi başarısız:", signInError);
              localStorage.removeItem('auth_user');
              setUser(null);
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
        
        console.log("Kullanıcı bulundu, Supabase ile giriş yapılıyor");
        // Supabase ile oturum açın (demo kullanıcı için)
        let supabaseSession;
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: `${username}@example.com`,
            password: foundUser.id + "secret",
          });
          
          if (error) {
            console.log("Supabase giriş hatası:", error);
            // Kullanıcı yoksa kayıt olun
            if (error.message.includes("Invalid login credentials")) {
              console.log("Kullanıcı bulunamadı, kayıt yapılıyor");
              
              try {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: `${username}@example.com`,
                  password: foundUser.id + "secret",
                });
                
                if (signUpError) {
                  // Email doğrulama gerektirmeyen yaklaşıma geç
                  if (signUpError.message.includes("Email address") && signUpError.message.includes("invalid")) {
                    console.log("Geçersiz email nedeniyle normal giriş yapılıyor");
                  } else {
                    throw new Error('Supabase kayıt hatası: ' + signUpError.message);
                  }
                } else {
                  supabaseSession = signUpData.session;
                }
              } catch (signUpErr) {
                console.error("Kayıt hatası:", signUpErr);
              }
              
              if (!supabaseSession) {
                // Yeniden giriş yapın
                try {
                  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: `${username}@example.com`,
                    password: foundUser.id + "secret",
                  });
                  
                  if (signInError && !signInError.message.includes("Email address")) {
                    console.error("Yeniden giriş hatası:", signInError);
                  } else {
                    supabaseSession = signInData?.session;
                  }
                } catch (signInErr) {
                  console.error("Yeniden giriş hatası:", signInErr);
                }
              }
            }
          } else {
            supabaseSession = data.session;
          }
        } catch (authError) {
          console.error("Supabase kimlik doğrulama hatası:", authError);
        }
        
        console.log("Giriş başarılı, kullanıcı bilgileri saklanıyor");
        // Kullanıcı bilgilerini saklayın
        setUser(userWithoutPassword);
        localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
        
        // Toast bildirimini göster
        toast.success("Giriş başarılı");
        return;
      } else {
        throw new Error('Kullanıcı adı veya şifre hatalı');
      }
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      toast.error(error.message || 'Giriş yapılamadı');
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
