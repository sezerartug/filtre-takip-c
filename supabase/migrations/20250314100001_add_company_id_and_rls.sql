-- Faz 1: customers tablosuna company_id ekleme ve RLS

-- customers tablosuna company_id (mevcut veriler için null)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- RLS'i tüm ilgili tablolarda etkinleştir
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- profiles: kullanıcı sadece kendi profilini okuyabilir
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- companies: giriş yapmış herkes okuyabilir (admin tümünü, user kendi company_id'sini filtreler)
CREATE POLICY "Authenticated users can read companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

-- Admin şirket ekleyebilir/güncelleyebilir (opsiyonel: sadece admin)
CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- customers: admin tümünü görür, user sadece kendi company_id'sine ait olanları
CREATE POLICY "Users can read customers by company"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL
    OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (true);

-- filter_changes: müşteri erişimi üzerinden (customer_id ile ilişkili)
CREATE POLICY "Users can manage filter_changes"
  ON public.filter_changes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- payments
CREATE POLICY "Users can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- products
CREATE POLICY "Users can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
