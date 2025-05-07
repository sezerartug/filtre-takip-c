
import { FilterStatus } from "../types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const formatDate = (date: Date): string => {
  return format(date, 'dd MMMM yyyy', { locale: tr });
};

export const getStatusIcon = (status: FilterStatus): string => {
  switch (status) {
    case FilterStatus.COMPLETED:
      return '✅';
    case FilterStatus.PLANNED:
      return '🔵';
    case FilterStatus.PENDING:
      return '🟠';
    case FilterStatus.OVERDUE:
      return '🔴';
    default:
      return '';
  }
};

export const getStatusText = (status: FilterStatus): string => {
  switch (status) {
    case FilterStatus.COMPLETED:
      return 'Tamamlandı';
    case FilterStatus.PLANNED:
      return 'Planlanan';
    case FilterStatus.PENDING:
      return 'Bekliyor';
    case FilterStatus.OVERDUE:
      return 'Gecikmiş';
    default:
      return '';
  }
};

export const getStatusColor = (status: FilterStatus): string => {
  switch (status) {
    case FilterStatus.COMPLETED:
      return 'text-status-completed';
    case FilterStatus.PLANNED:
      return 'text-status-planned';
    case FilterStatus.PENDING:
      return 'text-status-pending';
    case FilterStatus.OVERDUE:
      return 'text-status-overdue';
    default:
      return '';
  }
};

export const getStatusBgColor = (status: FilterStatus): string => {
  switch (status) {
    case FilterStatus.COMPLETED:
      return 'bg-status-completed/10';
    case FilterStatus.PLANNED:
      return 'bg-status-planned/10';
    case FilterStatus.PENDING:
      return 'bg-status-pending/10';
    case FilterStatus.OVERDUE:
      return 'bg-status-overdue/10';
    default:
      return '';
  }
};
