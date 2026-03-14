import React from "react";
import { Customer, FilterStatus } from "@/types";
import { useCustomers } from "@/context/CustomerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  formatDate, 
  getStatusIcon, 
  getStatusText,
  getStatusColor,
  getStatusBgColor 
} from "@/utils/helpers";
import { Edit, Trash, Check, Calendar, Clock, MapPin, CreditCard, Filter } from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onNameClick?: (customer: Customer) => void;
  onOpenFilters?: (customer: Customer) => void;
  onOpenPayments?: (customer: Customer) => void;
  overdueDays?: number;
}

const CustomerCard = ({
  customer,
  onEdit,
  onDelete,
  onNameClick,
  onOpenFilters,
  onOpenPayments,
  overdueDays,
}: CustomerCardProps) => {
  const { getFilterStatus, getNextFilterChange } = useCustomers();
  
  const nextFilter = getNextFilterChange(customer);
  const nextFilterStatus = nextFilter ? getFilterStatus(nextFilter) : null;
  
  // Find the last changed filter
  const lastChangedFilter = [...customer.filterDates]
    .filter(filter => filter.isChanged)
    .sort((a, b) => {
      if (a.changeDate && b.changeDate) {
        return b.changeDate.getTime() - a.changeDate.getTime();
      }
      return 0;
    })[0];
  
  const isOverdue = nextFilterStatus === FilterStatus.OVERDUE || (typeof overdueDays === "number" && overdueDays > 0);

  const cardAccent =
    isOverdue
      ? "border-red-500/40 shadow-[0_0_0_1px_rgba(248,113,113,0.3)] bg-red-50/60 dark:bg-red-950/40"
      : nextFilterStatus === FilterStatus.COMPLETED
      ? "border-emerald-500/40 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]"
      : nextFilterStatus === FilterStatus.PLANNED
      ? "border-amber-500/40 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]"
      : "border-border/60 shadow-sm";

  const stripAccent =
    isOverdue
      ? "from-red-500 via-red-400 to-red-300"
      : nextFilterStatus === FilterStatus.COMPLETED
      ? "from-emerald-500 via-emerald-400 to-emerald-300"
      : nextFilterStatus === FilterStatus.PLANNED
      ? "from-amber-500 via-amber-400 to-amber-300"
      : "from-sky-500 via-primary to-violet-500";

  return (
    <Card className={`overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm transition-transform duration-150 hover:-translate-y-[1px] ${cardAccent}`}>
      <CardContent className="p-0">
        {/* Üst şerit */}
        <div className={`h-1 bg-gradient-to-r ${stripAccent}`} />

        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {/* Başlık + aksiyonlar + durum */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <button
                className="text-base sm:text-lg font-semibold text-left bg-transparent border-0 p-0 m-0 cursor-pointer hover:text-primary transition-colors"
                style={{ background: "none" }}
                onClick={() => onNameClick && onNameClick(customer)}
                type="button"
              >
                {customer.name} {customer.surname}
              </button>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
                <span className="truncate">{customer.address}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
                <span className="inline-block w-3 mr-1.5 text-muted-foreground/70">
                  📞
                </span>
                {customer.phone}
              </p>
            </div>

            <div className="flex items-start gap-2 sm:flex-col sm:items-end sm:gap-1">
              {nextFilterStatus && (
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${getStatusBgColor(
                    nextFilterStatus
                  )} ${getStatusColor(nextFilterStatus)}`}
                >
                  {getStatusIcon(nextFilterStatus)} {getStatusText(nextFilterStatus)}
                </div>
              )}
              <div className="flex gap-1 rounded-full bg-muted/60 px-0.5 py-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(customer)}
                  className="h-7 w-7 rounded-full hover:bg-background/60 hover:text-primary"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(customer)}
                  className="h-7 w-7 rounded-full hover:bg-background/60 hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenFilters && onOpenFilters(customer)}
                  className="h-7 w-7 rounded-full hover:bg-background/60"
                  title="Filtre bilgileri"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenPayments && onOpenPayments(customer)}
                  className="h-7 w-7 rounded-full hover:bg-background/60"
                  title="Ödemeler"
                >
                  <CreditCard className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tarih bilgileri */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="rounded-xl bg-secondary/40 px-3 py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                Satın alma
              </span>
              <span className="font-medium">
                {formatDate(customer.purchaseDate)}
              </span>
            </div>

            <div className="rounded-xl bg-secondary/40 px-3 py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                Son değişim
              </span>
              <span className="font-medium">
                {lastChangedFilter?.changeDate
                  ? formatDate(lastChangedFilter.changeDate)
                  : "-"}
              </span>
            </div>

            <div className="rounded-xl bg-secondary/40 px-3 py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                Sonraki değişim
              </span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-medium">
                  {nextFilter ? formatDate(nextFilter.date) : "-"}
                </span>
                {typeof overdueDays === "number" && overdueDays > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                    {overdueDays} gün gecikmiş
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
