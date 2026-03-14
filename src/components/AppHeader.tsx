
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, CalendarDays, LayoutDashboard, CreditCard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface AppHeaderProps {
  title?: string;
}

const AppHeader = ({ title = "Su Arıtma Filtre Takip Sistemi" }: AppHeaderProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Panel", icon: LayoutDashboard },
    { to: "/schedule", label: "Takvim", icon: CalendarDays },
    { to: "/payments", label: "Ödemeler", icon: CreditCard },
  ];

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shadow-sm">
            FT
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              {title}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Müşteri filtre ve ödeme asistanı
            </span>
          </div>
          {user && (
            <nav className="ml-4 hidden md:flex items-center gap-1 rounded-full bg-muted/60 px-1 py-0.5 text-xs border border-border/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Button
                    key={item.to}
                    asChild
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-3 rounded-full text-xs font-medium transition-none ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-transparent text-muted-foreground"
                    }`}
                  >
                    <Link to={item.to}>
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium">
                  {user.full_name || user.email}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {user.role === "admin" ? "Yönetici" : "Teknisyen"}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={logout}
                className="h-8 w-8 rounded-full border-border/70 bg-background hover:bg-destructive/10 hover:text-destructive"
              >
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
