
import { Customer, FilterStatus } from "@/types";
import { formatDate, getStatusText } from "./helpers";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Type declaration for jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Helper function to determine filter status
const getFilterStatus = (filterChange: { date: Date; isChanged: boolean; changeDate?: Date }): FilterStatus => {
  const today = new Date();
  const filterDate = new Date(filterChange.date);
  
  if (filterChange.isChanged) {
    return FilterStatus.COMPLETED;
  }
  
  // 7 days before the filter change date
  const pendingDate = new Date(filterDate);
  pendingDate.setDate(pendingDate.getDate() - 7);
  
  if (isAfter(today, filterDate)) {
    return FilterStatus.OVERDUE;
  } else if (isAfter(today, pendingDate)) {
    return FilterStatus.PENDING;
  } else {
    return FilterStatus.PLANNED;
  }
};

// Helper function to determine if a date is after another
const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

export const exportToPDF = (customers: Customer[]) => {
  const doc = new jsPDF();

  // Add document title
  doc.setFontSize(20);
  doc.text("Su Arıtma Cihazı Filtre Takip", 14, 22);
  
  doc.setFontSize(10);
  const date = format(new Date(), "dd MMMM yyyy", { locale: tr });
  doc.text(`Oluşturulma Tarihi: ${date}`, 14, 30);
  
  // Customer list table
  const customersTableData = customers.map(customer => {
    const nextFilter = customer.filterDates.find(filter => !filter.isChanged);
    const status = nextFilter ? getFilterStatus(nextFilter) : undefined;
    
    return [
      `${customer.name} ${customer.surname}`,
      customer.address,
      formatDate(customer.purchaseDate),
      nextFilter ? formatDate(nextFilter.date) : "-",
      status ? getStatusText(status) : "-"
    ];
  });
  
  doc.autoTable({
    startY: 40,
    head: [["Müşteri", "Adres", "Satın Alma", "Sonraki Filtre", "Durum"]],
    body: customersTableData,
    headStyles: { fillColor: [0, 123, 255] },
    styles: { font: "helvetica", fontSize: 8 },
    margin: { top: 40 }
  });
  
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageSize = doc.internal.pageSize;
    const pageWidth = pageSize.getWidth();
    const pageHeight = pageSize.getHeight();
    
    // Footer with page numbers
    doc.setFontSize(8);
    doc.text(
      `Sayfa ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  doc.save("su-aritma-filtre-takip.pdf");
};
