# Filtre Takip — Version 2 Planı

Bu dokümanda: (1) mevcut proje yapısı ve teknolojiler, (2) gerçek hayat / satılabilir ürün için yapılması gerekenler, (3) Version 2 + arayüz iyileştirme task listesi yer alıyor.

---

## BÖLÜM 1 — Projede Kullandığınız Yapılar ve Teknolojiler

### Frontend
| Teknoloji | Kullanım |
|-----------|----------|
| **React 18** | Ana UI kütüphanesi |
| **TypeScript** | Tip güvenliği |
| **Vite 5** | Build tool, SWC ile HMR |
| **React Router v6** | SPA routing (`/`, `/login`, `*` NotFound) |
| **Tailwind CSS** | Stil, tema değişkenleri (light/dark), `index.css` |
| **shadcn/ui (Radix)** | Button, Card, Dialog, Form, Input, Tabs, Select, vb. |
| **Lucide React** | İkonlar |
| **React Hook Form** | Form state, validasyon |
| **Zod** | Şema validasyonu (Form ile birlikte) |
| **TanStack React Query** | Sunucu state (QueryClient kurulu, kullanım sınırlı) |
| **Sonner + React Hot Toast** | Bildirimler |
| **date-fns** | Tarih işlemleri |
| **Recharts** | Grafikler (varsa) |
| **jsPDF + jspdf-autotable** | PDF export |
| **xlsx** | Excel export |
| **next-themes** | Tema (dark/light) — bağımlılık var, kullanım belirsiz |
| **Capacitor 7** | Mobil (iOS/Android) wrapper, geri tuşu, Share |

### Backend / Veri
| Teknoloji | Kullanım |
|-----------|----------|
| **Supabase** | Auth + PostgreSQL (Realtime yok görünüyor) |
| **Supabase Auth** | Email/şifre ile giriş; demo kullanıcılar kod içinde |

### Proje Yapısı
```
src/
├── context/          # AuthContext, CustomerContext
├── pages/            # Index, Login, NotFound, CustomerDetail
├── components/       # AppHeader, CustomerList, CustomerCard, CustomerForm,
│                    # CustomerDetailDialog, FilterDetails, ProtectedRoute, UI/*
├── services/         # customerService (Supabase CRUD)
├── integrations/     # supabase/client, supabase/types
├── types/            # Customer, FilterChange, FilterStatus
├── utils/            # helpers, pdfExport, excelExport
├── hooks/            # use-toast, use-mobile
├── lib/              # utils (cn vb.)
├── index.css         # Tailwind + CSS değişkenleri + animasyonlar
└── main.tsx, App.tsx
```

### Veritabanı (Supabase public)
- **customers**: id, name, surname, address, phone, purchase_date, product_id, product_price, user_id, created_at, updated_at
- **filter_changes**: id, customer_id, scheduled_date, change_date, is_changed
- **payments**: id, customer_id, amount, payment_date
- **products**: id, name, price

### Auth
- Demo kullanıcılar `AuthContext.tsx` içinde sabit (örn. admin / admin123).
- Supabase `signInWithPassword` / `signUp` ile e-posta tabanlı oturum.
- Oturum bilgisi `localStorage` (`auth_user`) ile takip ediliyor.

### Stil / Tema
- CSS değişkenleri: `--primary`, `--background`, `--foreground`, `--radius`, sidebar vb.
- Font: Inter (Google Fonts).
- Özel: `animate-fade-in`, `glass-effect`, `card-hover`, `status-badge`.

---

## BÖLÜM 2 — Gerçek Hayat / Satılabilir Proje İçin Yapılması Gerekenler

MVP’den “kompleks, satılabilir ürün”e geçiş için önerilen eklemeler:

### 2.1 Kimlik ve Yetkilendirme
- [ ] **Gerçek kullanıcı yönetimi**: Demo kullanıcı listesini kaldır; tüm kullanıcılar Supabase Auth (veya ileride OAuth) ile.
- [ ] **Roller ve RLS**: `admin` / `teknisyen` / `müşteri` gibi roller; Supabase’de `profiles` veya `users` tablosu + RLS politikaları.
- [ ] **Şifre sıfırlama**: “Şifremi unuttum” + e-posta ile sıfırlama.
- [ ] **E-posta doğrulama**: Kayıt sonrası doğrulama e-postası.
- [ ] **Çoklu kiracı (multi-tenant)**: Firma/şirket bazlı veri izolasyonu (her müşteri listesi sadece kendi firmasına ait).

