
import { supabase } from "@/integrations/supabase/client";
import { Customer, FilterChange } from "@/types";
import { toast } from "sonner";
import { addMonths } from "date-fns";
import { v4 as uuidv4 } from 'uuid';

// Müşteri verilerini Supabase'den getiren fonksiyon
export async function fetchCustomers(): Promise<Customer[]> {
  try {
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
    const customers: Customer[] = customersData.map(customer => {
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

      // Müşteri nesnesini oluştur
      return {
        id: customer.id,
        name: customer.name,
        surname: customer.surname,
        address: customer.address,
        purchaseDate: new Date(customer.purchase_date),
        filterDates: filterDates
      };
    });

    return customers;
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return [];
  }
}

// Yeni müşteri ekleyen fonksiyon
export async function addCustomerToDb(customer: Omit<Customer, "id" | "filterDates">): Promise<Customer | null> {
  try {
    const newCustomerId = uuidv4();
    
    // Müşteri kaydını oluştur
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        id: newCustomerId,
        name: customer.name,
        surname: customer.surname,
        address: customer.address,
        purchase_date: customer.purchaseDate.toISOString()
      });

    if (customerError) {
      toast.error('Müşteri eklenirken hata: ' + customerError.message);
      throw customerError;
    }

    // Filtre değişim tarihlerini oluştur
    const filterDates: FilterChange[] = [];
    const filterInserts = [];
    
    // 10 filtre değişim planı oluştur
    for (let i = 0; i < 10; i++) {
      const scheduledDate = addMonths(customer.purchaseDate, (i + 1) * 6);
      const filterId = uuidv4();
      
      // Filtre nesnesi
      filterDates.push({
        id: filterId,
        date: scheduledDate,
        isChanged: false
      });
      
      // Veritabanına eklemek için hazırla
      filterInserts.push({
        id: filterId,
        customer_id: newCustomerId,
        scheduled_date: scheduledDate.toISOString(),
        is_changed: false
      });
    }

    // Filtre değişimlerini ekle
    if (filterInserts.length > 0) {
      const { error: filtersError } = await supabase
        .from('filter_changes')
        .insert(filterInserts);

      if (filtersError) {
        toast.error('Filtre planları eklenirken hata: ' + filtersError.message);
        throw filtersError;
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
    // Cascade delete olduğu için sadece müşteriyi silmek yeterli
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      toast.error('Müşteri silinirken hata: ' + error.message);
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
