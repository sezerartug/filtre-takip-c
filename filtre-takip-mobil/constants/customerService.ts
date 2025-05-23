import { supabase } from './supabase';
import { Customer } from './types';
import uuid from 'react-native-uuid';

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;
  // filterDates kısmı şimdilik boş
  return (data || []).map((item: any) => ({ ...item, filterDates: [] }));
}

export async function addCustomerToDb(customer: Omit<Customer, "id" | "filterDates">): Promise<Customer | null> {
  const newCustomerId = uuid.v4();
  const { data, error } = await supabase
    .from('customers')
    .insert({
      id: newCustomerId,
      name: customer.name,
      surname: customer.surname,
      address: customer.address,
      purchase_date: customer.purchaseDate
    })
    .select()
    .single();
  if (error) throw error;
  return data ? { ...data, filterDates: [] } : null;
} 