
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Customer, FilterChange, FilterStatus } from '../types';
import { format, addMonths, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

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

  // Verileri yükleme efekti - bunu daha sonra gerçek Supabase veritabanıyla değiştireceğiz
  useEffect(() => {
    // localStorage veya veritabanından yükleme simülasyonu
    const loadSavedCustomers = () => {
      // Önce localStorage'dan yükleme yapalım, Supabase bağlantısı eklenince bu kısım değişecek
      const savedCustomers = localStorage.getItem('customers');
      if (savedCustomers) {
        try {
          const parsed = JSON.parse(savedCustomers);
          // String tarihleri Date nesnelerine dönüştür
          const customers = parsed.map((customer: any) => ({
            ...customer,
            purchaseDate: new Date(customer.purchaseDate),
            filterDates: customer.filterDates.map((filter: any) => ({
              ...filter,
              date: new Date(filter.date),
              changeDate: filter.changeDate ? new Date(filter.changeDate) : undefined,
            })),
          }));
          setCustomers(customers);
          setFilteredCustomers(customers);
          
          // Eğer mobil cihazda çalışıyorsa bildirim göster
          if (Capacitor.isNativePlatform()) {
            toast.info(`${customers.length} müşteri yüklendi`, { 
              duration: 3000 
            });
          }
        } catch (error) {
          console.error('Müşteri verilerini ayrıştırma hatası:', error);
        }
      }
      setIsLoading(false);
    };

    // Ağ gecikmesi simülasyonu
    setTimeout(() => {
      loadSavedCustomers();
    }, 800);
  }, []);

  // Müşteriler değiştiğinde localStorage'a kaydet
  // Not: Supabase entegrasyonundan sonra bu fonksiyon Supabase'e kaydetme işlemi yapacak
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('customers', JSON.stringify(customers));
      
      // Supabase bağlantısı eklendikten sonra, burada veritabanına senkronizasyon yapılacak
      // TODO: Supabase bağlantısı eklendiğinde burayı güncelle
    }
  }, [customers, isLoading]);

  const generateFilterDates = (purchaseDate: Date): FilterChange[] => {
    const filterDates: FilterChange[] = [];
    // Generate 10 filter changes, 6 months apart
    for (let i = 0; i < 10; i++) {
      filterDates.push({
        date: addMonths(purchaseDate, (i + 1) * 6),
        isChanged: false,
      });
    }
    return filterDates;
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'filterDates'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: uuidv4(),
      filterDates: generateFilterDates(customerData.purchaseDate),
    };

    setCustomers(prev => [...prev, newCustomer]);
    setFilteredCustomers(prev => [...prev, newCustomer]);
    toast.success('Müşteri başarıyla eklendi');
  };

  const updateCustomer = (updatedCustomer: Customer) => {
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
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
    setFilteredCustomers(prev => prev.filter(customer => customer.id !== id));
    toast.success('Müşteri silindi');
  };

  const markFilterChanged = (customerId: string, filterIndex: number) => {
    setCustomers(prev => 
      prev.map(customer => {
        if (customer.id === customerId) {
          const updatedFilterDates = [...customer.filterDates];
          updatedFilterDates[filterIndex] = {
            ...updatedFilterDates[filterIndex],
            isChanged: true,
            changeDate: new Date(),
          };
          return { ...customer, filterDates: updatedFilterDates };
        }
        return customer;
      })
    );
    
    setFilteredCustomers(prev => 
      prev.map(customer => {
        if (customer.id === customerId) {
          const updatedFilterDates = [...customer.filterDates];
          updatedFilterDates[filterIndex] = {
            ...updatedFilterDates[filterIndex],
            isChanged: true,
            changeDate: new Date(),
          };
          return { ...customer, filterDates: updatedFilterDates };
        }
        return customer;
      })
    );
    
    toast.success('Filtre değişimi kaydedildi');
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
        isLoading
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
