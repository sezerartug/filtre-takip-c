import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Customer, FilterChange, FilterStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { addMonths, format, isAfter, isSameDay, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomers } from "@/context/CustomerContext";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
}

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  initialTab?: "overview" | "filters" | "payments";
}

const CustomerDetailDialog: React.FC<CustomerDetailDialogProps> = ({ open, onOpenChange, customer, initialTab = "overview" }) => {
  if (!customer) return null;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPayment, setNewPayment] = useState("");
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // yyyy-MM-dd
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { refreshCustomers } = useCustomers();

  const [activeTab, setActiveTab] = useState<"overview" | "filters" | "payments">(initialTab);
  const [localFilters, setLocalFilters] = useState<FilterChange[]>(customer.filterDates || []);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab, customer]);

  useEffect(() => {
    // Müşteri değiştiğinde lokal filtre listesini tazele
    setLocalFilters(customer.filterDates || []);
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    // Ürün ve ödeme verilerini çek
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Ödeme listesini çek
        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("customer_id", customer.id)
          .order("payment_date", { ascending: false });
        setPayments(paymentData || []);

        // Ürün bilgilerini çek
        const { data: productData } = await supabase
          .from("products")
          .select("name, price")
          .eq("customer_id", customer.id)
          .single();

        if (productData) {
          customer.productName = productData.name;
          customer.productPrice = productData.price;
        }
      } catch (error) {
        console.error("Detay bilgileri yüklenirken hata:", error);
        toast.error("Detay bilgileri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [customer]);

  const handleAddPayment = async () => {
    if (!customer) return;
    
    const amount = parseFloat(newPayment);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Geçerli bir ödeme tutarı giriniz");
      return;
    }

    setLoading(true);
    try {
      // Kullanıcı oturumunu kontrol et
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Oturum açık değil");
      }

      // Ödeme ekleme işlemi
      const { data, error } = await supabase
        .from("payments")
        .insert({
          customer_id: customer.id,
          amount: amount,
          payment_date: paymentDate,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("Ödeme ekleme hatası:", error);
        if (error.code === '42501') {
          throw new Error("Bu işlem için yetkiniz yok");
        } else if (error.code === '23505') {
          throw new Error("Bu ödeme zaten kaydedilmiş");
        } else if (error.code === '23503') {
          throw new Error("Müşteri bilgisi bulunamadı");
        } else {
          throw new Error(`Ödeme eklenirken bir hata oluştu: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error("Ödeme eklenemedi");
      }

      // Ödeme listesini güncelle
      setPayments([data, ...payments]);
      setNewPayment("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      toast.success("Ödeme başarıyla eklendi");
    } catch (error) {
      console.error("Ödeme eklenirken hata:", error);
      const errorMessage = error instanceof Error ? error.message : "Ödeme eklenirken bir hata oluştu";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const [manualDate, setManualDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const handleManualChange = async () => {
    if (!customer) return;
    if (!manualDate) {
      toast.error("Lütfen manuel bir tarih seçin");
      return;
    }
    const selected = new Date(manualDate);
    const nextDate = addMonths(selected, 12);

    setLoading(true);
    try {
      // Manuel tamamlanmış değişim
      const { error: insertError1 } = await supabase.from("filter_changes").insert({
        customer_id: customer.id,
        scheduled_date: selected.toISOString(),
        is_changed: true,
        change_date: selected.toISOString(),
      });
      if (insertError1) throw insertError1;

      // Sonraki yıl için planlama
      const { error: insertError2 } = await supabase.from("filter_changes").insert({
        customer_id: customer.id,
        scheduled_date: nextDate.toISOString(),
        is_changed: false,
      });
      if (insertError2) throw insertError2;

      // Hem müşteri nesnesini hem de lokal state'i güncelle
      const updatedFilters: FilterChange[] = [
        ...localFilters,
        {
          date: selected,
          isChanged: true,
          changeDate: selected,
          manual: true,
        },
        {
          date: nextDate,
          isChanged: false,
        },
      ];

      customer.filterDates = updatedFilters;
      setLocalFilters(updatedFilters);
      await refreshCustomers();
      toast.success("Manuel filtre değişimi kaydedildi");
    } catch (e: any) {
      console.error("Manuel filtre değişimi hatası:", e);
      toast.error("Manuel filtre değişimi kaydedilemedi");
    } finally {
      setLoading(false);
    }
  };

  // Kalan borç hesaplama
  const productPrice = customer?.productPrice || 0;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = productPrice - totalPaid;

  // Yaklaşan filtre ve timeline hesapları
  const { nextFilter, nextFilterIndex, timeline } = useMemo(() => {
    if (!customer) {
      return { nextFilter: null, nextFilterIndex: -1, timeline: [] as FilterChange[] };
    }

    const filters = localFilters || [];

    const uncompleted = filters.filter((f) => !f.isChanged);

    let next: FilterChange | null = null;
    let idx = -1;

    if (uncompleted.length > 0) {
      const today = startOfDay(new Date());
      const purchaseDate = startOfDay(new Date(customer.purchaseDate));

      // Son gerçekleşen değişim tarihi
      const lastChanged = [...filters]
        .filter((f) => f.isChanged && f.changeDate)
        .sort((a, b) => (b.changeDate!.getTime() - a.changeDate!.getTime()))[0];

      const lastChangeDate = lastChanged?.changeDate
        ? startOfDay(new Date(lastChanged.changeDate))
        : null;

      let baseDate = purchaseDate;
      if (lastChangeDate) {
        const diffPurchase = Math.abs(today.getTime() - purchaseDate.getTime());
        const diffLastChange = Math.abs(today.getTime() - lastChangeDate.getTime());
        baseDate = diffLastChange <= diffPurchase ? lastChangeDate : purchaseDate;
      }

      const idealNext = addMonths(baseDate, 12);

      let best: FilterChange | null = null;
      let bestDiff = Number.POSITIVE_INFINITY;

      for (const f of uncompleted) {
        const date = startOfDay(new Date(f.date));
        if (date.getTime() < baseDate.getTime()) continue;
        const diff = Math.abs(date.getTime() - idealNext.getTime());
        if (diff < bestDiff) {
          bestDiff = diff;
          best = f;
        }
      }

      if (!best) {
        best = uncompleted.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      }

      next = best;
      idx = filters.findIndex((f) => f === next);
    }

    const history = [...filters]
      .filter((f) => f.isChanged && f.changeDate)
      .sort((a, b) => (b.changeDate!.getTime() - a.changeDate!.getTime()))
      .slice(0, 5);

    return { nextFilter: next, nextFilterIndex: idx, timeline: history };
  }, [customer, localFilters]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Müşteri Detayları</DialogTitle>
          <DialogDescription>
            Müşteri bilgileri, filtre değişimleri ve ödemeleri buradan yönetebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-2">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="overview">Genel</TabsTrigger>
            <TabsTrigger value="filters">Filtreler</TabsTrigger>
            <TabsTrigger value="payments">Ödemeler</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Müşteri Bilgileri</h3>
                <div className="rounded-xl border bg-card p-3 text-sm space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Ad Soyad</span>
                    <span className="font-medium">{customer.name} {customer.surname}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Telefon</span>
                    <span className="font-medium">{customer.phone}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Satın Alma</span>
                    <span className="font-medium">
                      {format(customer.purchaseDate, "dd/MM/yyyy")}
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Ürün Bilgileri</h3>
                <div className="rounded-xl border bg-card p-3 text-sm space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Ürün</span>
                    <span className="font-medium">{customer.productName || "-"}</span>
                  </p>
                  {isAdmin && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Fiyat</span>
                      <span className="font-medium">
                        {customer.productPrice?.toLocaleString("tr-TR")} TL
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Adres</h3>
              <div className="rounded-xl border bg-card p-3 text-sm">
                {customer.address}
              </div>
            </div>
            {isAdmin && (
              <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm space-y-1">
                <h4 className="font-semibold text-primary mb-1">Finansal Özet</h4>
                <p>Toplam Tutar: {productPrice.toLocaleString("tr-TR")} TL</p>
                <p>Toplam Ödenen: {totalPaid.toLocaleString("tr-TR")} TL</p>
                <p>Kalan Borç: {remaining.toLocaleString("tr-TR")} TL</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="filters" className="space-y-2">
            <div className="space-y-3">
              <div className="rounded-xl border bg-card p-3 text-sm">
                <p className="text-xs text-muted-foreground">Yaklaşan filtre tarihi</p>
                <p className="font-medium">
                  {nextFilter ? format(nextFilter.date, "dd/MM/yyyy") : "Planlanmış filtre bulunmuyor"}
                </p>
              </div>

              <div className="rounded-xl border bg-card p-3 text-sm space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Manuel filtre değişimi
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="p-2 border rounded-lg text-sm flex-1"
                    disabled={loading}
                  />
                  <Button size="sm" onClick={handleManualChange} disabled={loading}>
                    Manuel değişimi kaydet
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 text-sm space-y-2 max-h-56 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground">
                  Filtre değişim geçmişi (son 5 kayıt)
                </p>
                {timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Henüz filtre değişimi kaydı yok.</p>
                ) : (
                  timeline.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b last:border-b-0 py-1.5"
                    >
                      <span className="text-xs text-muted-foreground">
                        {format(f.changeDate || f.date, "dd/MM/yyyy")}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/40">
                        {f.manual ? "Manuel" : "Otomatik"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Ödeme Geçmişi</h3>
              <span className="text-xs text-muted-foreground">
                Ürün fiyatı:{" "}
                <span className="font-medium">
                  {productPrice.toLocaleString("tr-TR")} TL
                </span>
                {"  •  "}
                Toplam ödenen:{" "}
                <span className="font-medium">
                  {totalPaid.toLocaleString("tr-TR")} TL
                </span>
                {"  •  "}
                Kalan:{" "}
                <span className="font-medium">
                  {remaining.toLocaleString("tr-TR")} TL
                </span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                value={newPayment}
                onChange={(e) => setNewPayment(e.target.value)}
                placeholder="Ödeme tutarı"
                className="flex-1 p-2 border rounded-lg text-sm"
                disabled={loading}
              />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="p-2 border rounded-lg text-sm"
                disabled={loading}
              />
              <Button onClick={handleAddPayment} disabled={loading}>
                {loading ? "Ekleniyor..." : "Ödeme ekle"}
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Henüz kayıtlı ödeme bulunmuyor.
                </p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center px-3 py-2 rounded-lg bg-secondary/10 text-sm"
                  >
                    <span>{format(new Date(payment.payment_date), "dd/MM/yyyy")}</span>
                    <span className="font-medium">
                      {payment.amount.toLocaleString("tr-TR")} TL
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailDialog; 