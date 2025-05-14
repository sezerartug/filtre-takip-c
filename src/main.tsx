
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Uygulama başladığında konsola bilgi yazdır
console.log("Uygulama başlatılıyor - ", new Date().toISOString());

createRoot(document.getElementById("root")!).render(<App />);
