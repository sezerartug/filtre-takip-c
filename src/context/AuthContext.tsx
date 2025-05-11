
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Oturum verisi okunamadı:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    // Demo giriş işlemi - gerçek bir API'den doğrulama yapılmalı
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = DEMO_USERS.find(
          (u) => u.username === username && u.password === password
        );

        if (foundUser) {
          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
          navigate('/');
          resolve();
        } else {
          reject(new Error('Kullanıcı adı veya şifre hatalı'));
        }
      }, 1000); // 1 saniyelik gecikme ekleyerek gerçek API çağrısını simüle ediyoruz
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    navigate('/login');
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
