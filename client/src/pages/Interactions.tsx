import { useQuery } from "@tanstack/react-query";
import { Client, Interaction } from "@shared/schema";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import InteractionForm from "@/components/forms/InteractionForm";
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";

export default function Interactions() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const [interactionToEdit, setInteractionToEdit] = useState<Interaction | null>(null);

  // Fetch all clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch interactions for selected client
  const { data: interactions = [], isLoading } = useQuery<Interaction[]>({
    queryKey: [`/api/clients/${selectedClientId}/interactions`],
    enabled: !!selectedClientId,
  });

  const handleAddInteraction = () => {
    setInteractionToEdit(null);
    setIsInteractionFormOpen(true);
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setInteractionToEdit(interaction);
    setIsInteractionFormOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Interactions</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage communication and interactions with your clients
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleAddInteraction} disabled={!selectedClientId}>
            <Plus className="h-5 w-5 mr-2" />
            Add Interaction
          </Button>
        </div>
      </div>

      {/* Client Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select a Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select onValueChange={setSelectedClientId} value={selectedClientId || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client to view interactions" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.firstName} {client.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedClientId
              ? `Interactions for ${
                  clients.find(
                    (c) => c.id.toString() === selectedClientId
                  )?.firstName
                } ${
                  clients.find(
                    (c) => c.id.toString() === selectedClientId
                  )?.lastName
                }`
              : "Interactions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedClientId ? (
            <div className="text-center py-8 text-neutral-500">
              <p>Please select a client to view their interactions</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-4">Loading interactions...</div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p>No interactions found for this client</p>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interactions.map((interaction) => (
                  <TableRow key={interaction.id}>
                    <TableCell className="capitalize">{interaction.type}</TableCell>
                    <TableCell>{interaction.title}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {interaction.description}
                    </TableCell>
                    <TableCell>{new Date(interaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditInteraction(interaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
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

      {/* Interaction Form Dialog */}
      <Dialog open={isInteractionFormOpen} onOpenChange={setIsInteractionFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <InteractionForm
            onSuccess={() => setIsInteractionFormOpen(false)}
            interaction={interactionToEdit}
            clientId={selectedClientId ? parseInt(selectedClientId) : undefined}
            clients={clients}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
