export interface FilterChange {
  date: Date;
  isChanged: boolean;
  changeDate?: Date;
  id?: string;  // Veritabanı ID'si ekliyoruz
}

export interface Customer {
  id: string;
  name: string;
  surname: string;
  address: string;
  phone: string;
  purchaseDate: Date;
  filterDates: FilterChange[];
  productName?: string;
  productPrice?: number;
}

export enum FilterStatus {
  PLANNED = "PLANNED",
  PENDING = "PENDING",
  OVERDUE = "OVERDUE",
  COMPLETED = "COMPLETED"
}
