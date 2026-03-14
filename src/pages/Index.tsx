
import { useState, useEffect } from "react";
import { CustomerProvider } from "@/context/CustomerContext";
import CustomerList from "@/components/CustomerList";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import DashboardUpcoming from "@/components/DashboardUpcoming";

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
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-secondary/30 flex flex-col">
        <AppHeader />

        <main className="container mx-auto px-4 pt-6 pb-8 flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div
                  className="absolute inset-1 rounded-full border-4 border-t-transparent border-r-primary/70 border-b-transparent border-l-transparent animate-spin"
                  style={{ animationDuration: "1.5s" }}
                />
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-4">
              {user && (
                <div className="glass-effect rounded-xl border border-border/60 p-4 flex items-center justify-between gap-3 animate-fade-in">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Aktif kullanıcı
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {user.full_name || user.email}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {user.role === "admin" ? "Yönetici" : "Teknisyen"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Müşteri filtre takibi
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Planlanan ve geciken filtre değişimlerini buradan yönetin.
                    </p>
                  </div>
                </div>
                <DashboardUpcoming />
                <CustomerList />
              </div>
            </div>
          )}
        </main>

        <footer className="bg-card/80 border-t p-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Su Arıtma Filtre Takip Uygulaması</p>
        </footer>
      </div>
    </CustomerProvider>
  );
};

export default Index;
