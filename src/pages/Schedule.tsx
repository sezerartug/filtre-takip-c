import { useState } from "react";
import { addDays, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";
import { CustomerProvider, useCustomers } from "@/context/CustomerContext";
import { FilterStatus } from "@/types";
import { formatDate } from "@/utils/helpers";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Calendar, Clock } from "lucide-react";
import AppHeader from "@/components/AppHeader";

type Range = "today" | "7" | "30" | "all";

const ScheduleInner = () => {
  const { customers } = useCustomers();
  const [range, setRange] = useState<Range>("7");

  const today = startOfDay(new Date());
  const in7 = startOfDay(addDays(today, 7));
  const in30 = startOfDay(addDays(today, 30));

  const computeStatus = (date: Date, isChanged: boolean): FilterStatus => {
    const d = startOfDay(date);
    if (isChanged) return FilterStatus.COMPLETED;
    if (isSameDay(d, today)) return FilterStatus.PLANNED;
    if (isAfter(today, d)) return FilterStatus.OVERDUE;
    return FilterStatus.PLANNED;
  };

  const rows = customers.flatMap((customer) =>
    customer.filterDates.map((f) => {
      const d = new Date(f.date);
      const status = computeStatus(d, f.isChanged);
      return {
        customerName: `${customer.name} ${customer.surname}`,
        address: customer.address,
        phone: customer.phone,
        date: d,
        status,
      };
    })
  );

  const filtered = rows
    .filter((r) => {
      const d = startOfDay(r.date);
      switch (range) {
        case "today":
          return isSameDay(d, today);
        case "7":
          return !isAfter(d, in7) && !isBefore(d, today);
        case "30":
          return !isAfter(d, in30) && !isBefore(d, today);
        case "all":
        default:
          return true;
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const statusVariant = (status: FilterStatus) => {
    switch (status) {
      case FilterStatus.COMPLETED:
        return "secondary" as const;
      case FilterStatus.OVERDUE:
        return "destructive" as const;
      case FilterStatus.PENDING:
      case FilterStatus.PLANNED:
      default:
        return "default" as const;
    }
  };

  const statusText = (status: FilterStatus) => {
    switch (status) {
      case FilterStatus.COMPLETED:
        return "Tamamlandı";
      case FilterStatus.OVERDUE:
        return "Gecikmiş";
      case FilterStatus.PENDING:
        return "Bekliyor";
      case FilterStatus.PLANNED:
      default:
        return "Planlanan";
    }
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-secondary/10 to-secondary/30 px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Bakım Takvimi
              </h1>
              <p className="text-xs text-muted-foreground">
                Filtre değişim randevularını tarih aralıklarına göre görüntüleyin.
              </p>
            </div>
          </div>

          <Card className="p-3 sm:p-4">
            <Tabs
              value={range}
              onValueChange={(v) => setRange(v as Range)}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-4 sm:w-auto">
                <TabsTrigger value="today">Bugün</TabsTrigger>
                <TabsTrigger value="7">7 Gün</TabsTrigger>
                <TabsTrigger value="30">30 Gün</TabsTrigger>
                <TabsTrigger value="all">Tümü</TabsTrigger>
              </TabsList>

              <TabsContent value={range} className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Adres
                      </TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDate(r.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{r.customerName}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {r.address}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {r.phone}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(r.status)}>
                            {statusText(r.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {filtered.length === 0 && (
                    <TableCaption>
                      Seçili tarih aralığında gösterilecek randevu bulunamadı.
                    </TableCaption>
                  )}
                </Table>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </>
  );
};

const Schedule = () => (
  <CustomerProvider>
    <ScheduleInner />
  </CustomerProvider>
);

export default Schedule;

