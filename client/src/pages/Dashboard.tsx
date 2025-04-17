import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/StatCard";
import ClientTable from "@/components/ClientTable";
import ActivityFeed from "@/components/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Plus, Users, MessageSquare, BarChart3, DollarSign } from "lucide-react";
import { useState } from "react";
import ClientForm from "@/components/forms/ClientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Client, AuditLog } from "@shared/schema";

export default function Dashboard() {
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Fetch recent clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch audit logs for activity feed
  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsClientFormOpen(true);
  };

  const handleAddClient = () => {
    setClientToEdit(null);
    setIsClientFormOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Dashboard</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Overview of clients, interactions, and recent activities
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleAddClient} className="bg-primary-500 hover:bg-primary-600">
            <Plus className="h-5 w-5 mr-2" />
            Add New Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Clients"
          value={clients.length}
          icon={<Users />}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          trend={{ value: "7.2%", isPositive: true }}
        />
        <StatCard
          title="Interactions (30d)"
          value="512"
          icon={<MessageSquare />}
          iconBgColor="bg-secondary-100"
          iconColor="text-secondary-500"
          trend={{ value: "12.5%", isPositive: true }}
        />
        <StatCard
          title="Conversion Rate"
          value="24.8%"
          icon={<BarChart3 />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          trend={{ value: "2.1%", isPositive: false }}
        />
        <StatCard
          title="Sales Value (30d)"
          value="$148,250"
          icon={<DollarSign />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          trend={{ value: "8.3%", isPositive: true }}
        />
      </div>

      {/* Client and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clients */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium leading-6 text-neutral-900">
                  Recent Clients
                </h3>
                <a
                  href="/clients"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all
                </a>
              </div>
            </div>
            <ClientTable
              clients={clients.slice(0, 5)}
              onEdit={handleEditClient}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <ActivityFeed logs={auditLogs.slice(0, 5)} />
        </div>
      </div>

      {/* Client Form Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <ClientForm
            onSuccess={() => setIsClientFormOpen(false)}
            client={clientToEdit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
