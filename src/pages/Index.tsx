
import { useState, useEffect } from "react";
import { CustomerProvider } from "@/context/CustomerContext";
import CustomerList from "@/components/CustomerList";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <CustomerProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 shadow-md">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Su Arıtma Filtre Takip</h1>
            <p className="text-sm opacity-90">
              Müşteri filtre değişim takip sistemi
            </p>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto p-4 pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CustomerList />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-muted p-4 text-center text-sm text-muted-foreground mt-auto">
          <p>© 2024 Su Arıtma Filtre Takip Uygulaması</p>
        </footer>
      </div>
    </CustomerProvider>
  );
};

export default Index;
