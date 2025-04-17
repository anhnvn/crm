import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Client, Interaction, AuditLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { ArrowLeft, Edit, Plus, Trash2, Phone, Mail, Calendar, MessageSquare } from "lucide-react";
import ClientForm from "@/components/forms/ClientForm";
import InteractionForm from "@/components/forms/InteractionForm";
import ActivityFeed from "@/components/ActivityFeed";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AvatarInitials from "@/components/ui/avatar-initials";

export default function ClientDetails() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const clientId = parseInt(id, 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const [interactionToEdit, setInteractionToEdit] = useState<Interaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);

  const { data: client, isLoading: isLoadingClient } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !isNaN(clientId),
  });

  const { data: interactions = [], isLoading: isLoadingInteractions } = useQuery<Interaction[]>({
    queryKey: [`/api/clients/${clientId}/interactions`],
    enabled: !isNaN(clientId),
  });

  const { data: auditLogs = [], isLoading: isLoadingLogs } = useQuery<AuditLog[]>({
    queryKey: [`/api/clients/${clientId}/audit-logs`],
    enabled: !isNaN(clientId),
  });

  if (isNaN(clientId)) {
    return <div>Invalid client ID</div>;
  }

  if (isLoadingClient) {
    return <div className="p-8 text-center">Loading client information...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center">Client not found</div>;
  }

  const handleEditInteraction = (interaction: Interaction) => {
    setInteractionToEdit(interaction);
    setIsInteractionFormOpen(true);
  };

  const handleAddInteraction = () => {
    setInteractionToEdit(null);
    setIsInteractionFormOpen(true);
  };

  const handleDeleteInteraction = async () => {
    if (!interactionToDelete) return;

    try {
      await apiRequest("DELETE", `/api/interactions/${interactionToDelete.id}`);
      
      toast({
        title: "Interaction deleted",
        description: "The interaction has been successfully deleted.",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/interactions`] });
      setInteractionToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete interaction",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      {/* Header with back button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Client Information Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <AvatarInitials 
            name={`${client.firstName} ${client.lastName}`} 
            size="lg"
            className="mr-4"
          />
          <div>
            <h2 className="text-2xl font-semibold text-neutral-800">
              {client.firstName} {client.lastName}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {client.tripType || "No trip type specified"}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button variant="outline" onClick={() => setIsClientFormOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
          <Button onClick={handleAddInteraction}>
            <Plus className="h-4 w-4 mr-2" />
            Add Interaction
          </Button>
        </div>
      </div>

      {/* Client Details and Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-sm">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-sm">
                  Client since {new Date(client.createdAt).toLocaleDateString()}
                </span>
              </div>
              {client.notes && (
                <div className="pt-4 border-t border-neutral-200">
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-neutral-600">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed for client */}
          <div className="mt-6">
            <ActivityFeed 
              logs={auditLogs} 
              showViewAll={false}
              maxHeight="600px"
            />
          </div>
        </div>

        {/* Interactions */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="interactions">
            <TabsList>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="interactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interactions</CardTitle>
                  <CardDescription>
                    Communication history with {client.firstName} {client.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingInteractions ? (
                    <div className="text-center py-4">Loading interactions...</div>
                  ) : interactions.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                      <p>No interactions yet</p>
                      <Button onClick={handleAddInteraction} variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Interaction
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interactions.map((interaction) => (
                          <TableRow key={interaction.id}>
                            <TableCell className="capitalize">{interaction.type}</TableCell>
                            <TableCell>{interaction.title}</TableCell>
                            <TableCell>
                              {new Date(interaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditInteraction(interaction)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setInteractionToDelete(interaction);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client History</CardTitle>
                  <CardDescription>
                    Timeline of bookings and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-neutral-500">
                    <p>No booking history available</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Client Form Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <ClientForm
            onSuccess={() => setIsClientFormOpen(false)}
            client={client}
          />
        </DialogContent>
      </Dialog>

      {/* Interaction Form Dialog */}
      <Dialog open={isInteractionFormOpen} onOpenChange={setIsInteractionFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <InteractionForm
            onSuccess={() => setIsInteractionFormOpen(false)}
            interaction={interactionToEdit}
            clientId={clientId}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Interaction Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the interaction
              {interactionToDelete && ` "${interactionToDelete.title}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInteraction} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
