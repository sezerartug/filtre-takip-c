# React Native’e Geçiş Yol Haritası

Bu dokümanda mevcut **web uygulaması aynen kalırken**, aynı iş mantığını kullanan bir **React Native (mobil) uygulaması** nasıl oluşturulur, adım adım anlatılmaktadır.

---

## 1. Genel Strateji: “İki Uygulama, Ortak Mantık”

| Taraf | Nerede kalacak? | Teknoloji |
|-------|------------------|-----------|
| **Web** | Mevcut proje (`filtre-takip-c`) | React + Vite + Tailwind + shadcn (değişmez) |
| **Mobil** | Yeni bir proje (aynı repo içinde veya ayrı) | React Native + Expo |

**Ortak kullanılacaklar:**
- Supabase (aynı proje, aynı tablolar, aynı Auth)
- İş kuralları (filtre tarihi hesaplama, “sonraki değişim” mantığı vb.)
- Tip tanımları (Customer, FilterChange vb.)
- API / servis katmanı (Supabase çağrıları)

**Farklı olacaklar:**
- UI: Web’de DOM + Tailwind, mobilde React Native bileşenleri (View, Text, TouchableOpacity, vb.)
- Navigasyon: Web’de React Router, mobilde React Navigation
- Stil: Web’de Tailwind/CSS, mobilde StyleSheet / NativeWind (isteğe bağlı)

---

## 2. Önerilen Klasör Yapısı

İki popüler seçenek:

### Seçenek A: Monorepo (tek repo, iki uygulama + ortak paket)

```
filtre-takip-c/
├── apps/
│   ├── web/                 # Mevcut Vite + React projesi (taşınır)
│   │   ├── src/
│   │   ├── index.html
│   │   └── package.json
│   └── mobile/              # Yeni Expo (React Native) projesi
│       ├── App.tsx
│       ├── src/
│       └── package.json
├── packages/
│   └── shared/              # Ortak kod
│       ├── src/
│       │   ├── types/       # Customer, FilterChange, vb.
│       │   ├── services/    # customerService, supabase client
│       │   ├── utils/       # tarih hesaplamaları, getNextFilterChange mantığı
│       │   └── constants/
│       └── package.json
├── package.json             # Workspace root (npm/yarn/pnpm workspaces)
└── docs/
```

**Artıları:** Tek repo, ortak kod gerçekten paylaşılır, tek yerden yönetim.  
**Eksileri:** Monorepo kurulumu ve build süreçleri biraz daha karmaşık.

### Seçenek B: Ayrı repo / aynı repo içinde iki bağımsız proje (daha basit)

```
filtre-takip-c/              # Mevcut web (olduğu gibi)
├── src/
├── package.json
└── ...

filtre-takip-mobile/        # Yeni klasör veya ayrı repo
├── App.tsx
├── src/
│   ├── types/              # Web’den kopyala veya symlink
│   ├── services/           # Web’dekine benzer, Supabase aynı
│   ├── context/
│   ├── screens/
│   └── components/
└── package.json
```

**Artıları:** Hızlı başlangıç, mevcut web projesine dokunmuyorsun.  
**Eksileri:** Ortak kodu kopyalayıp senkron tutman gerekir; ileride monorepo’ya geçebilirsin.

**Öneri:** Önce **Seçenek B** ile mobil projeyi çıkar, çalışır hale getir. Paylaşılacak kod netleşince istersen **Seçenek A**’ya (monorepo + `packages/shared`) geçersin.

---

## 3. Adım Adım Yol Haritası

### Faz 1: Hazırlık (1–2 gün)

1. **Ortak kodu netleştir**
   - `src/types/index.ts` → mobilde de kullanılacak (birebir veya kopyala).
   - `src/services/customerService.ts` → Supabase çağrıları; mobilde aynı API’yi kullan (projeyi “shared” yapmadan önce kopyalayabilirsin).
   - Filtre/sonraki değişim mantığı (`getNextFilterChange`, `getFirstOverdueDate` vb.) → bunları tek yerde topla (ör. `utils/filterLogic.ts`); web ve mobil bu dosyayı kullansın.

2. **Supabase**
   - Web ve mobil **aynı Supabase projesini** kullanacak. Mobilde `@supabase/supabase-js` + `@react-native-async-storage/async-storage` ile session saklama (Supabase dokümantasyonundaki React Native kurulumu).

