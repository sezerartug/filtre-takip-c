import React, { useState } from "react";
import { useCustomers } from "@/context/CustomerContext";
import CustomerCard from "./CustomerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CustomerForm } from "./CustomerForm";
import FilterDetails from "./FilterDetails";
import { Customer } from "@/types";
import { Search, Plus, FileText, Info, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToPDF } from "@/utils/pdfExport";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/utils/helpers";

const CustomerList = () => {
  const { customers, filteredCustomers, searchCustomers, setFilteredCustomers, deleteCustomer } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
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
  
  const handleDetailsClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
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
    exportToPDF(filteredCustomers);
  };
  
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
            {filteredCustomers.length} müşteri
          </span>
          <Button variant="outline" size="sm" onClick={handleExportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Olarak İndir
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">Tüm Müşteriler</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">Bekleyen</TabsTrigger>
          <TabsTrigger value="overdue" className="flex-1">Geciken</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <div key={customer.id} onClick={() => handleDetailsClick(customer)}>
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
        
        <TabsContent value="pending" className="mt-0">
          {/* Pending filters filtering logic will go here */}
          <div className="text-center py-8">
            <p className="text-muted-foreground">Bu özellik henüz tamamlanmadı</p>
          </div>
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-0">
          {/* Overdue filters filtering logic will go here */}
          <div className="text-center py-8">
            <p className="text-muted-foreground">Bu özellik henüz tamamlanmadı</p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* İlgili dialoglar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
          </DialogHeader>
          <CustomerForm onClose={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
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
      
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteri Bilgileri</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Müşteri bilgileri kartı */}
              <Card>
                <CardContent className="pt-6">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Ad Soyad:</dt>
                      <dd className="text-sm">{selectedCustomer.name} {selectedCustomer.surname}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Adres:</dt>
                      <dd className="text-sm text-right">{selectedCustomer.address}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Satın Alma Tarihi:</dt>
                      <dd className="text-sm">{formatDate(selectedCustomer.purchaseDate)}</dd>
                    </div>
                  </dl>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Düzenle
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Filtre detayları */}
              <FilterDetails customer={selectedCustomer} />
            </div>
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
