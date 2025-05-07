
export interface FilterChange {
  date: Date;
  isChanged: boolean;
  changeDate?: Date;
}

export interface Customer {
  id: string;
  name: string;
  surname: string;
  address: string;
  purchaseDate: Date;
  filterDates: FilterChange[];
}

export enum FilterStatus {
  PLANNED = "PLANNED",
  PENDING = "PENDING",
  OVERDUE = "OVERDUE",
  COMPLETED = "COMPLETED"
}
