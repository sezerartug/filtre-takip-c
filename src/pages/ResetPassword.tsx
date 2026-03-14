import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
    };
    check();
  }, []);

  const onSubmit = async (data: FormValues) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    if (data.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      toast.success("Şifreniz güncellendi. Giriş yapabilirsiniz.");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Şifre güncellenemedi.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Geçersiz veya süresi dolmuş bağlantı</CardTitle>
            <CardDescription>
              Şifre sıfırlama bağlantısı geçersiz veya kullanılmış. Lütfen tekrar "Şifremi unuttum" ile yeni bağlantı isteyin.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/forgot-password">
              <Button variant="outline">Yeni bağlantı iste</Button>
            </Link>
            <Link to="/login" className="ml-2">
              <Button>Giriş sayfasına dön</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Yeni şifre belirleyin</CardTitle>
          <CardDescription>
            Yeni şifrenizi girin ve tekrar yazın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: "Şifre gereklidir",
                  minLength: { value: 6, message: "En az 6 karakter olmalı" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni şifre</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
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
                name="confirmPassword"
                rules={{
                  required: "Şifre tekrarı gereklidir",
                  validate: (v) =>
                    v === form.getValues("password") || "Şifreler eşleşmiyor",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre tekrar</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Kaydediliyor..." : "Şifreyi güncelle"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Giriş sayfasına dön
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
