
import { useState, useEffect } from "react";
import { CustomerProvider } from "@/context/CustomerContext";
import CustomerList from "@/components/CustomerList";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { Capacitor } from "@capacitor/core";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <CustomerProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <AppHeader />

        {/* Main content */}
        <main className="container mx-auto p-4 pt-6 flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {user && (
                <p className="text-sm text-muted-foreground mb-4">
                  Hoş geldiniz, {user.username}. 
                  {user.role === 'admin' ? ' (Yönetici erişimi)' : ' (Teknisyen erişimi)'}
                </p>
              )}
              <CustomerList />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-muted p-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Su Arıtma Filtre Takip Uygulaması</p>
        </footer>
      </div>
    </CustomerProvider>
  );
};

export default Index;
