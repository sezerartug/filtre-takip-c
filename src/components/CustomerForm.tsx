
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Customer, FilterStatus } from "@/types";
import { useCustomers } from "@/context/CustomerContext";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { getStatusBgColor, getStatusColor, getStatusIcon, getStatusText, formatDate } from "@/utils/helpers";

interface CustomerFormProps {
  customer?: Customer;
  onClose: () => void;
}

type FormValues = {
  name: string;
  surname: string;
  address: string;
  purchaseDate: Date;
};

export const CustomerForm = ({ customer, onClose }: CustomerFormProps) => {
  const { addCustomer, updateCustomer, getFilterStatus, getNextFilterChange } = useCustomers();
  const [date, setDate] = useState<Date | undefined>(customer?.purchaseDate);
  
  const form = useForm<FormValues>({
    defaultValues: {
      name: customer?.name || "",
      surname: customer?.surname || "",
      address: customer?.address || "",
      purchaseDate: customer?.purchaseDate || new Date(),
    },
  });

  const onSubmit = (data: FormValues) => {
    if (customer) {
      updateCustomer({
        ...customer,
        name: data.name,
        surname: data.surname,
        address: data.address,
        purchaseDate: data.purchaseDate,
      });
    } else {
      addCustomer(data);
    }
    onClose();
  };

  // Eğer mevcut müşteri varsa, bir sonraki filtre değişimini al
  const nextFilter = customer ? getNextFilterChange(customer) : null;
  const nextFilterStatus = nextFilter ? getFilterStatus(nextFilter) : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Ad gereklidir" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad</FormLabel>
              <FormControl>
                <Input placeholder="Ad" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="surname"
          rules={{ required: "Soyad gereklidir" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Soyad</FormLabel>
              <FormControl>
                <Input placeholder="Soyad" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          rules={{ required: "Adres gereklidir" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres</FormLabel>
              <FormControl>
                <Input placeholder="Adres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="purchaseDate"
          rules={{ required: "Satın alma tarihi gereklidir" }}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Satın Alma Tarihi</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setDate(date);
                    }}
                    initialFocus
                    locale={tr}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {customer && nextFilter && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium mb-2">Bir Sonraki Filtre Durumu</h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> 
                  <span className="text-sm">{formatDate(nextFilter.date)}</span>
                </div>
                {nextFilterStatus && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
                    ${getStatusBgColor(nextFilterStatus)} ${getStatusColor(nextFilterStatus)}`}>
                    {getStatusIcon(nextFilterStatus)} {getStatusText(nextFilterStatus)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">
            {customer ? 'Güncelle' : 'Ekle'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
