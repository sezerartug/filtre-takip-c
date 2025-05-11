
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
  try {
    // Türkçe karakterli fontları ekleyin
    const doc = new jsPDF();
    
    // Add document title
    doc.setFontSize(20);
    doc.text("Su Arıtma Cihazı Filtre Takip", 14, 22);
    
    doc.setFontSize(10);
    const date = format(new Date(), "dd MMMM yyyy", { locale: tr });
    doc.text(`Oluşturulma Tarihi: ${date}`, 14, 30);
    
    // Müşteri bilgilerinin tablo formatında gösterimi
    // Tablo başlıkları
    // Use autoTable
    if (doc.autoTable) {
      // Müşteri listesi tablosu
      doc.autoTable({
        startY: 40,
        head: [["Ad Soyad", "Adres", "Satın Alma", "Sonraki Filtre", "Durum"]],
        body: customers.map(customer => {
          const nextFilter = customer.filterDates.find(filter => !filter.isChanged);
          const status = nextFilter ? getFilterStatus(nextFilter) : undefined;
          
          return [
            `${customer.name} ${customer.surname}`,
            customer.address,
            formatDate(customer.purchaseDate),
            nextFilter ? formatDate(nextFilter.date) : "-",
            status ? getStatusText(status) : "-"
          ];
        }),
        headStyles: { 
          fillColor: [0, 123, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { 
          font: "helvetica", 
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 40 },
        columnStyles: {
          0: { cellWidth: 40 }, // Ad Soyad
          1: { cellWidth: 60 }, // Adres
          2: { cellWidth: 30 }, // Satın Alma
          3: { cellWidth: 30 }, // Sonraki Filtre
          4: { cellWidth: 25 }  // Durum
        },
        didDrawPage: function(data) {
          // Sayfa numarası
          const str = `Sayfa ${data.pageNumber} / ${doc.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.text(str, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { 
            align: 'center' 
          });
        }
      });
      
      // Her bir müşteri için detaylı filtre tablosu ekleyin
      let yPosition = doc.autoTable.previous.finalY + 15;
      
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        
        // Yeni sayfaya geçme kontrolü
        if (yPosition > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Müşteri adı başlığı
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${customer.name} ${customer.surname} - Filtre Detayları`, 14, yPosition);
        yPosition += 5;
        
        // Filtre detayları tablosu
        doc.autoTable({
          startY: yPosition,
          head: [["No", "Planlanan Tarih", "Durum", "Değişim Tarihi"]],
          body: customer.filterDates.map((filter, index) => {
            const status = getFilterStatus(filter);
            return [
              `${index + 1}`,
              formatDate(filter.date),
              getStatusText(status),
              filter.changeDate ? formatDate(filter.changeDate) : "-"
            ];
          }),
          headStyles: { 
            fillColor: [100, 100, 100],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: { fontSize: 8 },
          tableWidth: 'auto',
          margin: { left: 14 },
          columnStyles: {
            0: { cellWidth: 15 }, // No
            1: { cellWidth: 40 }, // Planlanan Tarih
            2: { cellWidth: 30 }, // Durum
            3: { cellWidth: 40 }  // Değişim Tarihi
          }
        });
        
        yPosition = doc.autoTable.previous.finalY + 15;
      }
    } else {
      console.error("autoTable fonksiyonu bulunamadı");
    }
    
    // Save the PDF
    doc.save("su-aritma-filtre-takip.pdf");
  } catch (error) {
    console.error("PDF oluşturma hatası:", error);
    throw error;
  }
};
