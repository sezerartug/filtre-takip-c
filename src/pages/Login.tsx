import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";

type FormValues = {
  email: string;
  password: string;
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/", { replace: true });
    } catch {
      // Hatalar AuthContext içinde toast ile gösteriliyor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Sol taraf: marka + değer önerisi */}
        <div className="hidden lg:flex flex-col gap-6 text-foreground animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium w-fit">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Canlı filtre takip ve bakım planlama
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              Su Arıtma Filtre{" "}
              <span className="text-primary">Takip Sistemi</span>
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
              Müşterilerinizin filtre değişimlerini, bakım tarihlerini ve
              ödemelerini tek bir yerden takip edin. Hatırlatma kaçırmayın,
              operasyonunuzu profesyonel yönetin.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="glass-effect rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Aktif müşteri</p>
              <p className="text-lg font-semibold">1000+</p>
            </div>
            <div className="glass-effect rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Aylık bakım</p>
              <p className="text-lg font-semibold">250+</p>
            </div>
            <div className="glass-effect rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Zaman tasarrufu</p>
              <p className="text-lg font-semibold">%60</p>
            </div>
          </div>
        </div>

        {/* Sağ taraf: giriş kartı */}
        <Card className="w-full max-w-md mx-auto glass-effect card-hover">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              Hoş geldiniz
            </CardTitle>
            <CardDescription>
              Yönetim paneline erişmek için e-posta ve şifrenizle giriş yapın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "E-posta gereklidir",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Geçerli bir e-posta adresi girin",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ornek@email.com"
                          autoComplete="email"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  rules={{ required: "Şifre gereklidir" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Şifrenizi girin"
                          type="password"
                          autoComplete="current-password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Demo: admin@deneme.com / admin123456
                  </span>
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Şifremi unuttum
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 items-center justify-center">
            <p className="text-xs text-muted-foreground text-center">
              Bu panel sadece yetkili personel içindir. Giriş bilgilerinizin
              güvenliğini koruyun.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Tüm Hakları Saklıdır. Developer by SezerArtug
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
