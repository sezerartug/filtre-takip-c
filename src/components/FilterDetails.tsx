
import React from "react";
import { Customer, FilterChange } from "@/types";
import { useCustomers } from "@/context/CustomerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  formatDate, 
  getStatusIcon, 
  getStatusText,
  getStatusColor,
  getStatusBgColor 
} from "@/utils/helpers";
import { Check, Filter } from "lucide-react";

interface FilterDetailsProps {
  customer: Customer;
}

const FilterDetails = ({ customer }: FilterDetailsProps) => {
  const { getFilterStatus, markFilterChanged } = useCustomers();
  
  // Filtre değişimlerini duruma göre gruplayarak düzenleme
  const filtersByStatus = {
    upcoming: [] as {filter: FilterChange, index: number}[],
    completed: [] as {filter: FilterChange, index: number}[]
  };
  
  customer.filterDates.forEach((filter, index) => {
    const status = getFilterStatus(filter);
    if (filter.isChanged) {
      filtersByStatus.completed.push({filter, index});
    } else {
      filtersByStatus.upcoming.push({filter, index});
    }
  });
  
  // Yaklaşan ilk 2 filtreyi göster (daha kompakt görünüm)
  const upcomingFilters = filtersByStatus.upcoming.slice(0, 2);

  const handleFilterChange = (index: number) => {
    markFilterChanged(customer.id, index);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Filtre Durumu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Toplam {customer.filterDates.length} filtre planı</span>
            <span>{filtersByStatus.completed.length} tamamlandı</span>
          </div>
          
          {/* Sadece yakın zamandaki filtreleri göster */}
          <div className="font-medium mb-2">Yaklaşan Değişimler</div>
          {upcomingFilters.length > 0 ? (
            upcomingFilters.map(({filter, index}) => {
              const status = getFilterStatus(filter);
              return (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" /> 
                      <span>Sonraki Değişim</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(status)} ${getStatusColor(status)}`}>
                      {getStatusIcon(status)} {getStatusText(status)}
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Planlanan Tarih:</span>
                      <span>{formatDate(filter.date)}</span>
                    </div>
                    
                    <Button 
                      className="w-full mt-2"
                      onClick={() => handleFilterChange(index)}
                      size="sm"
                      variant="default"
                    >
                      <Check className="mr-2 h-4 w-4" /> Değişimi Kaydet
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              Tüm filtre değişimleri tamamlandı.
            </div>
          )}
          
          {/* En son değişim bilgisi */}
          {filtersByStatus.completed.length > 0 && (
            <>
              <div className="font-medium mb-2">Son Değişim</div>
              <div className="text-sm bg-muted/50 rounded-md p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Değişim Tarihi:</span>
                  <span>{formatDate(filtersByStatus.completed[0].filter.changeDate!)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterDetails;
