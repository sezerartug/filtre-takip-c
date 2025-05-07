
import React from "react";
import { Customer, FilterStatus } from "@/types";
import { useCustomers } from "@/context/CustomerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  formatDate, 
  getStatusIcon, 
  getStatusText,
  getStatusColor,
  getStatusBgColor 
} from "@/utils/helpers";
import { Edit, Trash, Check } from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const CustomerCard = ({ customer, onEdit, onDelete }: CustomerCardProps) => {
  const { getFilterStatus, getNextFilterChange, markFilterChanged } = useCustomers();
  
  const nextFilter = getNextFilterChange(customer);
  const nextFilterStatus = nextFilter ? getFilterStatus(nextFilter) : null;
  
  // Find the last changed filter
  const lastChangedFilter = [...customer.filterDates]
    .filter(filter => filter.isChanged)
    .sort((a, b) => {
      if (a.changeDate && b.changeDate) {
        return b.changeDate.getTime() - a.changeDate.getTime();
      }
      return 0;
    })[0];
  
  // Find the index of the next filter that needs changing
  const nextFilterIndex = customer.filterDates.findIndex(filter => 
    filter === nextFilter
  );

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{customer.name} {customer.surname}</h3>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(customer)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(customer)}
              className="h-8 w-8 text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">{customer.address}</p>
        
        <div className="flex flex-col gap-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Satın alma:</span>
            <span className="text-sm">{formatDate(customer.purchaseDate)}</span>
          </div>
          
          {lastChangedFilter && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Son değişim:</span>
              <span className="text-sm">{lastChangedFilter.changeDate ? formatDate(lastChangedFilter.changeDate) : "-"}</span>
            </div>
          )}
          
          {nextFilter && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sonraki değişim:</span>
              <span className="text-sm">{formatDate(nextFilter.date)}</span>
            </div>
          )}
          
          {nextFilterStatus && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">Durum:</span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(nextFilterStatus)} ${getStatusColor(nextFilterStatus)}`}>
                {getStatusIcon(nextFilterStatus)} {getStatusText(nextFilterStatus)}
              </div>
            </div>
          )}
        </div>
        
        {nextFilter && !nextFilter.isChanged && nextFilterIndex !== -1 && (
          <Button 
            className="w-full mt-3"
            onClick={() => markFilterChanged(customer.id, nextFilterIndex)}
            size="sm"
          >
            <Check className="mr-2 h-4 w-4" /> Filtre Değişimini Kaydet
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
