import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Customer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";

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
}

const CustomerDetailDialog: React.FC<CustomerDetailDialogProps> = ({ open, onOpenChange, customer }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPayment, setNewPayment] = useState("");
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // yyyy-MM-dd
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
          .order("payment_date", { ascending: true });
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

  if (!customer) return null;

  // Kalan borç hesaplama
  const productPrice = customer?.productPrice || 0;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = productPrice - totalPaid;

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
      setPayments([...payments, data]);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Müşteri Detayları</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Müşteri Bilgileri</h3>
              <p>Ad Soyad: {customer.name} {customer.surname}</p>
              <p>Telefon: {customer.phone}</p>
              <p>Adres: {customer.address}</p>
              <p>Satın Alma Tarihi: {format(customer.purchaseDate, "dd/MM/yyyy")}</p>
            </div>
            <div>
              <h3 className="font-semibold">Ürün Bilgileri</h3>
              <p>Ürün: {customer.productName}</p>
              {isAdmin && <p>Fiyat: {customer.productPrice?.toLocaleString('tr-TR')} TL</p>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Ödemeler</h3>
            {isAdmin && (
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  value={newPayment}
                  onChange={(e) => setNewPayment(e.target.value)}
                  placeholder="Ödeme Tutarı"
                  className="flex-1 p-2 border rounded"
                  disabled={loading}
                />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="p-2 border rounded"
                  disabled={loading}
                />
                <Button onClick={handleAddPayment} disabled={loading}>
                  {loading ? "Ekleniyor..." : "Ödeme Ekle"}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between p-2 bg-secondary/10 rounded">
                  <span>{format(new Date(payment.payment_date), "dd/MM/yyyy")}</span>
                  <span>{payment.amount.toLocaleString('tr-TR')} TL</span>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4 p-4 bg-primary/10 rounded">
              <h3 className="font-semibold mb-2">Özet</h3>
              <p>Toplam Tutar: {productPrice.toLocaleString('tr-TR')} TL</p>
              <p>Toplam Ödenen: {totalPaid.toLocaleString('tr-TR')} TL</p>
              <p>Kalan Borç: {remaining.toLocaleString('tr-TR')} TL</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailDialog; 