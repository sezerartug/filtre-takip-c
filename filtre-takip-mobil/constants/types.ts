export interface FilterChange {
  date: string; // Mobilde string olarak tutmak daha kolay
  isChanged: boolean;
  changeDate?: string;
  id?: string;
}

export interface Customer {
  id: string;
  name: string;
  surname: string;
  address: string;
  purchaseDate: string;
  filterDates: FilterChange[];
} 