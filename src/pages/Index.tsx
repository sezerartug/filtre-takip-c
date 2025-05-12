
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
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
        {/* Header */}
        <AppHeader />

        {/* Main content */}
        <main className="container mx-auto p-4 pt-6 flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <div className="absolute top-1 left-1 right-1 bottom-1 rounded-full border-4 border-t-transparent border-r-primary/70 border-b-transparent border-l-transparent animate-spin" style={{animationDuration: "1.5s"}}></div>
              </div>
            </div>
          ) : (
            <>
              {user && (
                <div className="bg-card rounded-lg shadow-sm border p-3 mb-4 animate-fade-in">
                  <p className="text-sm text-muted-foreground">
                    Hoş geldiniz, <span className="font-medium text-foreground">{user.username}</span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {user.role === 'admin' ? 'Yönetici' : 'Teknisyen'}
                    </span>
                  </p>
                </div>
              )}
              <CustomerList />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-card border-t p-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Su Arıtma Filtre Takip Uygulaması</p>
        </footer>
      </div>
    </CustomerProvider>
  );
};

export default Index;
