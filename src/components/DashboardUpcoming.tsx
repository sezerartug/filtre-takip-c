import { addDays, isAfter, isBefore, startOfDay } from "date-fns";
import { useCustomers } from "@/context/CustomerContext";
import { formatDate } from "@/utils/helpers";

const DashboardUpcoming = () => {
  const { customers } = useCustomers();

  const today = startOfDay(new Date());
  const in7Days = startOfDay(addDays(today, 7));
  const in30Days = startOfDay(addDays(today, 30));

  let overdueCount = 0;
  let next7Days: { name: string; date: Date }[] = [];
  let next30Days = 0;

  customers.forEach((customer) => {
    customer.filterDates.forEach((filter) => {
      const d = startOfDay(new Date(filter.date));
      if (filter.isChanged) return;

      if (isBefore(d, today)) {
        overdueCount += 1;
      } else if (!isAfter(d, in7Days)) {
        next7Days.push({
          name: `${customer.name} ${customer.surname}`,
          date: d,
        });
        next30Days += 1;
      } else if (!isAfter(d, in30Days)) {
        next30Days += 1;
      }
    });
  });

  next7Days = next7Days
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="grid gap-3 md:grid-cols-3 mb-4">
      <div className="rounded-xl border bg-card p-3 text-sm">
        <p className="text-xs text-muted-foreground mb-1">
          Önümüzdeki 7 gün
        </p>
        <p className="text-2xl font-semibold">
          {next7Days.length}
        </p>
        <p className="text-xs text-muted-foreground">
          planlanan filtre değişimi
        </p>
      </div>
      <div className="rounded-xl border bg-card p-3 text-sm">
        <p className="text-xs text-muted-foreground mb-1">
          Önümüzdeki 30 gün
        </p>
        <p className="text-2xl font-semibold">
          {next30Days}
        </p>
        <p className="text-xs text-muted-foreground">
          toplam planlanan değişim
        </p>
      </div>
      <div className="rounded-xl border bg-card p-3 text-sm">
        <p className="text-xs text-muted-foreground mb-1">
          Geciken filtreler
        </p>
        <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
          {overdueCount}
        </p>
        <p className="text-xs text-muted-foreground">
          hemen aksiyon alınması gereken
        </p>
      </div>

      {next7Days.length > 0 && (
        <div className="md:col-span-3 rounded-xl border bg-card p-3 text-xs mt-1">
          <p className="text-[11px] text-muted-foreground mb-2">
            Önümüzdeki 7 günde öne çıkan müşteriler
          </p>
          <div className="flex flex-wrap gap-2">
            {next7Days.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  {formatDate(item.date)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardUpcoming;

