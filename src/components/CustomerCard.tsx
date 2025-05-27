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
import { Edit, Trash, Check, Calendar, Clock, MapPin } from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onNameClick?: (customer: Customer) => void;
}

const CustomerCard = ({ customer, onEdit, onDelete, onNameClick }: CustomerCardProps) => {
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

  const handleFilterChange = () => {
    if (nextFilterIndex !== -1) {
      markFilterChanged(customer.id, nextFilterIndex);
    }
  };

  return (
    <Card className="overflow-hidden card-hover rounded-xl border-input/50">
      <CardContent className="p-0">
        <div className="relative">
          {/* Customer banner with gradient */}
          <div className="h-3 bg-gradient-to-r from-primary to-primary/60"></div>
          
          {/* Main content */}
          <div className="p-5">
            <div className="flex justify-between items-start">
              <button
                className="text-lg font-medium hover:underline text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
                style={{ background: "none" }}
                onClick={() => onNameClick && onNameClick(customer)}
                type="button"
              >
                {customer.name} {customer.surname}
              </button>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEdit(customer)}
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDelete(customer)}
                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
              {customer.address}
            </p>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <span className="inline-block w-4 mr-1.5">📞</span>
              {customer.phone}
            </p>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
                  Satın alma:
                </span>
                <span className="text-sm font-medium">{formatDate(customer.purchaseDate)}</span>
              </div>
              
              {lastChangedFilter && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
                    Son değişim:
                  </span>
                  <span className="text-sm font-medium">{lastChangedFilter.changeDate ? formatDate(lastChangedFilter.changeDate) : "-"}</span>
                </div>
              )}
              
              {nextFilter && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
                    Sonraki değişim:
                  </span>
                  <span className="text-sm font-medium">{formatDate(nextFilter.date)}</span>
                </div>
              )}
              
              {nextFilterStatus && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Durum:</span>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBgColor(nextFilterStatus)} ${getStatusColor(nextFilterStatus)}`}>
                    {getStatusIcon(nextFilterStatus)} {getStatusText(nextFilterStatus)}
                  </div>
                </div>
              )}
            </div>
            
            {nextFilter && !nextFilter.isChanged && nextFilterIndex !== -1 && (
              <Button 
                className="w-full mt-4 rounded-lg"
                onClick={handleFilterChange}
                size="sm"
              >
                <Check className="mr-2 h-4 w-4" /> Filtre Değişimini Kaydet
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
