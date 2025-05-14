
import { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type FormValues = {
  username: string;
  password: string;
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Eğer kullanıcı zaten oturum açmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Kullanıcı zaten oturum açmış, ana sayfaya yönlendiriliyor");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success("Giriş başarılı");
      console.log("Giriş başarılı, ana sayfaya yönlendiriliyor");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Giriş hatası:", error);
      toast.error("Kullanıcı adı veya şifre hatalı");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Su Arıtma Filtre Takip</CardTitle>
          <CardDescription>
            Lütfen giriş bilgilerinizi giriniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                rules={{ required: "Kullanıcı adı gereklidir" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Kullanıcı adınızı girin"
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
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Su Arıtma Filtre Takip Uygulaması
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
