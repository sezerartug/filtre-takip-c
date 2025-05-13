
import React, { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { toast } from "sonner";
import { Customer } from "@/types";

interface CapacitorAppProps {
  children: React.ReactNode;
}

const CapacitorApp: React.FC<CapacitorAppProps> = ({ children }) => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
    
    if (isNativePlatform) {
      // Mobil uygulama olarak çalışıyorsa bildirim göster
      setTimeout(() => {
        toast.info("Mobil uygulama modunda çalışıyor", {
          description: "Tüm fonksiyonlar yerel olarak kullanılabilir",
          duration: 4000,
        });
      }, 1500);
    }
  }, []);

  return (
    <>
      {isNative && (
        <div className="fixed bottom-4 left-4 z-50 bg-primary text-primary-foreground rounded-full text-xs px-2 py-1 opacity-70">
          Mobil Uygulama
        </div>
      )}
      {children}
    </>
  );
};

// PDF'i mobil platformlarda paylaşma fonksiyonu
export const sharePdf = async (pdfBase64: string, fileName: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Yerel platformda çalışmıyor");
    return;
  }

  try {
    // Önce PDF'i cihaza kaydet
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: pdfBase64,
      directory: Directory.Cache,
    });

    // Sonra paylaş
    await Share.share({
      title: "Su Arıtma Filtre Takip Raporu",
      text: "Su arıtma cihazı filtre takip raporunu görüntüle.",
      url: savedFile.uri,
      dialogTitle: "Raporu Paylaş",
    });
    
    toast.success("PDF başarıyla paylaşıldı");
  } catch (error) {
    console.error("PDF paylaşırken hata:", error);
    toast.error("PDF paylaşılırken bir hata oluştu");
  }
};

export default CapacitorApp;
