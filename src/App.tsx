
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import CapacitorApp from "./components/CapacitorApp";

// Capacitor core'u içe aktar
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Mobil uygulamalar için geri düğmesi işleme fonksiyonu
// App bileşeni dışında tanımlandı
const handleBackButtonForMobile = (ev: any) => {
  // Özel geri düğmesi davranışı gerekirse buraya eklenebilir
  ev.detail.register(10, () => {
    if (window.location.pathname === "/") {
      // Ana sayfadaysak, geri tuşu çıkış yapar mı diye soralım
      if (confirm("Uygulamadan çıkmak istiyor musunuz?")) {
        (window as any).navigator.app?.exitApp();
      }
    } else {
      // Diğer sayfalarda normal geri davranışı
      window.history.back();
    }
  });
};

const App = () => {
  const [isNative, setIsNative] = useState(false);
  
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    // Mobil uygulamalar için geri düğmesi işleme
    if (Capacitor.isNativePlatform()) {
      document.addEventListener('ionBackButton', handleBackButtonForMobile);
      return () => {
        document.removeEventListener('ionBackButton', handleBackButtonForMobile);
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CapacitorApp>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Index />} />
                  {/* Diğer korumalı rotalar buraya eklenebilir */}
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </AuthProvider>
        </CapacitorApp>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