3. **Mobil proje oluştur**
   - [Expo](https://expo.dev) ile: `npx create-expo-app filtre-takip-mobile --template blank-typescript`
   - Projeyi `filtre-takip-c` ile aynı üst klasöre koy (veya ayrı repo).

### Faz 2: Temel Mobil Uygulama (1–2 hafta)

4. **Bağımlılıklar**
   - `@supabase/supabase-js`, `@react-native-async-storage/async-storage`
   - `@react-navigation/native`, `@react-navigation/native-stack` (ve istersen bottom tabs)
   - `date-fns` (zaten web’de var, aynı mantık)
   - Auth için: Supabase Auth (e-posta/şifre); gerekirse `expo-secure-store` ile token saklama.

5. **Ekranlar (web’deki sayfaların karşılıkları)**
   - Login
   - Ana liste (müşteri kartları) → Panel
   - Müşteri detay (Genel / Filtreler / Ödemeler → tab veya ayrı ekranlar)
   - Takvim (Schedule)
   - Ödemeler (Payments)

6. **Context / state**
   - AuthContext ve CustomerContext mantığını mobilde de uygula; sadece UI tarafı React Native bileşenlerine dönüşür.

7. **Ortak mantığı kullan**
   - `getNextFilterChange`, satın alma/son değişim bazlı “sonraki değişim” hesabı, geciken liste mantığı web ile aynı olsun (shared dosya veya kopyala-yapıştır).

### Faz 3: UI ve Deneyim (1–2 hafta)

8. **Bileşenler**
   - Müşteri kartı: `View`, `Text`, `Pressable` ile; geciken için farklı arka plan (web’de yaptığın gibi).
   - Liste: `FlatList` (performans için).
   - Formlar: TextInput, tarih seçici (örn. `@react-native-community/datetimepicker`), butonlar.

9. **Navigasyon**
   - Stack: Login → Ana stack (Liste, Detay, Takvim, Ödemeler).
   - Detay içinde tab (Genel / Filtreler / Ödemeler) veya ayrı ekranlar.

10. **Stil**
    - StyleSheet veya NativeWind (Tailwind benzeri) ile tutarlı renkler ve spacing; web’deki primary/red/amber mantığını koru.

### Faz 4: Senkron ve Bakım

11. **Web’i olduğu gibi bırak**
    - Mevcut `filtre-takip-c` sadece web; deploy (Vercel/Netlify vb.) aynen devam eder.

12. **Ortak kodu güncellerken**
    - Eğer shared paket yoksa: `types`, `services`, filtre hesaplama mantığını güncellediğinde hem web hem mobilde güncelle.
    - İleride monorepo’ya geçersen bu kod tek `packages/shared` içine taşınır.

13. **Mobil yayın**
    - Expo EAS Build ile Android/iOS build; TestFlight / Play Store iç dağıtım veya store yayını.

---

## 4. Kısa Özet Tablo

| Konu | Web (mevcut) | Mobil (yeni) |
|------|----------------|--------------|
| Proje | `filtre-takip-c` (Vite + React) | `filtre-takip-mobile` (Expo) |
| UI | React DOM, Tailwind, shadcn | React Native, StyleSheet / NativeWind |
| Navigasyon | React Router | React Navigation |
| State / Auth | Context (aynı mantık) | Context (aynı mantık) |
| Veri | Supabase (aynı proje) | Supabase (aynı proje) |
| İş kuralları | Mevcut kod | Shared veya kopyala |

---

## 5. İlk Adım İçin Komutlar (Seçenek B)

```bash
# Üst klasörde (örn. "Su Arıtma Projem")
cd "Su Arıtma Projem"
npx create-expo-app filtre-takip-mobile --template blank-typescript
cd filtre-takip-mobile
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
npm install date-fns
```

Sonrasında:
- `filtre-takip-c/src/types/index.ts` içeriğini mobilde `src/types/index.ts` olarak kopyala.
- Supabase `client` ve `customerService` mantığını mobilde kur (env’de aynı Supabase URL/anon key).
- Tek ekran: Login + basit bir müşteri listesi ile başla; çalıştığını gördükten sonra ekranları ve ortak mantığı genişlet.

Bu yol haritası ile **web uygulaması aynen kalır**, **mobil uygulama aynı veri ve kurallarla** ayrı bir React Native projesi olarak ilerler. İstersen bir sonraki adımda monorepo yapısını veya paylaşılacak `shared` paketinin içeriğini satır satır planlayabiliriz.
