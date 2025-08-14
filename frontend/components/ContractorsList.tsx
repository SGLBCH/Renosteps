import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Phone, Mail, Building, DollarSign, FileText } from "lucide-react";
import { ContractorDialog } from "./ContractorDialog";
import backend from "~backend/client";
import type { Contractor } from "~backend/contractors/types";

export function ContractorsList() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContractors = async () => {
    try {
      const response = await backend.contractors.list();
      setContractors(response.contractors);
    } catch (error) {
      console.error("Error fetching contractors:", error);
      toast({
        title: "Error",
        description: "Failed to load contractors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contractor?")) {
      return;
    }

    try {
      await backend.contractors.deleteContractor({ id });
      toast({
        title: "Success",
        description: "Contractor deleted successfully",
      });
      fetchContractors();
    } catch (error) {
      console.error("Error deleting contractor:", error);
      toast({
        title: "Error",
        description: "Failed to delete contractor",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contractors</h3>
        <div className="text-center py-8 text-muted-foreground">
          Loading contractors...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contractors</h3>
      </div>
      
      <div className="space-y-3">
        {contractors.map((contractor) => (
          <div 
            key={contractor.id}
            className="bg-secondary rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-lg">{contractor.name}</div>
                  <div className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                    {contractor.role}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {contractor.phone}
                  </div>
                  
                  {contractor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {contractor.email}
                    </div>
                  )}
                  
                  {contractor.company && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {contractor.company}
                    </div>
                  )}
                  
                  {contractor.hourlyRate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      ${contractor.hourlyRate}/hr
                    </div>
                  )}
                </div>
                
                {contractor.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{contractor.notes}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 ml-4">
                <ContractorDialog 
                  contractor={contractor} 
                  onContractorChange={fetchContractors}
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(contractor.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <ContractorDialog onContractorChange={fetchContractors} />
      </div>
    </div>
  );
}
