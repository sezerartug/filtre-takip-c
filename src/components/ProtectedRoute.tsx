
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  console.log("ProtectedRoute - Auth durumu:", { isAuthenticated, isLoading, user });
  
  useEffect(() => {
    // Kullanıcı oturum açtıysa ve bu bileşen yüklendiyse, ana sayfaya yönlendir
    if (isAuthenticated && user && !isLoading) {
      console.log("Kullanıcı doğrulandı, ana sayfaya yönlendirilecek");
    }
  }, [isAuthenticated, user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Oturum açılmadı, giriş sayfasına yönlendiriliyor");
    return <Navigate to="/login" replace />;
  }

  console.log("Kullanıcı oturum açtı, korumalı içerik görüntüleniyor");
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <Outlet />
    </Suspense>
  );
};

export default ProtectedRoute;
