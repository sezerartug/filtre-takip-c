import { supabase } from "@/integrations/supabase/client";
import { Customer, FilterChange } from "@/types";
import { toast } from "sonner";
import { addMonths } from "date-fns";
import { v4 as uuidv4 } from 'uuid';

interface DbCustomer {
  id: string;
  name: string;
  surname: string;
  address: string;
  phone: string;
  purchase_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Müşteri verilerini Supabase'den getiren fonksiyon
export async function fetchCustomers(): Promise<Customer[]> {
  try {
    // Önce oturum kontrolü
    const { data: { session } } = await supabase.auth.getSession();
    
    // Oturumu kontrol et, yoksa ve localStorage'da varsa kullan
    let localUser = null;
    if (!session) {
      const storedUserJSON = localStorage.getItem('supabase.auth.token');
      if (storedUserJSON) {
        try {
          localUser = JSON.parse(storedUserJSON);
          console.log("Yerel oturum bilgisi kullanılıyor:", localUser);
        } catch (e) {
          console.error("Yerel oturum bilgisi ayrıştırılamadı:", e);
        }
      }
      
      if (!localUser) {
        console.log("Oturum açılmamış ve yerel oturum bilgisi yok.");
        toast.error('Oturum açılmamış. Lütfen giriş yapın.');
        return [];
      }
    }
    
    // Önce müşterileri getir
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (customersError) {
      toast.error('Müşteri verileri yüklenirken hata: ' + customersError.message);
      throw customersError;
    }

    if (!customersData || customersData.length === 0) {
      return [];
    }

    // Tüm müşteriler için filtre değişimlerini getir
    const customerIds = customersData.map(customer => customer.id);
    const { data: filtersData, error: filtersError } = await supabase
      .from('filter_changes')
      .select('*')
      .in('customer_id', customerIds);

    if (filtersError) {
      toast.error('Filtre verileri yüklenirken hata: ' + filtersError.message);
      throw filtersError;
    }

    // Müşteri ve filtre verilerini birleştir
    const customers: Customer[] = await Promise.all((customersData as DbCustomer[]).map(async customer => {
      // Bu müşteriye ait filtreleri bul
      const customerFilters = filtersData?.filter(
        filter => filter.customer_id === customer.id
      ) || [];
      
      // Filtreleri formatla
      const filterDates: FilterChange[] = customerFilters.map(filter => ({
        date: new Date(filter.scheduled_date),
        isChanged: filter.is_changed || false,
        changeDate: filter.change_date ? new Date(filter.change_date) : undefined,
        id: filter.id
      }));

      // Ürün bilgisini çek
      let productName = undefined;
      let productPrice = undefined;
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('customer_id', customer.id)
        .single();
      if (productData) {
        productName = productData.name;
        productPrice = productData.price;
      }

      // Müşteri nesnesini oluştur
      return {
        id: customer.id,
        name: customer.name,
        surname: customer.surname,
        address: customer.address,
        phone: customer.phone || '',
        purchaseDate: new Date(customer.purchase_date),
        filterDates: filterDates,
        productName,
        productPrice
      };
    }));

    return customers;
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return [];
  }
}

// Yeni müşteri ekleyen fonksiyon
export async function addCustomerToDb(customer: Omit<Customer, "id" | "filterDates"> & { productName: string; productPrice: number }): Promise<Customer | null> {
  try {
    // Önce kullanıcı oturum bilgilerini kontrol et
    const { data: { session } } = await supabase.auth.getSession();
    
    // Oturum yoksa yerel depolama kontrolü
    let userId = null;
    
    if (session && session.user) {
      userId = session.user.id;
      console.log("Aktif Supabase oturumu kullanılıyor, userId:", userId);
    } else {
      // Yerel depolamadan kullanıcı bilgilerini kontrol et
      const storedUserJSON = localStorage.getItem('auth_user');
      if (storedUserJSON) {
        try {
          const localUser = JSON.parse(storedUserJSON);
          userId = localUser.id;
          console.log("Yerel depolamadan alınan userId:", userId);
        } catch (e) {
          console.error("Yerel kullanıcı bilgisi ayrıştırılamadı:", e);
        }
      }
    }
    
    if (!userId) {
      console.error("Kullanıcı kimliği bulunamadı. Oturum açılmamış olabilir.");
      toast.error('Oturum açılmamış. Lütfen giriş yapın.');
      return null;
    }

    const newCustomerId = uuidv4();
    
    console.log("Eklenen müşteri detayları:", {
      ...customer,
      userId: userId,
      customerId: newCustomerId
    });
    
    // Müşteri kaydını oluştur
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert({
        id: newCustomerId,
        name: customer.name,
        surname: customer.surname,
        address: customer.address,
        phone: customer.phone,
        purchase_date: customer.purchaseDate.toISOString(),
        user_id: userId
      })
      .select()
      .single();

    if (customerError) {
      console.error("Müşteri ekleme hatası detayı:", customerError);
      toast.error('Müşteri eklenirken hata: ' + customerError.message);
      return null;
    }

    if (!customerData) {
      console.error("Müşteri verisi dönmedi");
      toast.error('Müşteri eklenirken bir hata oluştu');
      return null;
    }

    // Ürün bilgisini products tablosuna ekle
    const { error: productError } = await supabase
      .from('products')
      .insert({
        id: uuidv4(),
        name: customer.productName,
        price: customer.productPrice,
        customer_id: newCustomerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (productError) {
      console.error("Ürün eklenirken hata detayı:", productError);
      toast.error('Ürün eklenirken hata: ' + productError.message);
      // müşteri eklendi ama ürün eklenemedi, yine de devam et
    }

    // Filtre değişim tarihlerini oluştur
    const filterDates: FilterChange[] = [];
    const filterInserts = [];
    
    // Satın alma tarihinden başlayarak bugüne kadar olan (gecikmiş) ve bugünden sonra ilk gelen (planlanan) filtre tarihlerini oluştur
    let currentDate = new Date(customer.purchaseDate);
    const today = new Date();
    let planlananEklendi = false;
    let i = 0;
    while (true) {
      currentDate = addMonths(customer.purchaseDate, (i + 1) * 6);
      if (currentDate < today) {
        // Geciken filtre
        const filterId = uuidv4();
        filterDates.push({
          id: filterId,
          date: currentDate,
          isChanged: false
        });
        filterInserts.push({
          id: filterId,
          customer_id: newCustomerId,
          scheduled_date: currentDate.toISOString(),
          is_changed: false
        });
      } else if (!planlananEklendi) {
        // İlk planlanan filtre (bugünden sonraki ilk tarih)
        const filterId = uuidv4();
        filterDates.push({
          id: filterId,
          date: currentDate,
          isChanged: false
        });
        filterInserts.push({
          id: filterId,
          customer_id: newCustomerId,
          scheduled_date: currentDate.toISOString(),
          is_changed: false
        });
        planlananEklendi = true;
        break;
      } else {
        break;
      }
      i++;
    }

    // Filtre değişimlerini ekle
    if (filterInserts.length > 0) {
      const { error: filtersError } = await supabase
        .from('filter_changes')
        .insert(filterInserts);

      if (filtersError) {
        console.error("Filtre planları eklenirken hata detayı:", filtersError);
        toast.error('Filtre planları eklenirken hata: ' + filtersError.message);
        return null;
      }
    }

    // Yeni oluşturulan müşteriyi döndür
    return {
      id: newCustomerId,
      ...customer,
      filterDates
    };
  } catch (error) {
    console.error('Müşteri ekleme hatası:', error);
    toast.error('Müşteri eklenirken bir hata oluştu');
    return null;
  }
}

// Müşteri bilgilerini güncelleyen fonksiyon
export async function updateCustomerInDb(customer: Customer): Promise<boolean> {
  try {
    // Müşteri bilgilerini güncelle
    const { error: customerError } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        surname: customer.surname,
        address: customer.address,
        phone: customer.phone,
        purchase_date: customer.purchaseDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (customerError) {
      toast.error('Müşteri güncellenirken hata: ' + customerError.message);
      return false;
    }

    // Filtre değişimlerini güncelle
    for (const filter of customer.filterDates) {
      if (filter.id) {
        // Var olan filtreyi güncelle
        const { error: filterError } = await supabase
          .from('filter_changes')
          .update({
            scheduled_date: filter.date.toISOString(),
            is_changed: filter.isChanged,
            change_date: filter.changeDate ? filter.changeDate.toISOString() : null
          })
          .eq('id', filter.id);

        if (filterError) {
          toast.error('Filtre güncellenirken hata: ' + filterError.message);
          return false;
        }
      } else {
        // Yeni filtre ekle
        const filterId = uuidv4();
        const { error: newFilterError } = await supabase
          .from('filter_changes')
          .insert({
            id: filterId,
            customer_id: customer.id,
            scheduled_date: filter.date.toISOString(),
            is_changed: filter.isChanged,
            change_date: filter.changeDate ? filter.changeDate.toISOString() : null
          });

        if (newFilterError) {
          toast.error('Yeni filtre eklenirken hata: ' + newFilterError.message);
          return false;
        }
        
        // Filtre ID'sini güncelle
        filter.id = filterId;
      }
    }

    return true;
  } catch (error) {
    console.error('Müşteri güncelleme hatası:', error);
    return false;
  }
}

// Müşteri silen fonksiyon
export async function deleteCustomerFromDb(customerId: string): Promise<boolean> {
  try {
    // Önce ürün bilgilerini sil
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('customer_id', customerId);

    if (productError) {
      console.error("Ürün silme hatası:", productError);
      toast.error('Ürün bilgileri silinirken hata: ' + productError.message);
      return false;
    }

    // Sonra müşteriyi sil
    const { error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (customerError) {
      console.error("Müşteri silme hatası:", customerError);
      toast.error('Müşteri silinirken hata: ' + customerError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Müşteri silme hatası:', error);
    return false;
  }
}

// Filtre değişimini güncelleyen fonksiyon
export async function markFilterChangedInDb(filterId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('filter_changes')
      .update({
        is_changed: true,
        change_date: new Date().toISOString()
      })
      .eq('id', filterId);

    if (error) {
      toast.error('Filtre değişimi kaydedilirken hata: ' + error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Filtre değişimi güncellenirken hata:', error);
    return false;
  }
}

// Tek bir müşteriyi ID'ye göre getiren fonksiyon
export async function fetchCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) {
      toast.error('Müşteri verisi yüklenirken hata: ' + customerError.message);
      throw customerError;
    }

    if (!customerData) {
      return null;
    }

    // Müşterinin filtre değişimlerini getir
    const { data: filtersData, error: filtersError } = await supabase
      .from('filter_changes')
      .select('*')
      .eq('customer_id', customerId);

    if (filtersError) {
      toast.error('Filtre verileri yüklenirken hata: ' + filtersError.message);
      throw filtersError;
    }

    // Müşterinin ürün bilgilerini getir
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (productError && productError.code !== 'PGRST116') { // PGRST116: no rows returned
      toast.error('Ürün verileri yüklenirken hata: ' + productError.message);
      throw productError;
    }

    // Customer tipine dönüştür
    const customer: Customer = {
      id: customerData.id,
      name: customerData.name,
      surname: customerData.surname,
      address: customerData.address,
      phone: customerData.phone,
      purchaseDate: new Date(customerData.purchase_date),
      filterDates: filtersData.map(filter => ({
        id: filter.id,
        date: new Date(filter.scheduled_date),
        isChanged: filter.is_changed,
        changeDate: filter.change_date ? new Date(filter.change_date) : undefined
      })),
      productName: productData?.name || '',
      productPrice: productData?.price || 0
    };

    return customer;
  } catch (error) {
    console.error('Müşteri getirme hatası:', error);
    return null;
  }
}
