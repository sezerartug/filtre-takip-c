
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Customer, FilterChange, FilterStatus } from '../types';
import { format, addMonths, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchCustomers, 
  addCustomerToDb, 
  updateCustomerInDb, 
  deleteCustomerFromDb,
  markFilterChangedInDb
} from '@/services/customerService';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'filterDates'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  markFilterChanged: (customerId: string, filterIndex: number) => void;
  getFilterStatus: (filterDate: FilterChange) => FilterStatus;
  getNextFilterChange: (customer: Customer) => FilterChange | null;
  searchCustomers: (query: string) => Customer[];
  filteredCustomers: Customer[];
  setFilteredCustomers: (customers: Customer[]) => void;
  isLoading: boolean;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider = ({ children }: CustomerProviderProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase'den verileri yükleme
  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // Oturum kontrolü
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Kullanıcı oturumu açık değil');
        setIsLoading(false);
        return;
      }
      
      const customersData = await fetchCustomers();
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      
      // Eğer mobil cihazda çalışıyorsa bildirim göster
      if (Capacitor.isNativePlatform()) {
        toast.info(`${customersData.length} müşteri yüklendi`, { 
          duration: 3000 
        });
      }
    } catch (error) {
      console.error('Müşteri verileri yüklenirken hata:', error);
      toast.error('Müşteri verileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadCustomers();
      } else if (event === 'SIGNED_OUT') {
        setCustomers([]);
        setFilteredCustomers([]);
      }
    });

    // Başlangıçta mevcut oturumu kontrol et ve verileri yükle
    loadCustomers();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Müşteri verilerini yenileme fonksiyonu
  const refreshCustomers = async () => {
    await loadCustomers();
  };

  // Yeni müşteri ekleme
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'filterDates'>) => {
    const newCustomer = await addCustomerToDb(customerData);
    
    if (newCustomer) {
      setCustomers(prev => [...prev, newCustomer]);
      setFilteredCustomers(prev => [...prev, newCustomer]);
      toast.success('Müşteri başarıyla eklendi');
    } else {
      toast.error('Müşteri eklenirken bir hata oluştu');
    }
  };

  // Müşteri bilgilerini güncelleme
  const updateCustomer = async (updatedCustomer: Customer) => {
    const success = await updateCustomerInDb(updatedCustomer);
    
    if (success) {
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === updatedCustomer.id ? updatedCustomer : customer
        )
      );
      setFilteredCustomers(prev => 
        prev.map(customer => 
          customer.id === updatedCustomer.id ? updatedCustomer : customer
        )
      );
      toast.success('Müşteri bilgileri güncellendi');
    } else {
      toast.error('Müşteri güncellenirken bir hata oluştu');
    }
  };

  // Müşteri silme
  const deleteCustomer = async (id: string) => {
    const success = await deleteCustomerFromDb(id);
    
    if (success) {
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      setFilteredCustomers(prev => prev.filter(customer => customer.id !== id));
      toast.success('Müşteri silindi');
    } else {
      toast.error('Müşteri silinirken bir hata oluştu');
    }
  };

  // Filtre değişimi kaydetme
  const markFilterChanged = async (customerId: string, filterIndex: number) => {
    // Önce müşteriyi bul
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Filtre değişimini güncelle
    const filter = customer.filterDates[filterIndex];
    if (!filter || !filter.id) return;
    
    // Veritabanında güncelle
    const success = await markFilterChangedInDb(filter.id);
    
    if (success) {
      // Belleği güncelle
      setCustomers(prev => 
        prev.map(c => {
          if (c.id === customerId) {
            const updatedFilterDates = [...c.filterDates];
            updatedFilterDates[filterIndex] = {
              ...updatedFilterDates[filterIndex],
              isChanged: true,
              changeDate: new Date(),
            };
            return { ...c, filterDates: updatedFilterDates };
          }
          return c;
        })
      );
      
      setFilteredCustomers(prev => 
        prev.map(c => {
          if (c.id === customerId) {
            const updatedFilterDates = [...c.filterDates];
            updatedFilterDates[filterIndex] = {
              ...updatedFilterDates[filterIndex],
              isChanged: true,
              changeDate: new Date(),
            };
            return { ...c, filterDates: updatedFilterDates };
          }
          return c;
        })
      );
      
      toast.success('Filtre değişimi kaydedildi');
    } else {
      toast.error('Filtre değişimi kaydedilirken bir hata oluştu');
    }
  };

  const getFilterStatus = (filterChange: FilterChange): FilterStatus => {
    const today = startOfDay(new Date());
    const filterDate = startOfDay(new Date(filterChange.date));
    
    if (filterChange.isChanged) {
      return FilterStatus.COMPLETED;
    }
    
    if (isSameDay(today, filterDate)) {
      return FilterStatus.PLANNED;
    } else if (isAfter(today, filterDate)) {
      return FilterStatus.OVERDUE;
    } else {
      return FilterStatus.PLANNED;
    }
  };

  const getNextFilterChange = (customer: Customer): FilterChange | null => {
    const today = new Date();
    
    // Find the next filter change that isn't completed yet
    const nextFilter = customer.filterDates
      .filter(filter => !filter.isChanged || isAfter(filter.date, today))
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      
    return nextFilter || null;
  };

  const searchCustomers = (query: string): Customer[] => {
    if (!query.trim()) {
      return customers;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    
    return customers.filter(customer => {
      return (
        customer.name.toLowerCase().includes(lowercaseQuery) ||
        customer.surname.toLowerCase().includes(lowercaseQuery) ||
        customer.address.toLowerCase().includes(lowercaseQuery) ||
        `${customer.name} ${customer.surname}`.toLowerCase().includes(lowercaseQuery)
      );
    });
  };

  return (
    <CustomerContext.Provider 
      value={{ 
        customers, 
        addCustomer, 
        updateCustomer, 
        deleteCustomer,
        markFilterChanged,
        getFilterStatus,
        getNextFilterChange,
        searchCustomers,
        filteredCustomers,
        setFilteredCustomers,
        isLoading,
        refreshCustomers
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
