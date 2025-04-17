import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { insertInteractionSchema, type Interaction, type Client } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Override the schema with a custom form schema that uses string for date
const interactionFormSchema = z.object({
  type: z.enum(["call", "email", "meeting", "note", "other"]),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  date: z.coerce.date().min(new Date('1900-01-01'), "Date is required"),
  clientId: z.number().int().positive("Client ID is required"),
});

type InteractionFormValues = z.infer<typeof interactionFormSchema>;

interface InteractionFormProps {
  interaction?: Interaction | null;
  clientId?: number;
  clients?: Client[];
  onSuccess: () => void;
}

export default function InteractionForm({ 
  interaction, 
  clientId, 
  clients = [], 
  onSuccess 
}: InteractionFormProps) {
  const isEditing = !!interaction;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Format date for input
  const formatDateForInput = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Default values for the form
  const defaultValues: InteractionFormValues = {
    type: interaction?.type ?? "call",
    title: interaction?.title ?? "",
    description: interaction?.description ?? "",
    date: formatDateForInput(interaction?.date ?? new Date()),
    clientId: interaction?.clientId ?? clientId ?? (clients[0]?.id ?? 0),
  };

  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: InteractionFormValues) => {
    try {
      const submissionData = values;
      
      if (isEditing) {
        await apiRequest("PUT", `/api/interactions/${interaction.id}`, submissionData);
        toast({
          title: "Interaction updated",
          description: "The interaction has been updated successfully.",
        });
      } else {
        await apiRequest("POST", `/api/clients/${values.clientId}/interactions`, submissionData);
        toast({
          title: "Interaction added",
          description: "The interaction has been added successfully.",
        });
      }
      
      // Invalidate queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${values.clientId}/interactions`] });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Interaction" : "Add New Interaction"}</DialogTitle>
        <DialogDescription>
          {isEditing 
            ? "Update the details of this client interaction." 
            : "Record a new interaction with your client."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Client Selection (only show if clientId is not provided) */}
          {!clientId && clients.length > 0 && (
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Interaction Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interaction Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an interaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter interaction title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the interaction details" 
                    className="resize-none h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? isEditing ? "Updating..." : "Adding..."
                : isEditing ? "Update Interaction" : "Add Interaction"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
