# Faz 1 — Kurulum Notu

## 1. Supabase migration'ları

Migration'ları Supabase üzerinde çalıştırmanız gerekir.

### Seçenek A: Supabase CLI (önerilen)

```bash
npx supabase db push
```

veya proje kökündeyken:

```bash
supabase migration up
```

### Seçenek B: Supabase Dashboard

1. [Supabase Dashboard](https://supabase.com/dashboard) → projeniz → **SQL Editor**
2. Sırayla şu dosyaların içeriğini kopyalayıp çalıştırın:
   - `supabase/migrations/20250314100000_create_companies_and_profiles.sql`
   - `supabase/migrations/20250314100001_add_company_id_and_rls.sql`

## 2. İlk kullanıcı / Admin

- **Mevcut projede** zaten `auth.users` kaydı varsa migration, bu kullanıcılar için `profiles` satırı oluşturur ve rolü `admin` yapar.
- **Sıfırdan** kuruyorsanız:
  1. Uygulamada **Kayıt ol** (şu an sadece giriş var; isterseniz kayıt sayfası eklenebilir) **veya**
  2. Supabase Dashboard → **Authentication** → **Users** → **Add user** ile e-posta ve şifre ile kullanıcı ekleyin.  
  Sonra SQL Editor’da bu kullanıcının `profiles` kaydına `role = 'admin'` verin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'BURAYA_USER_UUID';
```

## 3. Şifre sıfırlama e-postası

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** Uygulamanızın ana adresi (örn. `https://...vercel.app` veya `http://localhost:8080`)
- **Redirect URLs** listesine ekleyin: `https://.../reset-password` ve `http://localhost:8080/reset-password`

Böylece "Şifremi unuttum" ile gelen link doğru sayfaya yönlenir.

## 4. Giriş akışı (Faz 1 sonrası)

- Giriş artık **e-posta + şifre** ile yapılıyor (kullanıcı adı yok).
- Kullanıcı bilgisi ve rol `profiles` tablosundan okunuyor.
- "Şifremi unuttum" → e-posta ile link → `/reset-password` → yeni şifre.
- Müşteri eklerken oturum açan kullanıcının `company_id`’si (varsa) otomatik atanıyor.

## 5. Multi-tenant (şirket) kullanımı

- Önce **companies** tablosuna şirket ekleyin (Dashboard SQL veya ileride admin paneli).
- Kullanıcının `profiles.company_id` alanını bu şirketin `id`’si ile güncelleyin.
- RLS sayesinde kullanıcı sadece kendi şirketinin müşterilerini görür (admin tümünü görür).
