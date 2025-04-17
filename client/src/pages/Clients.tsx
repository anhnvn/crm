import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ClientForm from "@/components/forms/ClientForm";
import ClientTable from "@/components/ClientTable";
import { Client } from "@shared/schema";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  
  // Fetch clients with search if query is provided
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/clients?q=${encodeURIComponent(searchQuery)}` 
        : "/api/clients";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    },
  });

  const handleAddClient = () => {
    setClientToEdit(null);
    setIsAddClientOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsAddClientOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will be updated and the useQuery hook will refetch
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Clients</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your client database and contact information
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleAddClient}>
            <Plus className="h-5 w-5 mr-2" />
            Add New Client
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              type="text"
              placeholder="Search clients by name, email, or phone"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Clients Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading clients...</div>
      ) : (
        <ClientTable clients={clients} onEdit={handleEditClient} />
      )}

      {/* Add/Edit Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <ClientForm
            onSuccess={() => setIsAddClientOpen(false)}
            client={clientToEdit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
