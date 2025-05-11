
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Menu } from "lucide-react";

interface AppHeaderProps {
  title?: string;
}

const AppHeader = ({ title = "Su Arıtma Filtre Takip" }: AppHeaderProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm opacity-90">
            Müşteri filtre değişim takip sistemi
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="text-sm hidden md:inline">
                {user.username} ({user.role === 'admin' ? 'Yönetici' : 'Teknisyen'})
              </span>
              <Button variant="outline" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Çıkış</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
