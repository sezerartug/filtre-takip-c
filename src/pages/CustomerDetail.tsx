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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        <h1 className="text-2xl font-bold">{customer.name} {customer.surname}</h1>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Müşteri Bilgileri</TabsTrigger>
          <TabsTrigger value="filters">Filtre Değişimleri</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          {renderCustomerInfo()}
          {renderProductInfo()}
          {renderSummary()}
        </TabsContent>
        <TabsContent value="filters">
          <Card>
            <CardHeader>
              <CardTitle>Filtre Değişim Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.filterDates.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {format(new Date(filter.date), 'dd MMMM yyyy', { locale: tr })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {filter.isChanged
                          ? `Değişim Tarihi: ${format(new Date(filter.changeDate || ''), 'dd MMMM yyyy', { locale: tr })}`
                          : 'Henüz değişim yapılmadı'}
                      </p>
                    </div>
                    <Badge variant={filter.isChanged ? "default" : "secondary"}>
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