### 2.2 Müşteri ve İş Mantığı
- [ ] **Müşteri–firma eşlemesi**: Müşterilerin hangi firmaya ait olduğu (tenant_id / company_id).
- [ ] **Sözleşme / abonelik**: Sözleşme başlangıç–bitiş, abonelik tipi, fiyat.
- [ ] **Filtre tipi kataloğu**: Ürün/filtre tipleri, ömür (ay), varsayılan hatırlatma süreleri.
- [ ] **Bakım geçmişi**: Yapılan değişimler, notlar, teknisyen bilgisi (audit trail).
- [ ] **Ödeme takibi**: Taksit, vade, ödeme durumu (ödendi/beklemede/gecikmiş).

### 2.3 Bildirim ve Hatırlatmalar
- [ ] **Hatırlatma sistemi**: Filtre değişim tarihi yaklaşan müşterilere e-posta/SMS/push.
- [ ] **Supabase Edge Functions** veya cron ile zamanlanmış işler.
- [ ] **Bildirim tercihleri**: Müşteri bazlı “e-posta / SMS / uygulama” seçimi.

### 2.4 Raporlama ve Analiz
- [ ] **Dashboard**: Özet metrikler (toplam müşteri, bu ay yapılacak filtre, gecikmiş bakım, tahsilat).
- [ ] **Grafikler**: Zaman serisi (bakım sayısı, gelir), filtre tipi dağılımı.
- [ ] **Dışa aktarma**: PDF/Excel’i tarih aralığı ve filtreyle; rapor şablonları.

### 2.5 Operasyonel ve Yönetim
- [ ] **Teknisyen ataması**: Müşteri veya randevuya teknisyen atama.
- [ ] **Randevu takvimi**: Planlanan bakım tarihleri, takvim görünümü.
- [ ] **Stok / sarf malzeme**: Filtre stok takibi (opsiyonel).
- [ ] **Firma/şube yönetimi**: Çok şubeli kullanım için şube/firma CRUD ve yetki.

### 2.6 Güvenlik ve Kalite
- [ ] **RLS (Row Level Security)**: Tüm tablolarda açık; kullanıcı/rol/tenant’a göre `SELECT/INSERT/UPDATE/DELETE`.
- [ ] **Rate limiting / güvenlik**: Supabase ve gerekirse edge/custom API.
- [ ] **Audit log**: Kritik işlemlerde “kim, ne zaman, ne yaptı” kaydı.
- [ ] **Yedekleme ve geri yükleme**: Supabase yedekleme stratejisi ve prosedürü.

### 2.7 Kullanıcı Deneyimi ve Arayüz
- [ ] **Responsive ve erişilebilirlik**: Tüm sayfalar mobil/tablet, klavye ve ekran okuyucu uyumu.
- [ ] **Çoklu dil (i18n)**: En az TR/EN; dil seçimi ve metinlerin dışarı alınması.
- [ ] **Onboarding**: İlk girişte kısa rehber veya boş state’lerde yardım.
- [ ] **Arayüz tutarlılığı**: Tasarım sistemi (renk, tipografi, spacing), loading/skeleton, hata sayfaları.

### 2.8 Satış ve Ürünleştirme
- [ ] **Fiyatlandırma / planlar**: Ücretsiz / Pro / Kurumsal gibi planlar; özellik kısıtları.
- [ ] **Ödeme entegrasyonu**: Stripe/Iyzico vb. abonelik ödemesi.
- [ ] **Lisans / aktivasyon**: Firma bazlı lisans (domain veya kullanıcı sayısı).
- [ ] **Yasal**: KVKK uyumu, kullanım koşulları, gizlilik politikası.

---

## BÖLÜM 3 — Version 2 + Arayüz İyileştirme Task Listesi

Aşağıdaki liste hem “Version 2” hem de “arayüzü güzelleştirme” hedeflerini kapsar. Öncelik sırasına göre gruplandı.

### Faz 1 — Temel ve Güvenlik (Öncelik: Yüksek)
1. **Auth’u gerçek hayata taşı**  
   Demo kullanıcıları kaldır; sadece Supabase Auth (e-posta/şifre). İsteğe: OAuth (Google vb.).

