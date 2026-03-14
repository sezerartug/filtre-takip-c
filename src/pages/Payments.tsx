import { useEffect, useMemo, useState } from "react";
import { CustomerProvider, useCustomers } from "@/context/CustomerContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";

type PaymentRow = {
  id: string;
  amount: number;
  payment_date: string;
  customer_id: string;
};

type PaymentWithCustomer = {
  id: string;
  amount: number;
  date: Date;
  customerName: string;
  productPrice: number | null;
  totalPaidForCustomer: number;
  remaining: number | null;
};

const PaymentsInner = () => {
  const { customers } = useCustomers();
  const [payments, setPayments] = useState<PaymentWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_date, customer_id")
        .order("payment_date", { ascending: false });

      if (error || !data) {
        setPayments([]);
        setLoading(false);
        return;
      }

      const byCustomer = new Map<string, number>();
      (data as PaymentRow[]).forEach((p) => {
        byCustomer.set(p.customer_id, (byCustomer.get(p.customer_id) || 0) + p.amount);
      });

      const rows: PaymentWithCustomer[] = (data as PaymentRow[]).map((p) => {
        const customer = customers.find((c) => c.id === p.customer_id);
        const totalPaidForCustomer = byCustomer.get(p.customer_id) || 0;
        const productPrice = customer?.productPrice ?? null;
        const remaining =
          productPrice != null ? productPrice - totalPaidForCustomer : null;

        return {
          id: p.id,
          amount: p.amount,
          date: new Date(p.payment_date || new Date().toISOString()),
          customerName: customer
            ? `${customer.name} ${customer.surname}`
            : "Bilinmeyen müşteri",
          productPrice,
          totalPaidForCustomer,
          remaining,
        };
      });

      setPayments(rows);
      setLoading(false);
    };

    load();
  }, [customers]);

  const { todayTotal, monthTotal, grandTotal } = useMemo(() => {
    const today = new Date();
    const todayKey = format(today, "yyyy-MM-dd");
    const monthKey = format(today, "yyyy-MM");

    let t = 0;
    let m = 0;
    let g = 0;

    payments.forEach((p) => {
      const d = p.date;
      const dk = format(d, "yyyy-MM-dd");
      const mk = format(d, "yyyy-MM");
      g += p.amount;
      if (dk === todayKey) t += p.amount;
      if (mk === monthKey) m += p.amount;
    });

    return { todayTotal: t, monthTotal: m, grandTotal: g };
  }, [payments]);

  const totalRemaining = useMemo(() => {
    const byCustomer = new Map<string, number>();
    customers.forEach((c) => {
      if (c.productPrice != null) {
        byCustomer.set(c.id, c.productPrice);
      }
    });
    payments.forEach((p) => {
      const customer = customers.find((c) => `${c.name} ${c.surname}` === p.customerName);
      if (customer && byCustomer.has(customer.id)) {
        byCustomer.set(customer.id, (byCustomer.get(customer.id) || 0) - p.amount);
      }
    });
    let sum = 0;
    byCustomer.forEach((v) => {
      if (v > 0) sum += v;
    });
    return sum;
  }, [customers, payments]);

  return (
    <>
      <AppHeader />
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-secondary/10 to-secondary/30 px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Ödeme Geçmişi
              </h1>
              <p className="text-xs text-muted-foreground">
                Tüm müşterilere ait ödemeleri ve tahsilat özetini görüntüleyin.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-1">Bugünkü tahsilat</p>
                <p className="text-2xl font-semibold flex items-center gap-1">
                  <span className="text-base">₺</span>
                  {todayTotal.toLocaleString("tr-TR")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-1">Bu ayki tahsilat</p>
                <p className="text-2xl font-semibold flex items-center gap-1">
                  <span className="text-base">₺</span>
                  {monthTotal.toLocaleString("tr-TR")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-1">Toplam kalan borç</p>
                <p className="text-2xl font-semibold flex items-center gap-1">
                  <span className="text-base">₺</span>
                  {totalRemaining.toLocaleString("tr-TR")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Ürün Fiyatı</TableHead>
                    <TableHead>Toplam Ödeme</TableHead>
                    <TableHead>Bu Ödeme</TableHead>
                    <TableHead className="hidden md:table-cell">Kalan Borç</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-xs text-muted-foreground">
                        Ödemeler yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-xs text-muted-foreground">
                        Henüz kayıtlı ödeme bulunmuyor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {format(p.date, "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{p.customerName}</TableCell>
                        <TableCell>
                          {p.productPrice != null
                            ? `${p.productPrice.toLocaleString("tr-TR")} TL`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {p.totalPaidForCustomer.toLocaleString("tr-TR")} TL
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <span className="text-[11px] mr-1">₺</span>
                            {p.amount.toLocaleString("tr-TR")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {p.remaining != null
                            ? `${p.remaining.toLocaleString("tr-TR")} TL`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {!loading && (
                  <TableCaption className="text-xs">
                    Listelenen tüm ödemeler Supabase <code>payments</code> tablosundan
                    alınmıştır.
                  </TableCaption>
                )}
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

const Payments = () => (
  <CustomerProvider>
    <PaymentsInner />
  </CustomerProvider>
);

export default Payments;

