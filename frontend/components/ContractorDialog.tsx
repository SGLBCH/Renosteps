import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit } from "lucide-react";
import { useBackend } from "./AuthenticatedBackend";
import type { Contractor, CreateContractorRequest } from "~backend/contractors/types";

interface ContractorDialogProps {
  contractor?: Contractor;
  onContractorChange: () => void;
  trigger?: React.ReactNode;
}

export function ContractorDialog({ contractor, onContractorChange, trigger }: ContractorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();
  
  const [formData, setFormData] = useState<CreateContractorRequest>({
    name: "",
    role: "",
    phone: "",
    email: "",
    company: "",
    hourlyRate: undefined,
    notes: "",
  });

  useEffect(() => {
    if (contractor) {
      setFormData({
        name: contractor.name,
        role: contractor.role,
        phone: contractor.phone,
        email: contractor.email || "",
        company: contractor.company || "",
        hourlyRate: contractor.hourlyRate,
        notes: contractor.notes || "",
      });
    } else {
      setFormData({
        name: "",
        role: "",
        phone: "",
        email: "",
        company: "",
        hourlyRate: undefined,
        notes: "",
      });
    }
  }, [contractor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (contractor) {
        await backend.contractors.update({
          id: contractor.id,
          ...formData,
          hourlyRate: formData.hourlyRate || undefined,
        });
        toast({
          title: "Success",
          description: "Contractor updated successfully",
        });
      } else {
        await backend.contractors.create({
          ...formData,
          hourlyRate: formData.hourlyRate || undefined,
        });
        toast({
          title: "Success",
          description: "Contractor created successfully",
        });
      }
      
      setOpen(false);
      onContractorChange();
    } catch (error) {
      console.error("Error saving contractor:", error);
      toast({
        title: "Error",
        description: "Failed to save contractor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = contractor ? (
    <Button variant="ghost" size="sm">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="outline" className="w-full border-dashed">
      <Plus className="h-4 w-4 mr-2" />
      Add Contractor
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {contractor ? "Edit Contractor" : "Add New Contractor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : contractor ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
