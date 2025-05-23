import { Customer } from "@/types";
import { utils, writeFile } from "xlsx";

export const exportToExcel = (customers: Customer[]) => {
  // Ana müşteri tablosu
  const data = customers.map((customer) => ({
    "Ad": customer.name,
    "Soyad": customer.surname,
    "Adres": customer.address,
    "Satın Alma Tarihi": customer.purchaseDate.toLocaleDateString("tr-TR"),
  }));

  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Müşteriler");

  // Her müşteri için filtre detaylarını ayrı bir sheet olarak ekle
  customers.forEach((customer) => {
    if (customer.filterDates && customer.filterDates.length > 0) {
      const filterData = customer.filterDates.map((filter, i) => ({
        "No": i + 1,
        "Planlanan Tarih": filter.date.toLocaleDateString("tr-TR"),
        "Durum": filter.isChanged ? "Değişti" : "Bekliyor",
        "Değişim Tarihi": filter.changeDate ? filter.changeDate.toLocaleDateString("tr-TR") : "-",
      }));
      const wsFilter = utils.json_to_sheet(filterData);
      utils.book_append_sheet(wb, wsFilter, `${customer.name}_${customer.surname}`.slice(0, 31));
    }
  });

  writeFile(wb, "musteri-listesi.xlsx");
}; 