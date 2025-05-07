
import { Customer, FilterStatus } from "@/types";
import { getFilterStatus } from "@/context/CustomerContext";
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