2. **RLS ve roller**  
   Supabase’de `profiles` (veya `users`) tablosu, `role` alanı. Tüm tablolarda RLS politikaları (admin tüm veri, teknisyen kendi atandığı müşteriler vb.).

3. **Multi-tenant altyapı**  
   `companies` veya `tenants` tablosu; `customers` ve diğer tablolara `company_id`. RLS’te `company_id` filtresi.

4. **Şifre sıfırlama ve e-posta doğrulama**  
   Supabase Auth e-posta akışları; “Şifremi unuttum” ve “E-posta doğrula” sayfaları.

### Faz 2 — Arayüz ve Tasarım
5. **Tasarım sistemi dokümantasyonu**  
   Renk paleti, tipografi, spacing, bileşen kullanımı (en azından internal doc veya Storybook).

6. **Login sayfası yenileme**  
   Daha sade/güçlü layout, marka alanı, hata mesajları, loading state; isteğe dark mode.

7. **Ana sayfa (Index) düzeni**  
   Hoş geldin bloğu, istatistik kartları (müşteri sayısı, bu ay bakım, gecikmiş), son işlemler.

8. **Müşteri listesi ve kartlar**  
   Daha iyi kart tasarımı, filtre durumu göstergeleri (renk/ikon), arama/filtreleme UI’ı.

9. **Müşteri detay sayfası**  
   Sekmeli veya bölümlü yapı: Genel bilgiler, filtreler, ödemeler, notlar. Tutarlı header ve aksiyonlar.

10. **Ortak bileşenler**  
    Boş state (empty state), skeleton loader, sayfa başlığı + breadcrumb, tutarlı buton ve form stilleri.

11. **Mobil deneyim**  
    Capacitor ile test; liste/detay mobil layout, dokunmatik hedefler, geri navigasyonu.

### Faz 3 — Özellik Derinliği
12. **Dashboard**  
    Özet metrikler, basit grafikler (Recharts), “bu ay / gecikmiş” filtreleri.

13. **Filtre tipi kataloğu**  
    Ürün/filtre tipleri CRUD, varsayılan kullanım ömrü; müşteri eklerken bu katalogdan seçim.

14. **Randevu / takvim**  
    Planlanan filtre değişim tarihleri için takvim görünümü (örn. react-big-calendar veya basit liste).

15. **Bildirim altyapısı**  
    Tercih tablosu, Supabase Edge Function veya cron ile hatırlatma e-postası/SMS taslağı.

16. **Ödeme takibi**  
    Ödemeleri “tarih / tutar / durum” ile listeleme ve raporlama.

### Faz 4 — Satılabilir Ürün
17. **Firma/şube yönetimi**  
    Admin için firma ekleme/düzenleme, kullanıcı atama.

18. **Abonelik ve ödeme**  
    Plan seçimi, Stripe/Iyzico entegrasyonu, lisans süresi kontrolü.

19. **i18n**  
    TR/EN (react-i18next vb.), tüm metinlerin key’lere taşınması.

20. **Yasal ve KVKK**  
    Gizlilik politikası, kullanım koşulları sayfaları; KVKK aydınlatma metni ve onay alanları.

---

## Özet Tablo

| Kategori | Mevcut | V2 Hedef |
|----------|--------|----------|
| Auth | Demo + Supabase | Tam Supabase Auth, roller, RLS |
| Veri izolasyonu | user_id | Multi-tenant (company_id) + RLS |
| Müşteri | CRUD, filtre/ödeme | + Sözleşme, randevu, hatırlatma |
| Raporlama | PDF/Excel export | + Dashboard, grafikler, tarih filtreleri |
| Arayüz | shadcn, Tailwind | Tutarlı tasarım sistemi, yenilenmiş sayfalar |
| Satış | — | Planlar, ödeme, lisans, yasal metinler |

Bu planı takip ederek önce Faz 1’den başlayıp, ardından Faz 2 (arayüz) ile paralel ilerleyebilirsiniz. İsterseniz bir sonraki adımda tek bir fazı (ör. “Faz 1” veya “Login + Ana sayfa arayüzü”) detaylı task’lara bölüp adım adım uygulayabiliriz.
