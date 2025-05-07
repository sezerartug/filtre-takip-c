
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
import { Check } from "lucide-react";

interface FilterDetailsProps {
  customer: Customer;
}

const FilterDetails = ({ customer }: FilterDetailsProps) => {
  const { getFilterStatus, markFilterChanged } = useCustomers();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Filtre Takip Detayları</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customer.filterDates.map((filter, index) => {
            const status = getFilterStatus(filter);
            return (
              <div key={index} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{(index + 1)}. Filtre</span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(status)} ${getStatusColor(status)}`}>
                    {getStatusIcon(status)} {getStatusText(status)}
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Planlanan Tarih:</span>
                    <span>{formatDate(filter.date)}</span>
                  </div>
                  
                  {filter.isChanged && filter.changeDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Değişim Tarihi:</span>
                      <span>{formatDate(filter.changeDate)}</span>
                    </div>
                  )}
                  
                  {!filter.isChanged && (
                    <Button 
                      className="w-full mt-2"
                      onClick={() => markFilterChanged(customer.id, index)}
                      size="sm"
                    >
                      <Check className="mr-2 h-4 w-4" /> Değişimi Kaydet
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterDetails;
