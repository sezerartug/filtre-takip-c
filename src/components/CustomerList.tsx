import React, { useState } from "react";
import { useCustomers } from "@/context/CustomerContext";
import CustomerCard from "./CustomerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CustomerForm } from "./CustomerForm";
import FilterDetails from "./FilterDetails";
import { Customer, FilterStatus } from "@/types";
import { Search, Plus, FileText, Info, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToPDF } from "@/utils/pdfExport";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/utils/helpers";
import { addMonths, isEqual, isSameDay, startOfDay, isBefore, isAfter } from "date-fns";

const CustomerList = () => {
  const { customers, filteredCustomers, searchCustomers, setFilteredCustomers, deleteCustomer, getFilterStatus } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFilteredCustomers(searchCustomers(query));
  };
  
  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredCustomers(customers);
  };
  
  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedCustomer) {
      deleteCustomer(selectedCustomer.id);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleExportToPDF = () => {
    let customersToExport = filteredCustomers;
    
    if (activeTab === "planned") {
      customersToExport = getPlannedCustomers();
    } else if (activeTab === "overdue") {
      customersToExport = getOverdueCustomers();
    }
    
    exportToPDF(customersToExport);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Planlanan filtre değişimi olan müşterileri filtrele (satın alma tarihinden 6 ay sonra)
  const getPlannedCustomers = () => {
    const today = startOfDay(new Date());
    
    return customers.filter(customer => {
      // Henüz değiştirilmemiş filtreleri bul
      const uncompletedFilters = customer.filterDates.filter(filter => !filter.isChanged);
      
      // Her bir değiştirilmemiş filtre için kontrol et
      for (const filter of uncompletedFilters) {
        const filterDate = startOfDay(new Date(filter.date));
        
        // Bugün tam olarak filtre değişim günü mü?
        if (isSameDay(filterDate, today)) {
          return true;
        }
      }
      
      return false;
    });
  };
  
  // Geciken filtre değişimi olan müşterileri filtrele
  const getOverdueCustomers = () => {
    const today = startOfDay(new Date());
    
    return customers.filter(customer => {
      // Henüz değiştirilmemiş filtreleri bul
      const uncompletedFilters = customer.filterDates.filter(filter => !filter.isChanged);
      
      // Her bir değiştirilmemiş filtre için kontrol et
      for (const filter of uncompletedFilters) {
        const filterDate = startOfDay(new Date(filter.date));
        
        // Filtre değişim günü geçmiş mi?
        if (isAfter(today, filterDate)) {
          return true;
        }
      }
      
      return false;
    });
  };
  
  // İlgili tab için müşteri listesini elde et
  const getCustomersForActiveTab = () => {
    switch (activeTab) {
      case "planned":
        return getPlannedCustomers();
      case "overdue":
        return getOverdueCustomers();
      case "all":
      default:
        return filteredCustomers;
    }
  };
  
  const customersToShow = getCustomersForActiveTab();
  
  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Müşteri ara..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleClearSearch}>
            <span className="sr-only">Aramayı temizle</span>
            &#x2715;
          </Button>
          <Button size="icon" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Yeni müşteri ekle</span>
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {customersToShow.length} müşteri
          </span>
          <Button variant="outline" size="sm" onClick={handleExportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Olarak İndir
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">Tüm Müşteriler</TabsTrigger>
          <TabsTrigger value="planned" className="flex-1">Planlanan</TabsTrigger>
          <TabsTrigger value="overdue" className="flex-1">Geciken</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <div key={customer.id}>
                <CustomerCard 
                  customer={customer}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Müşteri bulunamadı</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="planned" className="mt-0">
          {getPlannedCustomers().length > 0 ? (
            getPlannedCustomers().map(customer => (
              <div key={customer.id}>
                <CustomerCard 
                  customer={customer}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Planlanan filtre değişimi olan müşteri bulunamadı</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-0">
          {getOverdueCustomers().length > 0 ? (
            getOverdueCustomers().map(customer => (
              <div key={customer.id}>
                <CustomerCard 
                  customer={customer}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Geciken filtre değişimi olan müşteri bulunamadı</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialoglar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
          </DialogHeader>
          <CustomerForm onClose={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Müşteri Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm 
              customer={selectedCustomer} 
              onClose={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCustomer?.name} {selectedCustomer?.surname} adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerList;
