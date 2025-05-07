
import React, { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Customer } from "@/types";

interface CapacitorAppProps {
  children: React.ReactNode;
}

const CapacitorApp: React.FC<CapacitorAppProps> = ({ children }) => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return <>{children}</>;
};

// Function to share PDF on native platforms
export const sharePdf = async (pdfBase64: string, fileName: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Not running on native platform");
    return;
  }

  try {
    // First save the PDF to device
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: pdfBase64,
      directory: Directory.Cache,
    });

    // Then share it
    await Share.share({
      title: "Su Arıtma Filtre Takip Raporu",
      text: "Su arıtma cihazı filtre takip raporunu görüntüle.",
      url: savedFile.uri,
      dialogTitle: "Raporu Paylaş",
    });
  } catch (error) {
    console.error("Error sharing PDF:", error);
  }
};

export default CapacitorApp;
