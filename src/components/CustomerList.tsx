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
import { exportToExcel } from "@/utils/excelExport";
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
  
  const handleExportToExcel = () => {
    let customersToExport = filteredCustomers;
    if (activeTab === "planned") {
      customersToExport = getPlannedCustomers();
    } else if (activeTab === "overdue") {
      customersToExport = getOverdueCustomers();
    }
    exportToExcel(customersToExport);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
    } else {
      setFilteredCustomers(searchCustomers(searchQuery));
    }
  };
  
  // Planlanan filtre değişimi olan müşterileri filtrele
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
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Müşteri ara..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 h-12 rounded-xl border-input/50 focus:border-primary shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleClearSearch}
              className="h-12 w-12 rounded-xl border-input/50"
            >
              <span className="sr-only">Aramayı temizle</span>
              &#x2715;
            </Button>
            <Button 
              size="icon" 
              onClick={handleAddClick}
              className="h-12 w-12 rounded-xl shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Yeni müşteri ekle</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            {customersToShow.length} müşteri listeleniyor
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportToExcel}
            className="rounded-xl h-9 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-2"><path d="M5.884 6.68a.5.5 0 0 1 .09.638l-2.5 4a.5.5 0 1 1-.848-.53l2.5-4a.5.5 0 0 1 .758-.108zm4.232 0a.5.5 0 0 0-.758-.108l-2.5 4a.5.5 0 1 0 .848.53l2.5-4a.5.5 0 0 0-.09-.638z"/><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5zm-1 0A.5.5 0 0 0 12.5 4h-9a.5.5 0 0 0-.5.5V14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5z"/></svg>
            Excel Olarak İndir
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="mt-4"
      >
        <TabsList className="w-full grid grid-cols-3 h-12 p-1 rounded-xl shadow-sm bg-muted/70 backdrop-blur-sm">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:shadow-sm">
            Tüm Müşteriler
          </TabsTrigger>
          <TabsTrigger value="planned" className="rounded-lg data-[state=active]:shadow-sm">
            Planlanan
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-lg data-[state=active]:shadow-sm">
            Geciken
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6 space-y-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, index) => (
              <div key={customer.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                <CustomerCard 
                  customer={customer}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-card border rounded-xl">
              <p className="text-muted-foreground">Müşteri bulunamadı</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="planned" className="mt-6 space-y-4">
          {getPlannedCustomers().length > 0 ? (
            getPlannedCustomers().map((customer, index) => (
              <div key={customer.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                <CustomerCard 
                  customer={customer}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-card border rounded-xl">
              <p className="text-muted-foreground">Planlanan filtre değişimi olan müşteri bulunamadı</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-6 space-y-4">
          {getOverdueCustomers().length > 0 ? (
            getOverdueCustomers().map((customer, index) => (
              <div key={customer.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                <CustomerCard 
                  customer={customer}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-card border rounded-xl">
              <p className="text-muted-foreground">Geciken filtre değişimi olan müşteri bulunamadı</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialoglar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
          </DialogHeader>
          <CustomerForm onClose={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
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
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCustomer?.name} {selectedCustomer?.surname} adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground rounded-xl">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerList;
