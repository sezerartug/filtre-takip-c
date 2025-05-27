import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Customer, FilterChange } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { fetchCustomerById, updateCustomerInDb, markFilterChangedInDb } from "@/services/customerService";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, Phone, MapPin, User, Package } from "lucide-react";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleFilterChange = async () => {
    if (!selectedDate || !customer) return;

    try {
      // Seçilen tarihe en yakın filtre değişimini bul
      const targetFilter = customer.filterDates.find(filter => {
        const filterDate = new Date(filter.date);
        const selectedDateObj = new Date(selectedDate);
        return filterDate.getTime() === selectedDateObj.getTime();
      });

      if (!targetFilter) {
        toast.error('Seçilen tarih için filtre değişimi bulunamadı');
        return;
      }

      if (targetFilter.isChanged) {
        toast.error('Bu filtre zaten değiştirilmiş');
        return;
      }

      // Filtre değişimini kaydet
      const success = await markFilterChangedInDb(targetFilter.id);
      
      if (success) {
        toast.success('Filtre değişimi başarıyla kaydedildi');
        // Müşteri bilgilerini yenile
        const updatedCustomer = await fetchCustomerById(customer.id);
        if (updatedCustomer) {
          setCustomer(updatedCustomer);
        }
      }
    } catch (error) {
      console.error('Filtre değişimi hatası:', error);
      toast.error('Filtre değişimi kaydedilirken bir hata oluştu');
    }
  };

  const renderCustomerInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Müşteri Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Ad Soyad</p>
            <p className="text-sm text-muted-foreground">{customer?.name} {customer?.surname}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Telefon</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {customer?.phone}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Adres</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {customer?.address}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Satın Alma Tarihi</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(new Date(customer?.purchaseDate || ''), 'dd MMMM yyyy', { locale: tr })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderProductInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Ürün Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Ürün Adı</p>
              <p className="text-sm text-muted-foreground">{customer?.productName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Ürün Fiyatı</p>
              <p className="text-sm text-muted-foreground">{customer?.productPrice} TL</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle>Özet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Toplam Filtre Değişimi</p>
              <p className="text-sm text-muted-foreground">
                {customer?.filterDates.filter(f => f.isChanged).length} / {customer?.filterDates.length}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Son Filtre Değişimi</p>
              <p className="text-sm text-muted-foreground">
                {customer?.filterDates.find(f => f.isChanged)?.changeDate 
                  ? format(new Date(customer.filterDates.find(f => f.isChanged)?.changeDate || ''), 'dd MMMM yyyy', { locale: tr })
                  : 'Henüz değişim yapılmadı'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!customer) {
    return <div>Müşteri bulunamadı</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold break-words text-left w-full sm:w-auto">{customer.name} {customer.surname}</h1>
      </div>

      <Tabs defaultValue="info" className="space-y-2 sm:space-y-4">
        <TabsList className="w-full flex flex-col sm:flex-row gap-2">
          <TabsTrigger value="info" className="flex-1">Müşteri Bilgileri</TabsTrigger>
          <TabsTrigger value="filters" className="flex-1">Filtre Değişimleri</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <div className="space-y-2 sm:space-y-4">
            {renderCustomerInfo()}
            {renderProductInfo()}
            {renderSummary()}
          </div>
        </TabsContent>
        <TabsContent value="filters">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Filtre Değişim Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-4">
                {customer.filterDates.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 border rounded-lg gap-1 sm:gap-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm sm:text-base">
                        {format(new Date(filter.date), 'dd MMMM yyyy', { locale: tr })}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {filter.isChanged
                          ? `Değişim Tarihi: ${format(new Date(filter.changeDate || ''), 'dd MMMM yyyy', { locale: tr })}`
                          : 'Henüz değişim yapılmadı'}
                      </p>
                    </div>
                    <Badge variant={filter.isChanged ? "default" : "secondary"} className="mt-1 sm:mt-0">
                      {filter.isChanged ? "Değiştirildi" : "Bekliyor"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail; 